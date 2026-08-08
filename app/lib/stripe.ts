// Cliente da Stripe e as leituras que a API mudou de lugar.
//
// Nada aqui lê `process.env` no escopo do módulo: em Workers o ambiente pode
// não existir no momento em que o módulo é avaliado (CLAUDE.md §Regras, 5).

import Stripe from "stripe";

import { planoDoPriceId } from "./planos";
import type { PlanoSlug } from "./tipos";

let clienteMemorizado: { chave: string; cliente: Stripe } | null = null;

/**
 * Cliente da Stripe, memorizado pela chave secreta pelo mesmo motivo de
 * `obterClerk()`: em desenvolvimento o processo é reaproveitado entre
 * requisições e recriar o cliente a cada chamada desperdiça handshake.
 *
 * Devolve null quando `STRIPE_SECRET_KEY` não está no ambiente — quem chama
 * responde `nao_configurado`, ninguém lança daqui.
 */
export function obterStripe(): Stripe | null {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) return null;
  if (clienteMemorizado?.chave === chave) return clienteMemorizado.cliente;

  const cliente = new Stripe(chave);
  clienteMemorizado = { chave, cliente };
  return cliente;
}

/** Segredo do webhook. É diferente por ambiente — ver CLAUDE.md §Armadilhas, 7. */
export function segredoDoWebhook(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET ?? null;
}

// ---------------------------------------------------------------------------
// Leituras defensivas de Subscription
// ---------------------------------------------------------------------------

/** Primeiro item da assinatura. É nele que a API nova guarda período e price. */
function primeiroItem(
  subscription: Stripe.Subscription,
): Stripe.SubscriptionItem | undefined {
  return subscription.items?.data?.[0];
}

/**
 * Fim do período pago vigente, em epoch de **milissegundos**.
 *
 * `current_period_end` saiu da raiz de `Subscription` nas versões recentes da
 * API e passou a viver em cada item (`items.data[0].current_period_end`). Os
 * dois lugares são consultados de propósito: o SDK instalado já é da API nova,
 * mas eventos reentregues pela Stripe carregam o corpo da versão em que foram
 * criados, e um webhook antigo continua chegando no formato antigo.
 */
export function fimDoPeriodoEm(subscription: Stripe.Subscription): number | null {
  const doItem = primeiroItem(subscription)?.current_period_end;
  const daRaiz = (subscription as unknown as { current_period_end?: unknown })
    .current_period_end;

  const segundos =
    typeof doItem === "number" ? doItem : typeof daRaiz === "number" ? daRaiz : null;

  return segundos === null ? null : segundos * 1000;
}

/** Slug do plano a partir do price do primeiro item. Null se o price não é nosso. */
export function planoDaAssinatura(subscription: Stripe.Subscription): PlanoSlug | null {
  const item = primeiroItem(subscription);
  const priceId =
    item?.price?.id ??
    // Formato antigo: o item trazia `plan` em vez de `price`.
    (item as unknown as { plan?: { id?: string } } | undefined)?.plan?.id ??
    null;
  return planoDoPriceId(priceId);
}

/**
 * Id do customer. A Stripe entrega o campo ora como string, ora como objeto
 * expandido, ora como objeto deletado.
 */
export function idDoCustomer(
  valor: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!valor) return null;
  if (typeof valor === "string") return valor;
  return typeof valor.id === "string" ? valor.id : null;
}

/**
 * Id da subscription que gerou uma fatura.
 *
 * Também mudou de lugar: era `invoice.subscription` na raiz e passou a ser
 * `invoice.parent.subscription_details.subscription`.
 */
export function idDaSubscriptionDaFatura(invoice: Stripe.Invoice): string | null {
  const doParent = invoice.parent?.subscription_details?.subscription;
  if (typeof doParent === "string") return doParent;
  if (doParent && typeof doParent.id === "string") return doParent.id;

  const daRaiz = (invoice as unknown as { subscription?: unknown }).subscription;
  if (typeof daRaiz === "string") return daRaiz;
  if (daRaiz && typeof daRaiz === "object") {
    const id = (daRaiz as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

/** Metadata do objeto, tolerando ausência. */
export function metadataDe(valor: {
  metadata?: Stripe.Metadata | null;
}): Record<string, string> {
  return (valor.metadata ?? {}) as Record<string, string>;
}
