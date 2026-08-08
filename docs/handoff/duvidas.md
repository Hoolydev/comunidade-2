# Dúvidas e dívidas registradas

Coisas que um agente achou erradas ou arriscadas e que não deve resolver
sozinho. Registre e siga o que está no CLAUDE.md.

---

## D-01 · O PRD pedia Firebase + Vercel; o projeto é Clerk + Cloudflare Workers

**Registrado por:** orquestrador, na Fase 0.
`firebase-admin` depende de gRPC e binários nativos do Node e não roda em
Cloudflare Workers, então Firebase + este hosting não coexistem. Decidido com o
responsável pelo produto: manter Clerk e Workers, traduzindo o comportamento do
PRD. Mapeamento: Firebase Auth → Clerk; Firestore `usuarios/{uid}` → metadata do
usuário no Clerk; custom claims → `publicMetadata`; `onSnapshot` → polling de
`GET /api/assinatura`; Security Rules → o cliente não fala com o banco, toda
autorização é server-side.

## D-02 · `POST /api/auth/session` do PRD não existe aqui

O Clerk já cria e renova um cookie de sessão httpOnly e já permite identificar o
usuário no servidor. A rota seria uma reimplementação sem função. Substituída
por `app/lib/sessao.ts`.

## D-03 · Duas fontes de verdade para preço

`app/lib/planos.ts` guarda os valores exibidos; a Stripe guarda os valores
cobrados. Se divergirem, o usuário vê um número e paga outro. Card no backlog:
buscar os preços da própria Stripe em vez de constantes locais.

## D-04 · Valores dos planos são suposição

`mensal R$ 97/mês` e `anual R$ 970/ano` foram colocados como referência para
destravar a interface. **Precisam ser confirmados** e precisam bater com os
prices criados na Stripe antes do go-live.

## D-05 · Binding `DB` do D1 depende do control plane

`.openai/hosting.json` passou a declarar `"d1": "DB"`. Em desenvolvimento o
Miniflare simula. Em produção o binding depende de provisionamento pelo control
plane do OpenAI Sites. Por isso todo acesso ao banco degrada com elegância — o
webhook credita o pagamento mesmo sem banco.

---

<!-- Novas dúvidas abaixo. Assine com a sua tarefa. -->

## D-06 · `@clerk/localizations` está preso em 4.13.10 de propósito

**Registrado por:** T-B1.

A versão mais recente (4.14.x) depende de `@clerk/shared ^4.27`, enquanto o
`@clerk/react` 6.12.10 deste projeto traz `@clerk/shared` 4.25.10. Instalar a
mais recente faria o npm criar uma segunda cópia aninhada de `@clerk/shared`, com
duas definições de `LocalizationResource` no mesmo build. A 4.13.10 depende de
`^4.25.10` e faz dedupe com o que já existe — `npm install` adicionou um único
pacote e `npx tsc --noEmit` fica limpo.

**Ao atualizar `@clerk/react`, atualize `@clerk/localizations` junto**, checando
que os dois apontam para a mesma faixa de `@clerk/shared`.

## D-07 · Recuperação de senha não foi exercida ponta a ponta

**Registrado por:** T-B3.

A recuperação é a nativa do `<SignIn>` e o ambiente do Clerk está com
`password.enabled = true` e `email_address.verifications = ["email_code"]`, ou
seja, o fluxo existe. Só que o link "Esqueceu a senha?" só aparece no passo de
senha, que exige uma conta real na instância — com um e-mail inexistente o Clerk
para antes, no passo do identificador. Falta um teste manual com uma conta de
verdade antes do go-live.

## D-08 · Cadastro tem desafio da Cloudflare (Turnstile)

**Registrado por:** T-B3.

Ao submeter o formulário de `/cadastro`, o Clerk exibe um "Confirme que é humano"
da Cloudflare. É o bot protection padrão da instância e não foi contornado
durante a verificação — as mensagens de erro do cadastro (senha fraca, e-mail já
cadastrado) estão traduzidas em `app/lib/erros-auth.ts` e foram conferidas por
teste unitário, mas não na tela.

## D-09 · `/api/lesson` devolve texto de erro, não `{ erro: <CodigoErro> }`

**Registrado por:** T-A6/T-A2.
A regra do CLAUDE.md é que o servidor nunca devolve texto voltado ao usuário nas
rotas de API — só `{ erro: <CodigoErro> }` de `app/lib/tipos.ts`, traduzido no
cliente. `GET /api/lesson` é anterior a esse contrato e devolve
`{ error: "Faça login para assistir.", locked: true }`, em português, do
servidor.

Mantido como está: `app/formacoes/[module]/[lesson]/page.tsx` lê `data.error` e
`locked`, e mudar o formato quebraria o cliente numa tarefa que não é dele. Os
códigos de status (401, 402, 503) já carregam toda a informação de que o cliente
precisa — ele decide o estado da tela pelo status, não pelo texto.

**Migração sugerida, quando alguém tocar nas duas pontas juntas:** passar a
responder `{ erro: "nao_autenticado" }` (401), `{ erro: "ja_assinante" }` não se
aplica — falta um código para "sem assinatura" no `CodigoErro`, então a migração
exige acrescentar um (`sem_assinatura`) ao tipo congelado. Por isso não foi
feita agora.

## D-10 · `middleware.ts` é deprecado no Next.js 16

**Registrado por:** T-A6.
O vinext avisa no build: "middleware.ts is deprecated in Next.js 16. Rename to
proxy.ts and export a default or named proxy function." O build passa e o
middleware funciona — o teste de redirecionamento roda contra o worker
construído e prova isso.

A tarefa pedia `middleware.ts` explicitamente, então foi criado com esse nome.
A migração é mecânica: renomear para `proxy.ts` e trocar
`export function middleware` por `export function proxy`. Nenhuma outra
mudança — o `config.matcher` e a semântica de `NextResponse` são as mesmas.

## D-11 · `past_due` tem acesso ou não — RESOLVIDO na integração

**Registrado por:** T-B6.
`docs/contrato.md` define acesso como `temAcesso(status)` — `active` ou
`trialing` — e, três seções acima, na tabela de fluxos secundários, diz:
"Pagamento falha depois (`past_due`) | Banner na área de membros com link para o
portal. **Acesso mantido até `canceled`**". Os dois não podem valer juntos:
`temAcesso("past_due")` é `false`.

**Resolvido na integração:** `temAcesso` passou a incluir `past_due`, que é o
comportamento que a tabela de fluxos já descrevia.

A razão é factual, não de preferência: **`past_due` só existe depois de um
pagamento bem-sucedido.** Uma primeira cobrança recusada deixa a assinatura em
`incomplete`, nunca em `past_due` — o Checkout exige a primeira fatura paga para
a assinatura virar `active`. Quem chega em `past_due` já pagou pelo menos uma
vez e teve a cobrança de *renovação* falhando, com a Stripe ainda tentando de
novo por cerca de duas semanas antes de desistir. Cortar o acesso no primeiro
cartão recusado é tirar o produto de um cliente pagante por causa de um cartão
vencido. O acesso cai em `canceled`, que é quando a Stripe desiste.

Consequências aplicadas junto:

- `app/lib/tipos.ts`, `docs/contrato.md` e a tabela-verdade em
  `tests/seguranca.test.mjs` atualizados.
- `app/page.tsx` perdeu a regra de exibição paralela: `temAcesso` sozinho já
  responde, e manter as duas seria convidar a divergência.
- `app/componentes/BotaoAssinar.tsx` teve os ramos reordenados. O ramo de
  `past_due` vinha depois do teste de `temAcesso` e virou código morto com a
  mudança — quem estivesse com a cobrança falhando leria "sua assinatura já
  está ativa" e não teria como consertar o cartão.
- `POST /api/checkout` responde `409 ja_assinante` também em `past_due`, e é o
  correto: o caminho ali é atualizar o cartão no portal, não abrir uma segunda
  assinatura.
