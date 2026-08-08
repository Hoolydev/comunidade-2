# Roteiro de ponta a ponta

Dois blocos: o que a suíte automatizada já prova, e o que **só** pode ser
provado com chaves e contas reais. O segundo bloco não é opcional — é onde mora
o risco de cobrar alguém e não entregar acesso.

## Como rodar o automatizado

```bash
npm test          # build + node --test tests/*.test.mjs
npx tsc --noEmit
```

Estado na integração da Fase 1: **39 testes, 0 falhas**, `tsc` limpo.

---

## Bloco 1 — coberto por teste automatizado

Nenhum destes toca a rede. Rodam contra o worker realmente construído
(`dist/server/index.js`) ou contra os módulos do app.

| # | Cenário | Onde |
|---|---|---|
| 1 | `temAcesso` libera `active`, `trialing`, `past_due` e nega o resto | `tests/seguranca.test.mjs` |
| 2 | Metadata do formato antigo (`membership: "active"`) continua dando acesso | idem |
| 3 | `lerAssinatura` nunca lança e nunca inventa acesso, com qualquer entrada | idem |
| 4 | Slug → price, fallback do `STRIPE_PRICE_ID`, slug inválido, chaves do protótipo | idem |
| 5 | Webhook com assinatura forjada → `400` | `tests/rendered-html.test.mjs` |
| 6 | Reentrega do mesmo `event.id` → `duplicado: true`, sem reprocessar | idem |
| 7 | Processamento que lança → `500` e registro de idempotência apagado | idem |
| 8 | Sem as tabelas do D1 → credita o pagamento em modo degradado | idem |
| 9 | Evento com `created` mais antigo não sobrescreve estado mais recente | idem |
| 10 | `/formacoes/**` sem cookie redireciona preservando a query | idem |
| 11 | `/api/**` nunca recebe 3xx do middleware (webhook redirecionado é endpoint morto) | idem |
| 12 | `/api/lesson`: aula grátis liberada, aula paga nega anônimo | idem |
| 13 | Nenhum `youtubeId` de aula paga no HTML nem no bundle do cliente | idem |
| 14 | `?destino=` hostil é descartado (17 entradas, incluindo `//` e `\`) | verificado na T-B3 |

---

## Bloco 2 — exige chaves e contas reais

Faça na ordem. Ambiente: chaves `sk_test`, dois prices recorrentes criados na
Stripe, e `stripe listen --forward-to localhost:3000/api/stripe/webhook` rodando
com o `whsec_` que ele imprime no `.env.local`.

### 2.1 · Cadastro por e-mail → pagamento → acesso
1. `/planos` → "Assinar" no mensal, deslogado.
2. Cai em `/cadastro?plano=mensal`. Crie a conta.
3. Deve ir sozinho para `/assinar?plano=mensal` e de lá para `checkout.stripe.com`.
   **Confira o valor e a recorrência na tela da Stripe.**
4. Cartão `4242 4242 4242 4242`, validade futura, CVC qualquer.
5. Volta em `/pagamento/sucesso?session_id=cs_...`. Deve mostrar "Confirmando
   seu pagamento…" e, em poucos segundos, redirecionar para `/`.
6. Abra uma aula paga em `/formacoes/**`. O vídeo tem que tocar.

**Falha esperada se algo estiver errado:** se travar em "Estamos finalizando", o
webhook não chegou — confira o terminal do `stripe listen`.

### 2.2 · Cadastro por Google
Igual ao 2.1, pelo botão do Google. Exige o provedor habilitado no Clerk.
Se o popup falhar, veja a armadilha 10 do `CLAUDE.md`.

### 2.3 · Cartão recusado
Cartão `4000 0000 0000 0002`. A Stripe recusa na própria tela dela. Voltar por
`cancel_url` deve cair em `/planos`, **com a conta criada e logada, sem acesso**.

### 2.4 · Cartão com 3DS
Cartão `4000 0025 0000 3155`. Completa o desafio e libera igual ao 2.1.

### 2.5 · Webhook offline, e recuperação
1. **Pare o `stripe listen`.**
2. Faça um pagamento completo.
3. `/pagamento/sucesso` deve passar por "Estamos finalizando" (5s) e chegar ao
   estado de 20s: pagamento recebido, acesso liberado automaticamente,
   `session_id` visível e copiável, contato de suporte.
   **A tela não pode liberar acesso em nenhum momento.**
4. Suba o `stripe listen` de novo e reenvie o evento pelo Dashboard da Stripe.
5. O acesso deve abrir sozinho, sem recarregar a página.

Este é o cenário mais importante da lista. É o que separa "o cliente esperou um
minuto" de "o cliente pagou e sumiu".

### 2.6 · Reenvio de evento duplicado
Dashboard da Stripe → o evento já processado → "Resend". Resposta deve ser
`200 { recebido: true, duplicado: true }` e o metadata do usuário não pode mudar.
Requer as tabelas do D1 aplicadas (`npm run db:migrate`); sem elas o webhook
reprocessa, que é a degradação desejada e não um erro.

### 2.7 · Já assinante tenta assinar de novo
Logado e com assinatura ativa, vá a `/planos`. O CTA deve dizer "Ir para a área
de membros". Forçando um `POST /api/checkout`, a resposta é `409 ja_assinante`.

### 2.8 · Cancelamento pelo portal
1. Menu da conta → "Gerenciar assinatura" → portal da Stripe → cancelar.
2. O webhook `customer.subscription.updated` grava `cancelaNoFimDoPeriodo: true`.
3. A área de membros deve mostrar o aviso **com a data de término**, e o acesso
   continua até lá.

### 2.9 · Pagamento de renovação que falha (`past_due`)
Pelo Dashboard, force uma fatura de renovação a falhar. A área de membros mostra
o banner com "Atualizar forma de pagamento" e **o acesso continua** — `past_due`
tem acesso de propósito (ver a regra em `docs/contrato.md`). Em `/planos`, o CTA
tem que ser o do portal, não um segundo checkout.

### 2.10 · Expiração e revogação
Deixe a assinatura chegar a `canceled` (ou apague pelo Dashboard). No próximo
carregamento a área de membros vira paywall e a aula paga não abre.

### 2.11 · Recuperação de senha
Com uma conta real de e-mail+senha, use "Esqueceu a senha?" na tela de entrar.
**Não foi possível exercitar isso automaticamente** (D-07): o link só aparece no
passo de senha, que exige conta existente. Confira que o e-mail chega, que o
texto está em português, e que a mensagem na tela é a mesma para e-mail
cadastrado e não cadastrado — ela não pode revelar quais e-mails existem.

### 2.12 · Erros de cadastro na tela
O Clerk exibe um desafio Turnstile no cadastro, que bloqueia automação (D-08).
Confira manualmente: e-mail já cadastrado, senha curta, senha vazada. As
mensagens estão traduzidas e testadas unitariamente, mas não foram vistas na
tela.

### 2.13 · 402 com usuário real
Logado **sem** assinatura, abra uma aula paga. `GET /api/lesson` deve devolver
`402` e a tela deve oferecer o caminho para `/planos`. Os testes cobrem o `401`
do anônimo, não o `402`.

---

## O que continua sem cobertura, e por quê

| Lacuna | Motivo | Risco |
|---|---|---|
| Compra real em produção | Exige chave `live` | Coberto pelo item de R$ 1,00 em `docs/go-live.md` |
| Layout em 360px | Nenhum navegador conectado à automação | Escrito em CSS, não conferido com os olhos |
| Nome do cookie do Clerk em produção | Instância de produção tem sufixo diferente do de dev | Se errar, o middleware redireciona quem está logado — atrapalha, não fura |
