// POST /api/stripe/webhook — a única porta que libera acesso pago (AD-05).
//
// A ordem dos passos abaixo é obrigatória e está no docs/contrato.md:
//
//   1. corpo CRU (`request.text()`); `request.json()` quebra a validação HMAC
//   2. validar a assinatura; falhou -> 400 e para (não faz a Stripe reenviar)
//   3. idempotência: registrar o `event.id`; já existia -> 200 duplicado
//   4. processar
//   5. processamento lançou -> apagar o registro de idempotência e responder
//      500, para a Stripe reenviar
//
// O passo 3 depende do D1, que pode não existir (docs/handoff/duvidas.md,
// D-05). Sem banco ele vira no-op e a proteção passa a ser a guarda de ordem
// por `event.created` dentro de `gravarAssinatura()`. Um binding ausente nunca
// pode significar pagamento não creditado.

import type Stripe from "stripe";

import {
  gravarAssinatura,
  uidDaSubscription,
  uidDoCustomer,
} from "../../../lib/assinaturas";
import { esquecerEvento, guardarCliente, registrarEvento } from "../../../lib/eventos";
import {
  idDaSubscriptionDaFatura,
  idDoCustomer,
  metadataDe,
  obterStripe,
  segredoDoWebhook,
} from "../../../lib/stripe";
import type { WebhookResposta } from "../../../lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  // 1. Corpo cru. Precisa vir antes de qualquer outra leitura do body.
  const corpo = await request.text();
  const assinaturaHeader = request.headers.get("stripe-signature");

  const stripe = obterStripe();
  const segredo = segredoDoWebhook();
  if (!stripe || !segredo || !assinaturaHeader) {
    // 503 e não 400: o problema é nosso, e a Stripe reenvia depois que o
    // ambiente for corrigido.
    return new Response(null, { status: 503 });
  }

  // 2. Validação HMAC. `constructEventAsync` e não `constructEvent` porque o
  // bundle que roda em Workers usa o SubtleCrypto, que não tem caminho
  // síncrono — a versão síncrona lança "cannot be used in a synchronous
  // context" em produção. A validação é exatamente a mesma.
  let evento: Stripe.Event;
  try {
    evento = await stripe.webhooks.constructEventAsync(corpo, assinaturaHeader, segredo);
  } catch {
    return new Response(null, { status: 400 });
  }

  // 3. Idempotência. A Stripe reenvia o mesmo evento; sem isto o mesmo
  // pagamento é creditado várias vezes.
  const registro = await registrarEvento(evento.id, evento.type);
  if (registro === "duplicado") {
    return Response.json({ recebido: true, duplicado: true } satisfies WebhookResposta);
  }

  // 4. Processar.
  try {
    await processar(stripe, evento);
  } catch {
    // 5. Solta a trava para que a reentrega da Stripe encontre o evento como
    // novo, e devolve 500 para que a reentrega aconteça.
    await esquecerEvento(evento.id);
    return new Response(null, { status: 500 });
  }

  return Response.json({ recebido: true } satisfies WebhookResposta);
}

async function processar(stripe: Stripe, evento: Stripe.Event): Promise<void> {
  // Epoch em segundos, como o contrato exige em `Assinatura.eventoEm`.
  const eventoEm = evento.created;

  switch (evento.type) {
    case "checkout.session.completed": {
      const sessao = evento.data.object as Stripe.Checkout.Session;
      // Só assinaturas. Um pagamento único não tem estado recorrente a gravar.
      if (sessao.mode !== "subscription") return;

      const uid = sessao.client_reference_id ?? metadataDe(sessao).clerkUserId ?? null;
      if (!uid) return;

      const customerId = idDoCustomer(sessao.customer);
      if (customerId) await guardarCliente(customerId, uid);

      const subscriptionId =
        typeof sessao.subscription === "string"
          ? sessao.subscription
          : (sessao.subscription?.id ?? null);
      if (!subscriptionId) return;

      // A sessão de checkout não carrega o estado da assinatura; busca na fonte.
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await gravarAssinatura(uid, subscription, eventoEm);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = evento.data.object as Stripe.Subscription;
      const uid = await uidDaSubscription(stripe, subscription);
      if (!uid) return;

      const customerId = idDoCustomer(subscription.customer);
      if (customerId) await guardarCliente(customerId, uid);

      // No `deleted` o status do corpo já vem `canceled`; forçar é só uma
      // garantia contra corpos antigos reentregues com outro status.
      const forcado = evento.type === "customer.subscription.deleted" ? "canceled" : undefined;
      await gravarAssinatura(uid, subscription, eventoEm, forcado);
      return;
    }

    case "invoice.payment_failed": {
      const fatura = evento.data.object as Stripe.Invoice;
      const customerId = idDoCustomer(fatura.customer);

      // Sem subscription não é cobrança recorrente e não há o que marcar.
      if (!idDaSubscriptionDaFatura(fatura)) return;
      if (!customerId) return;

      const uid = await uidDoCustomer(stripe, customerId);
      if (!uid) return;

      // `past_due` sobre o estado atual: plano, período e id ficam como estão.
      await gravarAssinatura(uid, null, eventoEm, "past_due");
      return;
    }

    default:
      // Assinamos poucos eventos, mas a Stripe pode entregar outros. Ignorar em
      // silêncio é o certo: responder 500 faria a Stripe reenviar para sempre.
      return;
  }
}
