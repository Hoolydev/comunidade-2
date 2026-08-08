// POST /api/checkout — cria a Checkout Session hospedada da Stripe.
//
// O cliente envia o slug do plano, nunca o price (AD-06): o price sai do
// ambiente, aqui no servidor, o que elimina a classe de ataque "trocar o price
// no devtools". A liberação do acesso NÃO acontece aqui nem na success_url —
// ela acontece no webhook (AD-05).

import { guardarCliente } from "../../lib/eventos";
import { ehPlanoValido, priceIdDoPlano } from "../../lib/planos";
import { obterClerk, sessaoDeRequest, urlDoApp } from "../../lib/sessao";
import { obterStripe } from "../../lib/stripe";
import {
  temAcesso,
  type CheckoutResposta,
  type PlanoSlug,
  type RespostaErro,
  type SessaoAutenticada,
} from "../../lib/tipos";
import type Stripe from "stripe";

export const runtime = "nodejs";

function erro(codigo: RespostaErro["erro"], status: number): Response {
  return Response.json({ erro: codigo } satisfies RespostaErro, { status });
}

/**
 * Reaproveita o customer do usuário ou cria um.
 *
 * O id guardado é conferido na Stripe antes de ser usado porque ele sobrevive à
 * troca de chaves: um customer criado em `sk_test` não existe em `sk_live`, e
 * passá-lo para `checkout.sessions.create` derrubaria a rota com 500 em vez de
 * simplesmente criar um customer novo.
 */
async function obterOuCriarCustomer(
  stripe: Stripe,
  sessao: SessaoAutenticada,
): Promise<string> {
  if (sessao.stripeCustomerId) {
    try {
      const existente = await stripe.customers.retrieve(sessao.stripeCustomerId);
      if (!existente.deleted) return existente.id;
    } catch {
      // Some abaixo e cria um novo.
    }
  }

  const customer = await stripe.customers.create({
    email: sessao.email ?? undefined,
    name: sessao.nome ?? undefined,
    // Assim o customer também sabe de quem é: o webhook usa este metadata como
    // último degrau para descobrir o uid de eventos que chegam sem ele.
    metadata: { clerkUserId: sessao.uid },
  });

  // Duas gravações independentes de propósito: o Clerk é a fonte de verdade
  // (privateMetadata) e o D1 é só a busca reversa, que pode não existir.
  const clerk = obterClerk();
  if (clerk) {
    await clerk.users.updateUserMetadata(sessao.uid, {
      privateMetadata: { stripeCustomerId: customer.id },
    });
  }
  await guardarCliente(customer.id, sessao.uid);

  return customer.id;
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await criarCheckout(request);
  } catch {
    // Uma exceção não tratada viraria uma página de erro em texto, e o servidor
    // nunca devolve texto voltado ao usuário — só código de erro.
    return erro("erro_interno", 500);
  }
}

async function criarCheckout(request: Request): Promise<Response> {
  const sessao = await sessaoDeRequest(request);
  if (sessao.estado === "nao_configurado") return erro("nao_configurado", 503);
  if (sessao.estado === "anonimo") return erro("nao_autenticado", 401);

  let plano: PlanoSlug;
  try {
    const corpo = (await request.json()) as { plano?: unknown };
    if (!ehPlanoValido(corpo?.plano)) return erro("plano_invalido", 400);
    plano = corpo.plano;
  } catch {
    // Corpo ausente ou não é JSON — do ponto de vista do contrato é a mesma
    // coisa que mandar um plano que não existe.
    return erro("plano_invalido", 400);
  }

  // Assinante ativo não passa pelo checkout de novo: seria uma segunda
  // assinatura cobrando o mesmo usuário duas vezes.
  if (temAcesso(sessao.assinatura.status)) return erro("ja_assinante", 409);

  const stripe = obterStripe();
  const priceId = priceIdDoPlano(plano);
  if (!stripe || !priceId) return erro("nao_configurado", 503);

  const app = await urlDoApp(request);
  const customer = await obterOuCriarCustomer(stripe, sessao);

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer,
    client_reference_id: sessao.uid,
    metadata: { clerkUserId: sessao.uid, plano },
    // Sem isto os `customer.subscription.*` futuros chegam sem saber de quem
    // são: o metadata da sessão de checkout não desce para a assinatura.
    subscription_data: { metadata: { clerkUserId: sessao.uid, plano } },
    success_url: `${app}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${app}/planos`,
    allow_promotion_codes: false,
    locale: "pt-BR",
  });

  if (!checkout.url) return erro("nao_configurado", 503);

  return Response.json({ url: checkout.url } satisfies CheckoutResposta);
}
