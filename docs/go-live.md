# Go-live

Checklist de subida e procedimento de rollback. A ordem importa: alguns passos
dependem do domínio de produção já existir.

---

## Antes de qualquer coisa — três decisões pendentes

Nenhuma delas é técnica, e as três bloqueiam a cobrança real.

1. **Os preços.** `app/lib/planos.ts` está com `mensal R$ 97/mês` e
   `anual R$ 970/ano`. **São suposição** (D-04). Confirme os valores e crie os
   prices correspondentes na Stripe. Os dois números precisam bater: o arquivo é
   a fonte de verdade da *exibição*, a Stripe é a fonte de verdade da *cobrança*,
   e se divergirem o usuário vê um valor e paga outro (D-03).
2. **O e-mail de suporte.** `NEXT_PUBLIC_EMAIL_SUPORTE` tem como padrão
   `suporte@exemplo.com.br`. É o único canal de quem pagou e não recebeu acesso.
   Precisa ser uma caixa que alguém lê.
3. **Os `youtubeId` das aulas pagas.** Hoje estão vazios e por isso o vazamento
   descrito abaixo é inofensivo. **Não cadastre o conteúdo real antes de
   resolver isso** — ver a próxima seção.

---

## Bloqueador conhecido antes de cadastrar vídeo real

`app/content.ts` é importado por Client Components, então o módulo inteiro entra
no bundle do navegador. Confirmado: o `youtubeId` da aula gratuita aparece em
`dist/client/assets/`.

Enquanto todas as aulas pagas estiverem com `youtubeId: ""`, nada vaza. **No dia
em que os ids reais forem cadastrados, eles viajam para o navegador de qualquer
visitante e `GET /api/lesson` deixa de proteger coisa alguma** — o segredo já
terá sido entregue antes da checagem.

O teste "nenhum youtubeId de aula paga aparece no bundle do cliente" quebra
exatamente nesse momento. Ele é o alarme, não o problema.

A correção proposta está em `docs/handoff/para-orquestrador.md`: separar o
catálogo público (`app/content.ts`) do mapa de ids
(`app/lib/videos.server.ts`), importado **somente** por
`app/api/lesson/route.ts`.

---

## Passo a passo

### 1 · Stripe

O produto é **`prod_V2NIEDOZO1Meh9`**. Ele precisa de dois prices recorrentes:
um `month` e um `year`, os dois em BRL.

Para listar os prices do produto e conferir se os valores batem com
`app/lib/planos.ts`:

```bash
npm run precos                       # lê STRIPE_SECRET_KEY do .env.local
npm run precos -- prod_OUTRO         # ou aponte outro produto
```

O script imprime as linhas `STRIPE_PRICE_MENSAL=` e `STRIPE_PRICE_ANUAL=`
prontas para colar, e acusa se a Stripe cobrar um valor diferente do que a
interface exibe.

- [ ] Criar os dois prices **recorrentes** (mensal e anual) em modo `live`
- [ ] Rodar `npm run precos` e colar os ids nas variáveis
- [ ] Se o script acusar divergência, ajustar `app/lib/planos.ts`
- [ ] Configurar o **Billing Portal**: permitir cancelamento no fim do período,
      troca de cartão e acesso a faturas
- [ ] Cadastrar o endpoint de webhook apontando para
      `https://<domínio>/api/stripe/webhook`
- [ ] Assinar os eventos: `checkout.session.completed`,
      `customer.subscription.created`, `customer.subscription.updated`,
      `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Copiar o `whsec_` **do Dashboard** — ele é diferente do que o
      `stripe listen` imprime, e trocar os dois é a causa mais comum de "todo
      webhook dá 400"

### 2 · Clerk
- [ ] Instância de **produção** criada (as chaves `pk_test`/`sk_test` de hoje
      são de desenvolvimento)
- [ ] Provedor Google habilitado com credenciais próprias — as compartilhadas do
      Clerk não valem em produção
- [ ] Domínio de autenticação próprio configurado, se o popup do Google falhar
- [ ] E-mail e senha habilitados, com verificação por código

### 3 · Variáveis de ambiente
Todas em `.env.example`. Confira uma a uma; falta de qualquer segredo faz as
rotas responderem `503 nao_configurado` em vez de quebrar, o que é bom para o
diagnóstico e péssimo para descobrir tarde.

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (produção)
- [ ] `STRIPE_SECRET_KEY` (`sk_live`)
- [ ] `STRIPE_PRICE_MENSAL`, `STRIPE_PRICE_ANUAL`
- [ ] `STRIPE_WEBHOOK_SECRET` (o do Dashboard)
- [ ] `NEXT_PUBLIC_APP_URL` — domínio real, `https`, **sem barra no fim**
- [ ] `NEXT_PUBLIC_EMAIL_SUPORTE`
- [ ] Remover `STRIPE_PRICE_ID`, que só existe como compatibilidade

### 4 · Banco (D1)
- [ ] `.openai/hosting.json` declara `"d1": "DB"`
- [ ] Binding provisionado pelo control plane
- [ ] `npm run db:migrate:prod` para criar `eventos_stripe` e `clientes_stripe`

Sem isso o webhook **funciona** e credita o pagamento, mas em modo degradado:
sem idempotência por evento, sobrando só a guarda de ordem por `event.created`.
Não é motivo para adiar a subida; é motivo para não esquecer.

### 5 · Verificação em produção
- [ ] `GET /api/assinatura` anônimo devolve `200` com `temAcesso: false`
- [ ] `/formacoes/**` deslogado redireciona para `/entrar`
- [ ] Webhook com corpo inválido devolve `400` (e a Stripe mostra a entrega)
- [ ] **Compra real de R$ 1,00** com price temporário: acesso libera em segundos
- [ ] **Estorno pelo Dashboard**: acesso é revogado no próximo carregamento
- [ ] Apagar o price temporário de R$ 1,00

---

## Rollback

O deploy anterior não conhece `publicMetadata.assinatura`; ele lê o formato
antigo `publicMetadata.membership`. **A versão atual parou de escrever esse
campo** (era estado duplicado sem leitor).

Consequência: voltar o código sozinho faz assinantes criados depois desta subida
aparecerem como não-assinantes para a versão antiga.

1. **Rollback de código:** volte o deploy anterior.
2. **Imediatamente depois:** para cada usuário com
   `publicMetadata.assinatura.status ∈ {active, trialing, past_due}`, grave
   `publicMetadata.membership = "active"`. É um laço sobre
   `clerk.users.getUserList()`.
3. **Não é preciso mexer na Stripe.** As assinaturas continuam válidas; só a
   leitura do acesso muda de lugar.

O caminho inverso é grátis: `lerAssinatura` continua entendendo o formato antigo
de propósito, então subir de novo não exige migração nenhuma.

Se o problema for só o webhook, **não faça rollback** — desative o endpoint no
Dashboard da Stripe. A Stripe guarda os eventos e reenvia quando você reativar,
e ninguém perde acesso no intervalo.
