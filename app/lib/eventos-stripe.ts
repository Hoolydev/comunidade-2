import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { getDb } from "../../db";
import { clientesStripe, eventosStripe } from "../../db/schema";
import { planoDoPriceId } from "./planos";
import { lerAssinatura, obterClerk } from "./sessao";
import type { PlanoSlug, StatusAssinatura } from "./tipos";

type RegistroEvento = "novo" | "duplicado" | "indisponivel";

function pareceDuplicidade(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  return /unique|primary key|constraint/i.test(mensagem);
}

/** Registra a entrega sem transformar uma indisponibilidade do D1 em perda de pagamento. */
export async function registrarEventoStripe(evento: Stripe.Event): Promise<RegistroEvento> {
  try {
    await getDb().insert(eventosStripe).values({
      id: evento.id,
      tipo: evento.type,
      recebidoEm: Date.now(),
    });
    return "novo";
  } catch (erro) {
    if (pareceDuplicidade(erro)) return "duplicado";
    console.error("D1 indisponivel ao registrar evento Stripe", erro);
    return "indisponivel";
  }
}

export async function liberarEventoStripe(eventoId: string) {
  try {
    await getDb().delete(eventosStripe).where(eq(eventosStripe.id, eventoId));
  } catch (erro) {
    console.error("Nao foi possivel liberar evento Stripe no D1", erro);
  }
}

export async function relacionarClienteStripe(stripeCustomerId: string, uid: string) {
  try {
    await getDb()
      .insert(clientesStripe)
      .values({ stripeCustomerId, uid, criadoEm: Date.now() })
      .onConflictDoUpdate({
        target: clientesStripe.stripeCustomerId,
        set: { uid },
      });
  } catch (erro) {
    console.error("D1 indisponivel ao relacionar cliente Stripe", erro);
  }
}

export async function uidDoClienteStripe(stripeCustomerId: string): Promise<string | null> {
  try {
    const resultado = await getDb()
      .select({ uid: clientesStripe.uid })
      .from(clientesStripe)
      .where(eq(clientesStripe.stripeCustomerId, stripeCustomerId))
      .limit(1);
    return resultado[0]?.uid ?? null;
  } catch (erro) {
    console.error("D1 indisponivel ao consultar cliente Stripe", erro);
    return null;
  }
}

function idDoObjeto(valor: string | { id: string } | null | undefined): string | null {
  if (typeof valor === "string") return valor;
  return valor?.id ?? null;
}

function periodoFinalDaAssinatura(assinatura: Stripe.Subscription): number | null {
  const objeto = assinatura as Stripe.Subscription & { current_period_end?: number };
  const raiz = objeto.current_period_end;
  if (typeof raiz === "number") return raiz * 1000;

  const item = assinatura.items.data[0] as Stripe.SubscriptionItem & {
    current_period_end?: number;
  };
  return typeof item?.current_period_end === "number" ? item.current_period_end * 1000 : null;
}

function normalizarStatus(status: Stripe.Subscription.Status): StatusAssinatura {
  if (status === "active" || status === "trialing" || status === "past_due") return status;
  if (status === "canceled" || status === "unpaid") return "canceled";
  return "incomplete";
}

function planoDaAssinatura(assinatura: Stripe.Subscription): PlanoSlug | null {
  const metadata = assinatura.metadata?.plano;
  if (metadata === "mensal" || metadata === "anual") return metadata;
  return planoDoPriceId(assinatura.items.data[0]?.price?.id);
}

/** Único ponto de escrita do estado de assinatura no Clerk. */
export async function gravarAssinatura(
  uid: string,
  assinatura: Stripe.Subscription,
  eventoEm: number,
  statusForcado?: StatusAssinatura,
) {
  const clerk = obterClerk();
  if (!clerk) throw new Error("Clerk nao configurado");

  const usuario = await clerk.users.getUser(uid);
  const atual = lerAssinatura(usuario.publicMetadata as Record<string, unknown>);
  if (atual.eventoEm !== null && atual.eventoEm > eventoEm) return;

  const stripeCustomerId = idDoObjeto(assinatura.customer);
  const novoEstado = {
    status: statusForcado ?? normalizarStatus(assinatura.status),
    plano: planoDaAssinatura(assinatura),
    stripeSubscriptionId: assinatura.id,
    periodoFimEm: periodoFinalDaAssinatura(assinatura),
    cancelaNoFimDoPeriodo: assinatura.cancel_at_period_end,
    atualizadoEm: Date.now(),
    eventoEm,
  };

  await clerk.users.updateUserMetadata(uid, {
    publicMetadata: { assinatura: novoEstado },
    ...(stripeCustomerId
      ? { privateMetadata: { stripeCustomerId } }
      : {}),
  });

  if (stripeCustomerId) await relacionarClienteStripe(stripeCustomerId, uid);
}
