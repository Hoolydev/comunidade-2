import { NextResponse } from "next/server";

import { ehPlanoValido, priceIdDoPlano } from "../../lib/planos";
import { sessaoDeRequest, urlDoApp } from "../../lib/sessao";
import { obterStripe } from "../../lib/stripe";
import { temAcesso, type CheckoutPedido, type RespostaErro } from "../../lib/tipos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let pedido: Partial<CheckoutPedido>;
  try {
    pedido = await request.json();
  } catch {
    return NextResponse.json<RespostaErro>({ erro: "plano_invalido" }, { status: 400 });
  }

  if (!ehPlanoValido(pedido.plano)) {
    return NextResponse.json<RespostaErro>({ erro: "plano_invalido" }, { status: 400 });
  }

  const sessao = await sessaoDeRequest(request);
  if (sessao.estado === "nao_configurado") {
    return NextResponse.json<RespostaErro>({ erro: "nao_configurado" }, { status: 503 });
  }
  if (sessao.estado !== "autenticado") {
    return NextResponse.json<RespostaErro>({ erro: "nao_autenticado" }, { status: 401 });
  }
  if (temAcesso(sessao.assinatura.status)) {
    return NextResponse.json<RespostaErro>({ erro: "ja_assinante" }, { status: 409 });
  }

  const stripe = obterStripe();
  const price = priceIdDoPlano(pedido.plano);
  if (!stripe || !price) {
    return NextResponse.json<RespostaErro>({ erro: "nao_configurado" }, { status: 503 });
  }

  try {
    const appUrl = await urlDoApp(request);
    const metadata = { clerkUserId: sessao.uid, plano: pedido.plano };
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: sessao.uid,
      metadata,
      subscription_data: { metadata },
      ...(sessao.stripeCustomerId
        ? { customer: sessao.stripeCustomerId }
        : sessao.email
          ? { customer_email: sessao.email }
          : {}),
      success_url: `${appUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/planos`,
      allow_promotion_codes: false,
      locale: "pt-BR",
    });

    if (!checkout.url) throw new Error("Checkout sem URL");
    return NextResponse.json({ url: checkout.url });
  } catch (erro) {
    console.error("Erro ao criar checkout", erro);
    return NextResponse.json<RespostaErro>({ erro: "erro_interno" }, { status: 500 });
  }
}
