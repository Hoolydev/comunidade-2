import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  gravarAssinatura,
  liberarEventoStripe,
  registrarEventoStripe,
  relacionarClienteStripe,
  uidDoClienteStripe,
} from "../../../lib/eventos-stripe";
import { obterStripe } from "../../../lib/stripe";
import type { RespostaErro, WebhookResposta } from "../../../lib/tipos";

export const runtime = "nodejs";

function idDoObjeto(valor: string | { id: string } | null | undefined): string | null {
  if (typeof valor === "string") return valor;
  return valor?.id ?? null;
}

async function uidDaAssinatura(stripe: Stripe, assinatura: Stripe.Subscription) {
  if (assinatura.metadata.clerkUserId) return assinatura.metadata.clerkUserId;
  const customerId = idDoObjeto(assinatura.customer);
  if (!customerId) return null;

  const mapeado = await uidDoClienteStripe(customerId);
  if (mapeado) return mapeado;

  const customer = await stripe.customers.retrieve(customerId);
  return !customer.deleted ? customer.metadata.clerkUserId || null : null;
}

async function assinaturaDaFatura(stripe: Stripe, fatura: Stripe.Invoice) {
  const objeto = fatura as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    parent?: { subscription_details?: { subscription?: string | Stripe.Subscription | null } };
  };
  const referencia = objeto.subscription ?? objeto.parent?.subscription_details?.subscription;
  if (!referencia) return null;
  if (typeof referencia !== "string") return referencia;
  return stripe.subscriptions.retrieve(referencia);
}

async function processarEvento(stripe: Stripe, evento: Stripe.Event) {
  if (evento.type === "checkout.session.completed") {
    const checkout = evento.data.object as Stripe.Checkout.Session;
    if (checkout.mode !== "subscription") return;
    const uid = checkout.client_reference_id ?? checkout.metadata?.clerkUserId;
    const subscriptionId = idDoObjeto(checkout.subscription);
    if (!uid || !subscriptionId) throw new Error("Checkout sem usuario ou assinatura");
    const assinatura = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = idDoObjeto(checkout.customer) ?? idDoObjeto(assinatura.customer);
    if (customerId) await relacionarClienteStripe(customerId, uid);
    await gravarAssinatura(uid, assinatura, evento.created);
    return;
  }

  if (
    evento.type === "customer.subscription.created" ||
    evento.type === "customer.subscription.updated" ||
    evento.type === "customer.subscription.deleted"
  ) {
    const assinatura = evento.data.object as Stripe.Subscription;
    const uid = await uidDaAssinatura(stripe, assinatura);
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
    const assinatura = await assinaturaDaFatura(stripe, evento.data.object as Stripe.Invoice);
    if (!assinatura) return;
    const uid = await uidDaAssinatura(stripe, assinatura);
    if (!uid) throw new Error("Fatura sem usuario Clerk relacionado");
    await gravarAssinatura(uid, assinatura, evento.created, "past_due");
  }
}

export async function POST(request: Request) {
  const stripe = obterStripe();
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !segredo) {
    return NextResponse.json<RespostaErro>({ erro: "nao_configurado" }, { status: 503 });
  }

  const corpo = await request.text();
  const assinatura = request.headers.get("stripe-signature");
  let evento: Stripe.Event;
  try {
    if (!assinatura) throw new Error("Cabecalho ausente");
    evento = await stripe.webhooks.constructEventAsync(corpo, assinatura, segredo);
  } catch {
    return NextResponse.json<RespostaErro>({ erro: "erro_interno" }, { status: 400 });
  }

  const registro = await registrarEventoStripe(evento);
  if (registro === "duplicado") {
    return NextResponse.json<WebhookResposta>({ recebido: true, duplicado: true });
  }

  try {
    await processarEvento(stripe, evento);
    return NextResponse.json<WebhookResposta>({ recebido: true });
  } catch (erro) {
    console.error(`Erro ao processar ${evento.type}`, erro);
    if (registro === "novo") await liberarEventoStripe(evento.id);
    return NextResponse.json<RespostaErro>({ erro: "erro_interno" }, { status: 500 });
  }
}
