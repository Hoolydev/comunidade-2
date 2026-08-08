# Movimento Hágios — regras de trabalho

Comunidade paga para empresários. Landing pública, área de membros com formações
em vídeo, assinatura recorrente pela Stripe.

Leia este arquivo inteiro antes de escrever código.

---

## Stack real

Confira antes de assumir qualquer coisa vinda de um PRD:

| Camada | O que é |
|---|---|
| Framework | Next.js 16 App Router rodando via **vinext** sobre **Cloudflare Workers** |
| Dev/build | Vite (`vite.config.ts`), Wrangler/Miniflare. `npm run dev`, `npm run build` |
| Hosting | Control plane OpenAI Sites (`.openai/hosting.json`) — **não é Vercel** |
| Autenticação | **Clerk** (`@clerk/backend` no servidor, `@clerk/react` no cliente) |
| Cobrança | Stripe Checkout hospedado + Billing Portal |
| Banco | Cloudflare D1 + Drizzle (`db/schema.ts`), binding `DB` |
| Estilo | CSS puro com tokens em `app/globals.css` |

**Não instale `firebase`, `firebase-admin` nem `@supabase/*`.** O `firebase-admin`
depende de gRPC e de binários nativos do Node e não roda em Cloudflare Workers.
A autenticação deste projeto é Clerk e essa decisão está fechada.

**Não use `@clerk/nextjs`.** Os helpers dele (`auth()`, `clerkMiddleware()`)
dependem de internos do Next que o vinext não expõe da mesma forma. Use
`@clerk/backend` no servidor, sempre através de `app/lib/sessao.ts`.

---

## Decisões fechadas

Nenhum agente revisa estas decisões durante a execução. Se você achar que uma
está errada, escreva em `docs/handoff/duvidas.md` e siga o que está aqui.

- **AD-01 · Clerk para autenticação.** Login social e e-mail+senha prontos,
  cookie de sessão httpOnly gerenciado por eles, e roda em Workers.
- **AD-02 · Toda lógica de servidor vive em Route Handlers (`app/api/**`).**
  Um deploy só, um lugar só para depurar.
- **AD-03 · O estado da assinatura vive no metadata do usuário no Clerk.**
  `publicMetadata.assinatura` (objeto `Assinatura`, legível pelo cliente — é o
  equivalente às custom claims) e `privateMetadata.stripeCustomerId`. O D1
  guarda só o livro-razão de eventos e a busca reversa de customer.
- **AD-04 · Stripe Checkout hospedado, não Elements.** Nenhum dado de cartão
  passa pelo nosso domínio. 3DS, SCA e retry de cobrança vêm de graça.
- **AD-05 · O acesso é liberado pelo webhook, nunca pela `success_url`.**
  A `success_url` é uma URL que qualquer pessoa digita no navegador.
- **AD-06 · O front nunca envia `priceId`.** Envia o slug (`"mensal"` |
  `"anual"`) e o servidor resolve em `app/lib/planos.ts`.
- **AD-07 · Segurança fica no servidor.** Middleware é experiência do usuário.
  Autorização é `exigirAssinante()` em Server Component ou verificação em Route
  Handler. Ver `docs/seguranca.md`.

---

## Contrato

`app/lib/tipos.ts`, `app/lib/planos.ts`, `app/lib/sessao.ts` e `app/lib/guarda.ts`
são **congelados**. Programe contra eles. Se precisar de uma mudança, peça em
`docs/handoff/para-orquestrador.md` com o motivo e o diff proposto, e siga
trabalhando com um stub local.

Rotas — formatos completos em `docs/contrato.md`:

| Rota | Entrada | 200 | Erros |
|---|---|---|---|
| `POST /api/checkout` | `{ plano }` | `{ url }` | 400 `plano_invalido` · 401 `nao_autenticado` · 409 `ja_assinante` · 503 `nao_configurado` |
| `POST /api/portal` | — | `{ url }` | 401 `nao_autenticado` · 404 `sem_cliente_stripe` |
| `GET /api/assinatura` | — | `AssinaturaResposta` | sempre 200 |
| `POST /api/stripe/webhook` | corpo cru | `{ recebido: true }` | 400 assinatura inválida · 500 para a Stripe reenviar |

**Não existe `/api/auth/session`.** O Clerk já mantém o cookie de sessão
httpOnly e o servidor já enxerga o usuário. Não crie essa rota.

Códigos de erro são strings estáveis (`CodigoErro` em `app/lib/tipos.ts`). O
servidor **nunca** devolve texto voltado ao usuário — o cliente traduz o código
em `app/lib/erros-auth.ts`.

---

## Rotas do site

| Caminho | O que é |
|---|---|
| `/` | Área de membros (logado) / porta de entrada |
| `/vendas` | Landing de vendas pública |
| `/planos` | Comparativo mensal × anual, CTA para assinar |
| `/cadastro` | Criar conta (Clerk `<SignUp>`), aceita `?plano=` |
| `/entrar` | Entrar (Clerk `<SignIn>`), aceita `?plano=` e `?destino=` |
| `/assinar` | Ponte que chama `/api/checkout` e redireciona para a Stripe |
| `/pagamento/sucesso` | `success_url`. Aguarda o webhook confirmar. Nunca libera acesso. |
| `/formacoes/**` | Conteúdo pago |

---

## Regras

1. Não altere as decisões fechadas. Dúvida vai para `docs/handoff/duvidas.md`.
2. Não invente endpoints nem mude formatos de resposta do contrato.
3. Toda string visível ao usuário em **PT-BR**, sentença capitalizada. Sem
   "Ops!", sem pedido de desculpas, sem exclamação nervosa.
4. **Não toque em arquivo que não é da sua trilha.** Ver a tabela de propriedade
   no prompt da sua tarefa.
5. Nenhum segredo em código. Tudo por `process.env`, sempre lido **dentro** da
   função, nunca no escopo do módulo — em Workers o ambiente pode não existir
   no momento em que o módulo é avaliado.
6. Rotas que usam Clerk ou Stripe precisam de `export const runtime = "nodejs"`.
7. Estilos novos vão em `app/estilos/<area>.css`, importado pela página que o
   usa. **Não edite `app/globals.css`** — quatro agentes editando o mesmo
   arquivo é conflito garantido. Reutilize as classes e os tokens que já
   existem lá (`--ink`, `--panel`, `--line`, `--muted`, `--gold`, `--gold-soft`,
   `--white`).
8. Commits pequenos, mensagem em português, prefixada com o id da tarefa
   (`T-A3: cria sessão de checkout`).
9. Ao terminar, rode `npx tsc --noEmit` e confira os critérios de aceite um a
   um, reportando qual passou e qual não passou. Não declare pronto o que não
   verificou.

---

## Armadilhas conhecidas

Cada item aqui é uma hora de depuração economizada.

1. **Corpo cru no webhook.** `await request.text()`, nunca `await
   request.json()`. A validação HMAC precisa dos bytes originais.
2. **`constructEventAsync`, nunca `constructEvent`.** O bundle da Stripe aqui é
   o de Workers e verifica HMAC com `SubtleCrypto`, que não tem caminho
   síncrono. A versão síncrona lança sempre, a exceção cai no `catch` da
   assinatura inválida, e todo webhook legítimo vira `400` até a Stripe
   desativar o endpoint. `runtime = "nodejs"` não salva: o bundling é do
   workerd de qualquer forma.
3. **`runtime = "nodejs"`** em toda rota que usa Clerk ou Stripe.
4. **Custom claims não são instantâneas.** Depois de `updateUserMetadata`, o
   cliente só enxerga a mudança quando o token é renovado. Por isso a página de
   processamento faz polling de `GET /api/assinatura` (que lê do servidor) em
   vez de esperar o `user` do Clerk mudar sozinho.
5. **`current_period_end` mudou de lugar.** Em versões recentes da API da
   Stripe ele saiu da raiz de `Subscription` e vive em
   `subscription.items.data[0].current_period_end`. Leia os dois lugares e nunca
   assuma um só.
6. **`success_url` não é confirmação de pagamento.** Em nenhuma circunstância.
7. **A Stripe reenvia eventos.** Sem guarda de idempotência você credita o mesmo
   pagamento várias vezes. E eventos chegam **fora de ordem** — por isso
   `Assinatura.eventoEm` existe: descarte evento mais antigo que o já aplicado.
8. **O segredo do webhook é diferente por ambiente.** O do `stripe listen` não
   funciona em produção.
9. **O binding `DB` pode não existir.** Em desenvolvimento o Miniflare simula;
   em produção depende do control plane. Todo acesso ao banco precisa degradar
   com elegância — nunca deixe uma falha de D1 derrubar a confirmação de um
   pagamento.
10. **Popup do Google e cookies de terceiros.** Se o login social falhar em
   produção, a saída é configurar domínio de autenticação próprio no Clerk, não
   trocar popup por redirect.
11. **`stripe listen` aponta para a porta do dev server** — `3000` neste
    projeto (`npm run dev`), não a 5173 padrão do Vite.
