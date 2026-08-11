# Contrato — autenticação, assinatura e checkout

Congelado. Alteração exige sync point com o orquestrador.
Os tipos citados aqui estão em `app/lib/tipos.ts` e são a definição normativa.

---

## Fluxo canônico

```
  1. /planos             visitante escolhe um plano
  2. /cadastro?plano=X   Google ou e-mail+senha (Clerk)  →  autenticado
  3. /assinar?plano=X    POST /api/checkout  →  redireciona para a Stripe
  4. checkout.stripe.com pagamento
  5. /pagamento/sucesso  ← success_url. Faz polling de GET /api/assinatura.
                           Em paralelo, Stripe → POST /api/stripe/webhook,
                           que grava o estado no metadata do Clerk.
  6. /  e  /formacoes/** acesso liberado
```

Não existe passo de login depois do checkout: quando a conta é criada o usuário
já está autenticado.

### Fluxos secundários

| Cenário | Comportamento |
|---|---|
| Usuário existente clica em "Assinar" | `/entrar?plano=mensal` → login → checkout direto |
| Assinante ativo tenta assinar de novo | `/api/checkout` responde `409 ja_assinante` → cliente manda para `/` |
| Usuário desiste no checkout (`cancel_url`) | Volta para `/planos`, conta permanece criada e logada, sem acesso |
| Webhook demora mais de 20s | `/pagamento/sucesso` explica que o acesso é liberado sozinho e mostra o `session_id` para copiar |
| Pagamento falha depois (`past_due`) | Banner na área de membros com link para o portal. Acesso mantido até `canceled`. |
| Assinatura cancelada | Acesso revogado no próximo carregamento; área de membros vira paywall |

---

## Estado da assinatura

Fonte de verdade: metadata do usuário no Clerk.

```
publicMetadata.assinatura        -> Assinatura   (legível pelo cliente)
privateMetadata.stripeCustomerId -> string       (só servidor)
```

```ts
type Assinatura = {
  status: "nenhuma" | "incomplete" | "trialing" | "active" | "past_due" | "canceled";
  plano: "mensal" | "anual" | null;
  stripeSubscriptionId: string | null;
  periodoFimEm: number | null;        // epoch ms
  cancelaNoFimDoPeriodo: boolean;
  atualizadoEm: number;               // epoch ms
  eventoEm: number | null;            // event.created, epoch s — guarda de ordem
};
```

**Regra de acesso, definição única:**
`temAcesso(status)` em `app/lib/tipos.ts` — `active` ou `trialing`. Não
reimplemente essa comparação em nenhum outro arquivo.

Tabelas de apoio no D1 (`db/schema.ts`): `eventos_stripe` (idempotência) e
`clientes_stripe` (busca reversa customer → uid). As duas são opcionais: o
webhook precisa funcionar mesmo com o binding `DB` ausente.

---

## Rotas

Todas exigem `export const runtime = "nodejs"`.

### `POST /api/checkout`

```
req  { plano: "mensal" | "anual" }
200  { url: string }                 // cliente faz window.location.assign(url)
400  { erro: "plano_invalido" }
401  { erro: "nao_autenticado" }
409  { erro: "ja_assinante" }
503  { erro: "nao_configurado" }     // falta STRIPE_SECRET_KEY ou o price do plano
```

A Checkout Session precisa carregar:

- `mode: "subscription"`
- `client_reference_id: uid`
- `metadata: { clerkUserId: uid, plano }`
- `subscription_data.metadata: { clerkUserId: uid, plano }` — sem isso os
  eventos futuros de `customer.subscription.*` chegam sem saber de quem são
- `customer` (reaproveitado) ou `customer_email`
- `success_url: <APP>/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url: <APP>/planos`
- `allow_promotion_codes: false`
- `locale: "pt-BR"`

Antes de criar a sessão: se `temAcesso(assinatura.status)` responde `409`.

### `POST /api/portal`

```
200  { url: string }
401  { erro: "nao_autenticado" }
404  { erro: "sem_cliente_stripe" }
503  { erro: "nao_configurado" }
```

`return_url` aponta para a área de membros.

### `GET /api/assinatura`

Substitui o listener em tempo real do Firestore previsto no PRD original — o
Clerk não expõe stream ao cliente, então a página de processamento faz polling.
Responde **sempre 200**; visitante anônimo recebe o estado vazio.

```
200  {
       autenticado: boolean,
       status: StatusAssinatura,
       plano: PlanoSlug | null,
       temAcesso: boolean,
       periodoFimEm: number | null,
       cancelaNoFimDoPeriodo: boolean
     }
```

### `POST /api/stripe/webhook`

Consumida apenas pela Stripe. Ordem obrigatória:

1. `const corpo = await request.text()` — corpo **cru**
2. `stripe.webhooks.constructEvent(corpo, header, STRIPE_WEBHOOK_SECRET)`;
   falhou → `400` e para (não faz a Stripe reenviar)
3. Idempotência: registrar `eventos_stripe/{event.id}`; se já existia →
   `200 { recebido: true, duplicado: true }` e para
4. Processar
5. Se o processamento lançar → apagar o registro de idempotência e responder
   `500`, para a Stripe reenviar

Eventos tratados:

| Evento | Ação |
|---|---|
| `checkout.session.completed` (só `mode === "subscription"`) | uid de `client_reference_id`, busca a subscription na Stripe e grava |
| `customer.subscription.created` / `.updated` | uid de `metadata.clerkUserId`, com fallback em `clientes_stripe` e depois no próprio customer da Stripe |
| `customer.subscription.deleted` | grava `canceled`, revoga acesso |
| `invoice.payment_failed` | grava `past_due` |

Uma única função `gravarAssinatura(uid, subscription, eventoEm)` escreve o
estado. Ela é o único lugar do código que escreve `publicMetadata.assinatura`.

```
200  { recebido: true }
400  assinatura inválida
500  erro interno
```

---

## Extensão — conteúdo da comunidade

Estas rotas foram adicionadas para a publicação de vídeos do YouTube, arquivos
privados e progresso das aulas. Não alteram o contrato de autenticação e
cobrança acima.

### `GET /api/admin/conteudo`

Exige administrador. Devolve formações, aulas e materiais, incluindo rascunhos.

### `PATCH /api/admin/conteudo`

Exige administrador.

```
req  { acao: "video", aulaId: string, youtubeUrl: string }
200  { salvo: true, youtubeVideoId: string | null }
400  youtube_invalido | dados_invalidos
403  nao_autorizado
404  aula_nao_encontrada
```

### `POST /api/admin/arquivos`

Exige administrador. Recebe `multipart/form-data` com `slug` e `arquivo`.
Aceita documentos, planilhas, apresentações, texto e ZIP de até 25 MB. Os bytes
ficam no R2 privado; o D1 guarda apenas os metadados.

`DELETE /api/admin/arquivos` recebe `{ slug }`, remove o objeto do R2 e limpa os
metadados do material.

### `GET /api/arquivos/:slug`

Exige assinatura ativa em produção. Entrega o arquivo com download forçado e
sem cache público.

### `GET /api/progresso?aulaId=...`

Exige assinatura ativa em produção. Devolve a última posição, duração e estado
de conclusão da aula.

### `POST /api/progresso`

Exige assinatura ativa em produção.

```
req  { aulaId, posicaoSegundos, duracaoSegundos, concluida }
200  { salvo: true, concluida: boolean }
```

A conclusão é preservada e também é marcada automaticamente quando o aluno
atinge 90% do vídeo.

---

## Erros

`CodigoErro` é uma união fechada de strings estáveis. O servidor devolve
`{ erro: <codigo> }` e nada mais. Toda tradução para PT-BR acontece no cliente,
em `app/lib/erros-auth.ts`.
