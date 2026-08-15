import type Stripe from "stripe";

import { gravarAssinatura, idDoObjeto, json, stripe } from "../_shared.js";

async function uidDaAssinatura(cliente: Stripe, assinatura: Stripe.Subscription) {
  if (assinatura.metadata.clerkUserId) return assinatura.metadata.clerkUserId;
  const customerId = idDoObjeto(assinatura.customer);
  if (!customerId) return null;
  const customer = await cliente.customers.retrieve(customerId);
  return !customer.deleted ? customer.metadata.clerkUserId || null : null;
}

async function assinaturaDaFatura(cliente: Stripe, fatura: Stripe.Invoice) {
  const objeto = fatura as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: { subscription_details?: { subscription?: string | Stripe.Subscription | null } };
  };
  const referencia = objeto.subscription ?? objeto.parent?.subscription_details?.subscription;
  if (!referencia) return null;
  return typeof referencia === "string"
    ? cliente.subscriptions.retrieve(referencia)
    : referencia;
}

async function processar(cliente: Stripe, evento: Stripe.Event) {
  if (evento.type === "checkout.session.completed") {
    const checkout = evento.data.object as Stripe.Checkout.Session;
    if (checkout.mode !== "subscription") return;
    const uid = checkout.client_reference_id ?? checkout.metadata?.clerkUserId;
    const subscriptionId = idDoObjeto(checkout.subscription);
    if (!uid || !subscriptionId) throw new Error("Checkout sem usuario ou assinatura");
    const assinatura = await cliente.subscriptions.retrieve(subscriptionId);
    await gravarAssinatura(uid, assinatura, evento.created);
    return;
  }

  if (
    evento.type === "customer.subscription.created" ||
    evento.type === "customer.subscription.updated" ||
    evento.type === "customer.subscription.deleted"
  ) {
    const assinatura = evento.data.object as Stripe.Subscription;
    const uid = await uidDaAssinatura(cliente, assinatura);
    if (!uid) throw new Error("Assinatura sem usuario Clerk relacionado");
    await gravarAssinatura(
      uid,
      assinatura,
      evento.created,
      evento.type === "customer.subscription.deleted" ? "canceled" : undefined,
    );
    return;
  }

  if (evento.type === "invoice.payment_failed") {
    const assinatura = await assinaturaDaFatura(
      cliente,
      evento.data.object as Stripe.Invoice,
    );
    if (!assinatura) return;
    const uid = await uidDaAssinatura(cliente, assinatura);
    if (!uid) throw new Error("Fatura sem usuario Clerk relacionado");
    await gravarAssinatura(uid, assinatura, evento.created, "past_due");
  }
}

const webhookFunction = {
  async fetch(request: Request) {
    if (request.method !== "POST") return json({ erro: "metodo_nao_permitido" }, 405);
    const cliente = stripe();
    const segredo = process.env.STRIPE_WEBHOOK_SECRET;
    if (!cliente || !segredo) return json({ erro: "nao_configurado" }, 503);

    try {
      const assinatura = request.headers.get("stripe-signature");
      if (!assinatura) throw new Error("Cabecalho ausente");
      const evento = await cliente.webhooks.constructEventAsync(
        await request.text(),
        assinatura,
        segredo,
      );
      await processar(cliente, evento);
      return json({ recebido: true });
    } catch (erro) {
      console.error("Erro no webhook Stripe", erro);
      return json({ erro: "erro_interno" }, 400);
    }
  },
};

export default webhookFunction;
