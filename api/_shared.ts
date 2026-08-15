import { createClerkClient, type ClerkClient, type User } from "@clerk/backend";
import Stripe from "stripe";

export type Plano = "mensal" | "anual";
export type StatusAssinatura =
  | "nenhuma"
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type Assinatura = {
  status: StatusAssinatura;
  plano: Plano | null;
  stripeSubscriptionId: string | null;
  periodoFimEm: number | null;
  cancelaNoFimDoPeriodo: boolean;
  atualizadoEm: number;
  eventoEm: number | null;
};

export type Sessao =
  | { estado: "nao_configurado" | "anonimo" }
  | {
      estado: "autenticado";
      uid: string;
      email: string | null;
      stripeCustomerId: string | null;
      assinatura: Assinatura;
    };

const ASSINATURA_VAZIA: Assinatura = {
  status: "nenhuma",
  plano: null,
  stripeSubscriptionId: null,
  periodoFimEm: null,
  cancelaNoFimDoPeriodo: false,
  atualizadoEm: 0,
  eventoEm: null,
};

const STATUS_VALIDOS: StatusAssinatura[] = [
  "nenhuma",
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
];

let clerkMemorizado: { chave: string; cliente: ClerkClient } | null = null;
let stripeMemorizado: { chave: string; cliente: Stripe } | null = null;

export function json(corpo: unknown, status = 200) {
  return Response.json(corpo, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

export function clerk() {
  const chave = process.env.CLERK_SECRET_KEY;
  if (!chave) return null;
  if (clerkMemorizado?.chave === chave) return clerkMemorizado.cliente;
  const cliente = createClerkClient({
    secretKey: chave,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  clerkMemorizado = { chave, cliente };
  return cliente;
}

export function stripe() {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) return null;
  if (stripeMemorizado?.chave === chave) return stripeMemorizado.cliente;
  const cliente = new Stripe(chave);
  stripeMemorizado = { chave, cliente };
  return cliente;
}

export function lerAssinatura(metadata: Record<string, unknown> | undefined): Assinatura {
  const bruto = metadata?.assinatura;
  if (bruto && typeof bruto === "object") {
    const objeto = bruto as Record<string, unknown>;
    const status = objeto.status;
    const plano = objeto.plano;
    return {
      status: STATUS_VALIDOS.includes(status as StatusAssinatura)
        ? (status as StatusAssinatura)
        : "nenhuma",
      plano: plano === "mensal" || plano === "anual" ? plano : null,
      stripeSubscriptionId:
        typeof objeto.stripeSubscriptionId === "string" ? objeto.stripeSubscriptionId : null,
      periodoFimEm: typeof objeto.periodoFimEm === "number" ? objeto.periodoFimEm : null,
      cancelaNoFimDoPeriodo: objeto.cancelaNoFimDoPeriodo === true,
      atualizadoEm: typeof objeto.atualizadoEm === "number" ? objeto.atualizadoEm : 0,
      eventoEm: typeof objeto.eventoEm === "number" ? objeto.eventoEm : null,
    };
  }
  if (metadata?.membership === "active") {
    return {
      ...ASSINATURA_VAZIA,
      status: "active",
      stripeSubscriptionId:
        typeof metadata.stripeSubscriptionId === "string" ? metadata.stripeSubscriptionId : null,
    };
  }
  return ASSINATURA_VAZIA;
}

function montarSessao(usuario: User): Sessao {
  const publico = usuario.publicMetadata as Record<string, unknown> | undefined;
  const privado = usuario.privateMetadata as Record<string, unknown> | undefined;
  const stripeCustomerId =
    (typeof privado?.stripeCustomerId === "string" ? privado.stripeCustomerId : null) ??
    (typeof publico?.stripeCustomerId === "string" ? publico.stripeCustomerId : null);

  return {
    estado: "autenticado",
    uid: usuario.id,
    email: usuario.primaryEmailAddress?.emailAddress ?? null,
    stripeCustomerId,
    assinatura: lerAssinatura(publico),
  };
}

export async function sessao(request: Request): Promise<Sessao> {
  const cliente = clerk();
  if (!cliente) return { estado: "nao_configurado" };
  const autenticacao = await cliente.authenticateRequest(request, {
    acceptsToken: "session_token",
  });
  if (!autenticacao.isSignedIn) return { estado: "anonimo" };
  const { userId } = autenticacao.toAuth();
  return montarSessao(await cliente.users.getUser(userId));
}

export function temAcesso(status: StatusAssinatura) {
  return status === "active" || status === "trialing";
}

export function priceDoPlano(plano: Plano) {
  return plano === "mensal"
    ? process.env.STRIPE_PRICE_MENSAL
    : process.env.STRIPE_PRICE_ANUAL;
}

export function urlDoApp() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.comunidadehagios.com.br").replace(
    /\/$/,
    "",
  );
}

export function idDoObjeto(valor: string | { id: string } | null | undefined) {
  if (typeof valor === "string") return valor;
  return valor?.id ?? null;
}

function periodoFinal(assinatura: Stripe.Subscription) {
  const raiz = assinatura as Stripe.Subscription & { current_period_end?: number };
  if (typeof raiz.current_period_end === "number") return raiz.current_period_end * 1000;
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

function planoDaAssinatura(assinatura: Stripe.Subscription): Plano | null {
  const metadata = assinatura.metadata?.plano;
  if (metadata === "mensal" || metadata === "anual") return metadata;
  const price = assinatura.items.data[0]?.price?.id;
  if (price && price === process.env.STRIPE_PRICE_MENSAL) return "mensal";
  if (price && price === process.env.STRIPE_PRICE_ANUAL) return "anual";
  return null;
}

export async function gravarAssinatura(
  uid: string,
  assinatura: Stripe.Subscription,
  eventoEm: number,
  statusForcado?: StatusAssinatura,
) {
  const cliente = clerk();
  if (!cliente) throw new Error("Clerk nao configurado");
  const usuario = await cliente.users.getUser(uid);
  const atual = lerAssinatura(usuario.publicMetadata as Record<string, unknown>);
  if (atual.eventoEm !== null && atual.eventoEm > eventoEm) return;

  const stripeCustomerId = idDoObjeto(assinatura.customer);
  await cliente.users.updateUserMetadata(uid, {
    publicMetadata: {
      assinatura: {
        status: statusForcado ?? normalizarStatus(assinatura.status),
        plano: planoDaAssinatura(assinatura),
        stripeSubscriptionId: assinatura.id,
        periodoFimEm: periodoFinal(assinatura),
        cancelaNoFimDoPeriodo: assinatura.cancel_at_period_end,
        atualizadoEm: Date.now(),
        eventoEm,
      },
    },
    ...(stripeCustomerId ? { privateMetadata: { stripeCustomerId } } : {}),
  });
}
