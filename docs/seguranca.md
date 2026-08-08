# Segurança — como o conteúdo pago é protegido

Este documento explica **onde** o conteúdo pago é protegido, **o que quebra** se
cada peça for removida, e **o que os testes não cobrem**.

Se você só tem trinta segundos: a única coisa que protege o conteúdo pago é o
Route Handler `GET /api/lesson`. Tudo o mais é conveniência.

---

## As três camadas

| Camada | Arquivo | O que faz | Protege? |
|---|---|---|---|
| Experiência | `middleware.ts` | Redireciona `/formacoes/**` para `/entrar` quando não há cookie de sessão do Clerk | **Não** |
| Autorização | `app/api/lesson/route.ts` | Valida a sessão pelo Clerk e a assinatura por `temAcesso()` antes de devolver o `youtubeId` | **Sim** |
| Estado | `publicMetadata.assinatura` no Clerk | Guarda o status da assinatura, escrito só pelo webhook da Stripe | É o insumo |

### Camada 1 — middleware, experiência

`middleware.ts` olha os cookies e nada mais. Ele não valida o token, não fala
com o Clerk e não conhece o estado da assinatura. Um cookie `__session` com
valor inventado passa por ele — de propósito, e os testes fixam isso.

Ele existe para um problema de interface: as páginas de `/formacoes/**` são
Client Components, então sem middleware um visitante deslogado veria a casca da
área de membros aparecer e sumir. O middleware corta isso antes do render.

**Se alguém apagar:** ninguém ganha acesso a nada. O deslogado passa a ver uma
página de formação com o player travado em "Entre para assistir" em vez de cair
direto no login. É uma regressão de experiência, não de segurança.

**Se alguém "melhorar" para validar token:** o projeto ganha uma chamada de rede
ao Clerk em toda navegação, o custo de latência aparece em todas as páginas, e
não se fecha buraco nenhum — porque o `youtubeId` continua saindo por
`/api/lesson`, que é uma URL que qualquer pessoa chama direto, sem passar por
página nenhuma. Não faça.

### Camada 2 — Route Handler, autorização

`GET /api/lesson?module=<slug>&lesson=<id>` é a fronteira. A cada requisição:

1. Aula com `free: true` → devolve o `youtubeId`, sem consultar o Clerk.
2. Aula paga → `sessaoDeRequest(request)` valida a sessão pelo Clerk.
3. `nao_configurado` → **503**. `anonimo` → **401**. Logado sem
   `temAcesso(status)` → **402**. Só depois disso o `youtubeId` sai.

A regra de acesso não é reimplementada aqui: vem de `temAcesso()` em
`app/lib/tipos.ts`, que é o único lugar do código que compara status. A resposta
leva `Cache-Control: private, no-store`, para que nenhum proxy ou CDN guarde um
`youtubeId` pago e o sirva ao próximo visitante.

**Se alguém apagar ou afrouxar:** o conteúdo pago fica aberto para todo mundo.
Esta é a peça que não pode cair.

### Camada 3 — metadata do Clerk, estado

`publicMetadata.assinatura` guarda o objeto `Assinatura`. É escrito por um lugar
só, `gravarAssinatura()` no webhook da Stripe, usando a `CLERK_SECRET_KEY`. O
navegador lê esse metadata (é público), mas **não consegue escrevê-lo**: a API
de metadata do Clerk exige a chave secreta, que nunca sai do servidor.

`lerAssinatura()` em `app/lib/sessao.ts` é quem interpreta esse metadata. Ela
sanea campo por campo, converte o formato legado (`membership: "active"`) e, em
qualquer entrada malformada, devolve `ASSINATURA_VAZIA` — nunca lança e nunca
inventa acesso.

**Se alguém apagar:** todo mundo vira `status: "nenhuma"` e perde o acesso. Falha
fechada, que é o lado certo de falhar.

**Se `lerAssinatura` parar de converter o formato legado:** todos os usuários
gravados antes do contrato atual perdem o acesso em silêncio, sem erro em lugar
nenhum. Por isso existe um teste dedicado a essa conversão.

---

## Por que Client Components não são uma falha aqui

`app/page.tsx` e `app/formacoes/**` começam com `"use client"`. Isso costuma ser
um sinal de alerta em app pago, e aqui não é. O motivo é o que exatamente está
sendo protegido.

O segredo é o `youtubeId` — o identificador do vídeo no YouTube. Títulos de
aula, durações, capas e a estrutura dos módulos não são segredo: são material de
venda e aparecem na landing. O que não pode vazar é o link do vídeo.

E o `youtubeId` de uma aula paga não está no bundle: ele chega ao navegador
somente pela resposta de `/api/lesson`, depois da checagem de assinatura. O
componente recebe o id já autorizado, monta o `<iframe>` e pronto. Não existe
código no cliente capaz de descobrir o id de uma aula que o servidor recusou.

### A armadilha que mora aqui — leia antes de preencher o conteúdo

`app/content.ts` é importado por Client Components. **Tudo que está nesse
arquivo é baixado pelo navegador**, inclusive de quem nunca pagou. Hoje isso é
inofensivo porque a única aula com `youtubeId` preenchido é a aula gratuita;
todas as pagas estão com `youtubeId: ""`.

No dia em que alguém preencher os ids das aulas pagas em `app/content.ts`, eles
passam a viajar no bundle e `/api/lesson` vira decoração. O teste
"nenhum youtubeId de aula paga aparece no bundle do cliente" quebra nesse exato
momento — é a finalidade dele. A correção não é afrouxar o teste: é mover os ids
das aulas pagas para um módulo que só o servidor importa e que `/api/lesson`
consulta. Pedido registrado em `docs/handoff/para-orquestrador.md`.

---

## O pior caso, e onde ele para

Um atacante decidido consegue:

| Ele consegue | Onde para |
|---|---|
| Ler todo o HTML e todo o JavaScript da área de membros | Não encontra `youtubeId` de aula paga: eles não estão lá |
| Forjar `__session=qualquer-coisa` e passar pelo middleware | A página carrega vazia. `/api/lesson` valida o token de verdade e responde 401 |
| Chamar `/api/lesson` direto, sem passar por página nenhuma | 401 sem sessão, 402 sem assinatura |
| Chamar `/api/lesson` com um token de sessão válido mas sem ter pago | 402. `temAcesso()` só libera `active` e `trialing` |
| Editar `publicMetadata.assinatura` pelo navegador | Não consegue: escrever metadata exige a `CLERK_SECRET_KEY` |
| Mandar `plano` adulterado para `/api/checkout` | O cliente nunca envia price. O servidor resolve o slug em `app/lib/planos.ts` |
| Abrir `/pagamento/sucesso?session_id=...` sem ter pago | Nada é liberado: quem libera é o webhook |
| Forjar uma chamada ao webhook da Stripe | Falha a validação HMAC, 400 |
| Cancelar a assinatura e continuar assistindo | Até o próximo `GET /api/lesson`. Não há cache: `no-store` |
| Compartilhar o `youtubeId` obtido legitimamente com um não-assinante | **Não para.** Ver abaixo |

### O limite conhecido

Um assinante legítimo pode copiar o `youtubeId` que recebeu e repassá-lo. O
vídeo no YouTube é "não listado", não privado — quem tem o link assiste. Isso é
inerente a hospedar vídeo no YouTube e não é resolvido por nenhuma das três
camadas. Se um dia isso virar problema real, a saída é trocar o YouTube por um
provedor com URL assinada e expiração curta, não endurecer o middleware.

---

## O que os testes cobrem

Em `tests/`, rodados por `npm test`. Nenhum toca a rede.

- `temAcesso` — tabela-verdade dos seis status, mais valores fora da união.
- `lerAssinatura` — conversão do formato legado, precedência do formato novo,
  saneamento de status desconhecido, estado vazio para metadata ausente, e a
  garantia de que nunca lança e nunca inventa acesso.
- `priceIdDoPlano` / `planoDoPriceId` / `ehPlanoValido` — resolução por
  ambiente, fallback `STRIPE_PRICE_ID` restrito ao mensal, null quando não
  configurado, e o caminho inverso.
- Middleware, contra o worker realmente construído: redireciona `/formacoes/**`
  sem cookie, preserva a query no `destino`, não redireciona rota pública e
  nunca redireciona `/api/**`.
- `/api/lesson`: libera aula gratuita, nega aula paga a anônimo, não vaza por
  parâmetro malformado, responde `no-store`.
- Nenhum `youtubeId` de aula paga no HTML servido nem no bundle do cliente.

---

## O que os testes NÃO cobrem — roteiro manual de ponta a ponta

Tudo abaixo precisa de Clerk ou Stripe de verdade. Teste que depende de rede em
CI é pior que teste nenhum, então estes ficam como roteiro manual, a ser
executado em staging antes de cada go-live.

1. **Sessão válida sem assinatura → 402.** Crie uma conta pelo `/cadastro`, não
   pague, e abra uma aula paga. O player deve mostrar "Conteúdo para membros" e
   a chamada a `/api/lesson` deve responder 402. *(Os testes provam o 401 e o
   503; o 402 exige um usuário real com token válido.)*
2. **Sessão válida com assinatura → 200 e vídeo toca.** Pague em modo de teste,
   espere o webhook, recarregue e confirme que o `youtubeId` chega.
3. **Middleware com cookie real do Clerk.** Confirme que o assinante logado
   entra em `/formacoes/**` sem passar pelo login, e que o deslogado cai em
   `/entrar?destino=...` e volta para a aula certa depois de entrar. *(Os testes
   usam cookie inventado; só o fluxo real prova o nome e o formato do cookie na
   instância de produção do Clerk, que difere entre instância de
   desenvolvimento e de produção.)*
4. **Revogação.** Cancele a assinatura no portal, espere
   `customer.subscription.deleted`, recarregue uma aula paga e confirme 402. Este
   é o teste que prova que não há cache em lugar nenhum do caminho.
5. **`past_due` mantém acesso.** Force uma falha de cobrança e confirme que o
   acesso continua e o banner do portal aparece, conforme `docs/contrato.md`.
6. **Webhook não recebe redirecionamento em produção.** Com o domínio real,
   confirme no dashboard da Stripe que `POST /api/stripe/webhook` responde 200 e
   não 3xx. Um redirecionamento aqui faz a Stripe reenviar o evento para sempre.
7. **Cookies de terceiros no login social.** O popup do Google em produção. Não
   é simulável fora do navegador real.
8. **Metadata legado de verdade.** Pegue um usuário que ainda tenha
   `publicMetadata.membership = "active"` na instância real do Clerk e confirme
   que ele entra. O teste automatizado prova a função; só o dado real prova que
   o dado real tem o formato que a função espera.

---

## Notas de manutenção

- `app/lib/membership.ts` está aposentado. `/api/lesson` era o último
  consumidor e agora usa `sessaoDeRequest` + `temAcesso`. O arquivo pode ser
  removido depois que ninguém mais o importar.
- O corpo de erro de `/api/lesson` é `{ error: "<texto>" }`, e não
  `{ erro: <CodigoErro> }` como manda `app/lib/tipos.ts`. É herança anterior ao
  contrato, mantida para não quebrar o cliente. Registrada em
  `docs/handoff/duvidas.md` (D-06).
- `middleware.ts` dispara um aviso de depreciação do vinext ("renomeie para
  `proxy.ts`"). O build passa. A renomeação é uma tarefa à parte, com a mesma
  lógica e um `export const proxy` no lugar de `export function middleware`.
