// Escrita do estado da assinatura.
//
// `gravarAssinatura()` é o ÚNICO lugar do código que escreve
// `publicMetadata.assinatura` (docs/contrato.md). Um segundo escritor
// significaria uma segunda cópia da guarda de ordem, e a primeira vez que as
// duas divergissem um evento antigo revogaria o acesso de quem pagou.

import type Stripe from "stripe";

import { uidDoCliente } from "./eventos";
import { lerAssinatura, obterClerk } from "./sessao";
import {
  fimDoPeriodoEm,
  idDoCustomer,
  metadataDe,
  planoDaAssinatura,
} from "./stripe";
import { temAcesso, type Assinatura, type StatusAssinatura } from "./tipos";

/**
 * Status da Stripe -> status do contrato.
 *
 * A Stripe tem mais estados do que nos interessam. Os que não têm equivalente
 * caem no bucket mais próximo *sem acesso*: `unpaid` e `paused` viram
 * `past_due`, `incomplete_expired` vira `canceled`. Errar para o lado de
 * "sem acesso" aqui é seguro porque o evento seguinte corrige; errar para o
 * lado de "com acesso" seria conteúdo pago liberado de graça.
 */
export function statusDaStripe(status: Stripe.Subscription.Status): StatusAssinatura {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "incomplete":
      return "incomplete";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "nenhuma";
  }
}

export type ResultadoDaGravacao = {
  /** false quando o evento foi descartado pela guarda de ordem. */
  gravado: boolean;
  assinatura: Assinatura;
};

/**
 * Grava o estado da assinatura no metadata do usuário no Clerk.
 *
 * `eventoEm` é o `event.created` da Stripe, em epoch de **segundos**. Antes de
 * escrever, a função lê o estado atual e descarta o evento se `eventoEm` for
 * menor que o `eventoEm` já gravado: os eventos da Stripe chegam fora de ordem
 * e, sem essa guarda, um `customer.subscription.updated` atrasado sobrescreve
 * um `deleted` recente e devolve acesso a quem cancelou. Igualdade passa —
 * dois eventos podem nascer no mesmo segundo.
 *
 * `statusForcado` existe para `invoice.payment_failed`, que sabe que a cobrança
 * falhou mas não traz uma subscription para reler: nesse caso o status é
 * imposto sobre o estado atual, sem mexer em plano, período ou id.
 *
 * Lança se o Clerk não estiver configurado — quem chama transforma isso em 500
 * para a Stripe reenviar. Falhar alto aqui é melhor que engolir: sem Clerk não
 * existe nenhum outro lugar onde o pagamento fique registrado.
 */
export async function gravarAssinatura(
  uid: string,
  subscription: Stripe.Subscription | null,
  eventoEm: number | null,
  statusForcado?: StatusAssinatura,
): Promise<ResultadoDaGravacao> {
  const clerk = obterClerk();
  if (!clerk) throw new Error("CLERK_SECRET_KEY ausente ao gravar a assinatura");

  const usuario = await clerk.users.getUser(uid);
  const publico = (usuario.publicMetadata ?? {}) as Record<string, unknown>;
  const privado = (usuario.privateMetadata ?? {}) as Record<string, unknown>;
  const atual = lerAssinatura(publico);

  // Guarda de ordem. Ver o bloco de documentação acima.
  if (eventoEm !== null && atual.eventoEm !== null && eventoEm < atual.eventoEm) {
    return { gravado: false, assinatura: atual };
  }

  const status =
    statusForcado ?? (subscription ? statusDaStripe(subscription.status) : atual.status);

  const nova: Assinatura = subscription
    ? {
        status,
        // Se o price não for um dos nossos, preserva o plano conhecido em vez
        // de zerá-lo — o usuário continua vendo o plano que assinou.
        plano: planoDaAssinatura(subscription) ?? atual.plano,
        stripeSubscriptionId: subscription.id,
        periodoFimEm: fimDoPeriodoEm(subscription) ?? atual.periodoFimEm,
        cancelaNoFimDoPeriodo: subscription.cancel_at_period_end === true,
        atualizadoEm: Date.now(),
        eventoEm: eventoEm ?? atual.eventoEm,
      }
    : {
        ...atual,
        status,
        atualizadoEm: Date.now(),
        eventoEm: eventoEm ?? atual.eventoEm,
      };

  // O customer pode chegar por aqui antes de qualquer checkout nosso (assinatura
  // criada no dashboard da Stripe, por exemplo). Aproveita para completar o
  // privateMetadata, que é o que o portal de cobrança usa.
  const customerId = subscription ? idDoCustomer(subscription.customer) : null;
  const precisaGravarCustomer =
    customerId !== null && privado.stripeCustomerId !== customerId;

  await clerk.users.updateUserMetadata(uid, {
    publicMetadata: {
      ...publico,
      assinatura: nova,
      // O espelho `membership` do formato antigo foi removido na integração:
      // os dois consumidores que o liam (app/page.tsx e app/api/lesson) já
      // passaram a usar `temAcesso()`. Continuar escrevendo um campo que
      // ninguém lê é estado duplicado esperando divergir.
      //
      // A leitura do formato antigo continua viva em `lerAssinatura`, e precisa
      // continuar: usuários cadastrados antes deste PRD só têm `membership` no
      // metadata, e removê-la revogaria o acesso de quem já pagou.
    },
    ...(precisaGravarCustomer
      ? { privateMetadata: { ...privado, stripeCustomerId: customerId } }
      : {}),
  });

  return { gravado: true, assinatura: nova };
}

/**
 * Descobre de quem é uma assinatura, na ordem do contrato:
 * `subscription.metadata.clerkUserId` -> `clientes_stripe` no D1 -> metadata do
 * próprio customer buscado na Stripe.
 *
 * Os dois últimos degraus existem porque assinaturas criadas fora do nosso
 * checkout (dashboard da Stripe, migração) chegam sem o nosso metadata.
 */
export async function uidDaSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const doMetadata = metadataDe(subscription).clerkUserId;
  if (doMetadata) return doMetadata;

  const customerId = idDoCustomer(subscription.customer);
  if (!customerId) return null;
  return uidDoCustomer(stripe, customerId);
}

/** Mesma cadeia de fallback, a partir de um customer. */
export async function uidDoCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<string | null> {
  const doBanco = await uidDoCliente(customerId);
  if (doBanco) return doBanco;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return metadataDe(customer).clerkUserId ?? null;
  } catch {
    // Customer inexistente ou Stripe indisponível: quem chama trata como
    // "não sei de quem é" e o evento é ignorado, não perdido — a Stripe
    // reentrega se respondermos 500, e aqui não respondemos.
    return null;
  }
}
