# Pedidos para o orquestrador

Precisa de mudança em arquivo que não é seu? Não edite. Descreva aqui o motivo e
o diff proposto, e siga trabalhando com um stub local.

Formato:

## [T-XX] título curto
**Arquivo:** caminho
**Motivo:** por que o contrato atual não resolve
**Proposta:** o diff

---

## [T-A2] `npm test` roda um arquivo só e não enxerga testes novos

**Arquivo:** `package.json`

**Motivo:** o script é `node --test tests/rendered-html.test.mjs`. Todo teste
novo em `tests/` fica de fora. Como stub local, `tests/rendered-html.test.mjs`
importa `tests/seguranca.test.mjs` na primeira linha só para arrastá-lo para a
execução — funciona, mas é acoplamento que ninguém espera encontrar.

**Proposta:**

```diff
-    "test": "npm run build && node --test tests/rendered-html.test.mjs",
+    "test": "npm run build && node --test tests/*.test.mjs",
```

Depois disso, apagar o `import "./seguranca.test.mjs";` do topo de
`tests/rendered-html.test.mjs`. (`tests/modulos-do-app.mjs` não casa com o
padrão `*.test.mjs` e continua sendo só infraestrutura importada.)

---

## [T-A2] `ehPlanoValido` aceita chaves do protótipo de `Object`

**Arquivo:** `app/lib/planos.ts` (congelado)

**Motivo:** a checagem é `valor in PLANOS`, e o operador `in` percorre a cadeia
de protótipos. Então `ehPlanoValido("constructor")` devolve `true`, assim como
`"toString"`, `"valueOf"` e `"hasOwnProperty"`.

Não é exploração de segurança: `priceIdDoPlano("constructor")` devolve `null`,
nenhuma sessão de checkout é criada e nenhum preço errado é cobrado. Mas viola o
contrato de `POST /api/checkout`, que promete `400 plano_invalido` para plano
desconhecido — hoje esse caso responde `503 nao_configurado`, mandando o usuário
para uma mensagem de "serviço indisponível" quando o problema é a entrada.

**Proposta:**

```diff
 export function ehPlanoValido(valor: unknown): valor is PlanoSlug {
-  return typeof valor === "string" && valor in PLANOS;
+  return typeof valor === "string" && Object.hasOwn(PLANOS, valor);
 }
```

O teste que fixa a correção já existe, marcado como `todo` para não reprovar a
suíte: `tests/seguranca.test.mjs`, "ehPlanoValido rejeita chaves herdadas do
protótipo de Object". Ao aplicar o diff, remova o `{ todo: ... }`.

---

## [T-A2] `app/content.ts` entrega os `youtubeId` das aulas pagas ao navegador

**Arquivo:** `app/content.ts` (e quem o importa: `app/page.tsx`,
`app/formacoes/**`)

**Motivo:** `app/content.ts` é importado por Client Components, então o módulo
inteiro entra no bundle. Verificado no build atual: o `youtubeId` da aula
gratuita aparece em `dist/client/assets/progress-*.js`.

Hoje isso é inofensivo, porque **todas** as aulas pagas estão com
`youtubeId: ""` e a única preenchida é a aula gratuita. No dia em que o conteúdo
real for cadastrado, os ids das aulas pagas viajam para o navegador de qualquer
visitante e `GET /api/lesson` deixa de proteger coisa alguma — o segredo já
terá sido entregue antes da checagem.

O teste "nenhum youtubeId de aula paga aparece no bundle do cliente"
(`tests/rendered-html.test.mjs`) quebra exatamente nesse momento. Ele é o
alarme, não o problema.

**Proposta:** separar o catálogo (público) dos ids (segredo), antes de cadastrar
o conteúdo real.

```
app/content.ts          -> mantém slug, título, duração, capa, `free`.
                           Remove `youtubeId` das aulas pagas.
app/lib/videos.server.ts -> Record<`${modulo}/${aula}`, string>, importado
                           SOMENTE por app/api/lesson/route.ts.
```

`GET /api/lesson` passa a resolver o id nesse mapa depois da checagem de
assinatura. `app/content.ts` mantém apenas um marcador booleano (`temVideo`)
para a interface saber se mostra "Em breve" ou o player.

Não implementei porque `app/content.ts` e as páginas não são da minha trilha.

---

## [T-A2] `"use client"` em `app/formacoes/**` — string "Ops." fora do padrão

**Arquivo:** `app/formacoes/[module]/[lesson]/page.tsx`, linha ~140

**Motivo:** a regra 3 do CLAUDE.md proíbe "Ops!". O estado de erro do player
renderiza `<strong>Ops.</strong>`.

**Proposta:** trocar por algo descritivo, por exemplo
`<strong>Não foi possível carregar a aula.</strong>` seguido da mensagem. Achado
durante a leitura para T-A6; o arquivo não é da minha trilha.

---

## [T-A4] o webhook precisa de `constructEventAsync`, não `constructEvent`

**Arquivo:** `docs/contrato.md` (passo 2 do webhook) e `CLAUDE.md`
(§Armadilhas) — os dois dizem `stripe.webhooks.constructEvent`.

**Motivo:** o bundle da Stripe que roda aqui é o de Workers. Confirmado no build
atual: `dist/server/index.js` contém `WebPlatformFunctions` e
`SubtleCryptoProvider`, e não `NodePlatformFunctions`. O `SubtleCrypto` não tem
caminho síncrono, então a versão síncrona **sempre** lança:

```
CryptoProviderOnlySupportsAsyncError:
SubtleCryptoProvider cannot be used in a synchronous context.
Use `await constructEventAsync(...)` instead of `constructEvent(...)`
```

Como a exceção cai no mesmo `catch` da assinatura inválida, o efeito seria
responder `400` a **todo** webhook legítimo — a Stripe desativaria o endpoint e
nenhum pagamento seria creditado. `export const runtime = "nodejs"` não muda
isso: o bundling é do workerd de qualquer forma.

`constructEventAsync` roda a mesma verificação HMAC e funciona com os dois
provedores de cripto, então é a escolha correta nos dois ambientes.
`app/api/stripe/webhook/route.ts` já usa a versão assíncrona.

**Proposta:** trocar a menção nos dois documentos.

```diff
-2. `stripe.webhooks.constructEvent(corpo, header, STRIPE_WEBHOOK_SECRET)`;
+2. `await stripe.webhooks.constructEventAsync(corpo, header, STRIPE_WEBHOOK_SECRET)`;
```

---

## [T-A4] espelho do `publicMetadata.membership` legado ainda é necessário

**Arquivo:** `app/page.tsx` (linha ~100) e `app/api/lesson/route.ts` via
`app/lib/membership.ts`

**Motivo:** as duas ainda decidem acesso por `publicMetadata.membership ===
"active"`, formato anterior a este PRD. Como `gravarAssinatura()` passou a ser o
único escritor de `publicMetadata`, se ela escrevesse só `assinatura` esses dois
pontos passariam a enxergar todo mundo como não-assinante.

Por isso `gravarAssinatura()` grava também
`membership: temAcesso(status) ? "active" : "inactive"`, marcado no código como
espelho temporário. É estado duplicado e deve sair.

**Proposta:** migrar os dois consumidores e depois remover o espelho.

```
app/page.tsx            -> usar `sessaoAtual()` + `temAcesso()` (ou o
                           `verificarAcesso()` de app/lib/guarda.ts)
app/lib/membership.ts   -> apagar; app/api/lesson/route.ts passa a usar
                           `sessaoDeRequest()` + `temAcesso()`
app/lib/assinaturas.ts  -> remover a linha `membership:` de gravarAssinatura
```

Nenhum dos três primeiros arquivos é da minha trilha.

---

## [T-A4] a migração do D1 existe, mas ninguém a aplica

**Arquivo:** `package.json` (scripts) — e o deploy

**Motivo:** `drizzle/0000_blue_king_bedlam.sql` foi gerado nesta tarefa (o
`_journal.json` estava vazio, as tabelas nunca tinham sido criadas). Existe
`db:generate`, mas não existe `db:migrate`: sem aplicar o SQL, `eventos_stripe`
e `clientes_stripe` não existem e o webhook roda no modo degradado — funciona,
mas sem idempotência de verdade.

**Proposta:** adicionar os scripts de aplicação.

```diff
     "db:generate": "drizzle-kit generate",
+    "db:migrate": "wrangler d1 migrations apply site-creator-d1 --local",
+    "db:migrate:prod": "wrangler d1 migrations apply site-creator-d1 --remote",
```

Verificado localmente aplicando o SQL direto no sqlite do Miniflare: com as
tabelas presentes, a reentrega do mesmo `event.id` responde
`{ recebido: true, duplicado: true }`; sem elas, responde `{ recebido: true }`
e reprocessa (que é a degradação desejada, não um erro).

---

## [T-B5] falta `NEXT_PUBLIC_EMAIL_SUPORTE` no ambiente

**Arquivo:** `.env.example` (e o ambiente de produção)

**Motivo:** depois de 20 segundos sem confirmação do webhook,
`/pagamento/sucesso` precisa oferecer contato de suporte junto com o
`session_id`. Sem um endereço configurável, o `mailto:` fica preso a um valor
escrito no código, e o arquivo não é meu para inventar um domínio oficial.

Stub local em uso: `process.env.NEXT_PUBLIC_EMAIL_SUPORTE ??
"suporte@movimentohagios.com.br"` — lido dentro do componente, nunca no escopo
do módulo. **O endereço do fallback é suposição e precisa ser confirmado antes
do go-live**, senão o pedido de socorro do cliente cai em uma caixa que não
existe.

**Proposta:**

```diff
 # Base pública usada em success_url, cancel_url e return_url do portal.
 # Em produção precisa ser o domínio real, com https e sem barra no fim.
 NEXT_PUBLIC_APP_URL=http://localhost:5173
+
+# Endereço mostrado em /pagamento/sucesso quando o webhook demora mais de 20s.
+# É o único canal que o cliente tem para provar o pagamento, com o session_id.
+NEXT_PUBLIC_EMAIL_SUPORTE=suporte@exemplo.com.br
```

---

## [T-B6] `app/page.tsx` não lê mais o espelho `membership`

**Arquivo:** `app/lib/assinaturas.ts` e `app/lib/membership.ts` (não são meus)

**Motivo:** o pedido de T-A4 acima ("espelho do `publicMetadata.membership`
legado ainda é necessário") lista dois consumidores. Um deles já saiu: a área de
membros agora decide pelo contrato — `GET /api/assinatura` com
`publicMetadata.assinatura` como rede de segurança, via
`app/componentes/useAssinatura.ts`. Nenhuma linha de `app/page.tsx` menciona
`membership`.

**Proposta:** sobra só `app/api/lesson/route.ts` via `app/lib/membership.ts`.
Migrado esse, a linha `membership:` de `gravarAssinatura()` pode cair.
