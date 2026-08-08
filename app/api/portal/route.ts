// POST /api/portal — leva o assinante ao Billing Portal da Stripe.
//
// Trocar cartão, ver faturas e cancelar acontecem lá, não aqui: é a mesma razão
// do checkout hospedado (AD-04), nenhum dado de cobrança passa pelo nosso
// domínio. O cancelamento feito no portal volta como `customer.subscription.*`
// no webhook, que é quem revoga o acesso.

import { sessaoDeRequest, urlDoApp } from "../../lib/sessao";
import { obterStripe } from "../../lib/stripe";
import type { PortalResposta, RespostaErro } from "../../lib/tipos";

export const runtime = "nodejs";

function erro(codigo: RespostaErro["erro"], status: number): Response {
  return Response.json({ erro: codigo } satisfies RespostaErro, { status });
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await abrirPortal(request);
  } catch {
    return erro("erro_interno", 500);
  }
}

async function abrirPortal(request: Request): Promise<Response> {
  const sessao = await sessaoDeRequest(request);
  if (sessao.estado === "nao_configurado") return erro("nao_configurado", 503);
  if (sessao.estado === "anonimo") return erro("nao_autenticado", 401);

  // Quem nunca chegou ao checkout não tem customer. Não é erro de sistema: o
  // cliente manda essa pessoa para /planos.
  if (!sessao.stripeCustomerId) return erro("sem_cliente_stripe", 404);

  const stripe = obterStripe();
  if (!stripe) return erro("nao_configurado", 503);

  const app = await urlDoApp(request);
  const portal = await stripe.billingPortal.sessions.create({
    customer: sessao.stripeCustomerId,
    return_url: `${app}/`,
  });

  return Response.json({ url: portal.url } satisfies PortalResposta);
}
