import { NextResponse } from "next/server";

import { sessaoDeRequest, urlDoApp } from "../../lib/sessao";
import { obterStripe } from "../../lib/stripe";
import type { RespostaErro } from "../../lib/tipos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessao = await sessaoDeRequest(request);
  if (sessao.estado === "nao_configurado") {
    return NextResponse.json<RespostaErro>({ erro: "nao_configurado" }, { status: 503 });
  }
  if (sessao.estado !== "autenticado") {
    return NextResponse.json<RespostaErro>({ erro: "nao_autenticado" }, { status: 401 });
  }
  if (!sessao.stripeCustomerId) {
    return NextResponse.json<RespostaErro>({ erro: "sem_cliente_stripe" }, { status: 404 });
  }

  const stripe = obterStripe();
  if (!stripe) {
    return NextResponse.json<RespostaErro>({ erro: "nao_configurado" }, { status: 503 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: sessao.stripeCustomerId,
      return_url: await urlDoApp(request),
    });
    return NextResponse.json({ url: portal.url });
  } catch (erro) {
    console.error("Erro ao abrir portal Stripe", erro);
    return NextResponse.json<RespostaErro>({ erro: "erro_interno" }, { status: 500 });
  }
}
