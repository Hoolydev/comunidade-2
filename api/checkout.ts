import { json, priceDoPlano, sessao, stripe, temAcesso, type Plano, urlDoApp } from "./_shared.js";

const checkoutFunction = {
  async fetch(request: Request) {
    if (request.method !== "POST") return json({ erro: "metodo_nao_permitido" }, 405);
    const corpo = (await request.json().catch(() => null)) as { plano?: Plano } | null;
    if (corpo?.plano !== "mensal" && corpo?.plano !== "anual") {
      return json({ erro: "plano_invalido" }, 400);
    }

    const usuario = await sessao(request);
    if (usuario.estado === "nao_configurado") return json({ erro: "nao_configurado" }, 503);
    if (usuario.estado !== "autenticado") return json({ erro: "nao_autenticado" }, 401);
    if (temAcesso(usuario.assinatura.status)) return json({ erro: "ja_assinante" }, 409);

    const cliente = stripe();
    const price = priceDoPlano(corpo.plano);
    if (!cliente || !price) return json({ erro: "nao_configurado" }, 503);

    try {
      const metadata = { clerkUserId: usuario.uid, plano: corpo.plano };
      const checkout = await cliente.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        client_reference_id: usuario.uid,
        metadata,
        subscription_data: { metadata },
        ...(usuario.stripeCustomerId
          ? { customer: usuario.stripeCustomerId }
          : usuario.email
            ? { customer_email: usuario.email }
            : {}),
        success_url: `${urlDoApp()}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${urlDoApp()}/planos`,
        allow_promotion_codes: false,
        locale: "pt-BR",
      });
      if (!checkout.url) throw new Error("Checkout sem URL");
      return json({ url: checkout.url });
    } catch (erro) {
      console.error("Erro ao criar checkout", erro);
      return json({ erro: "erro_interno" }, 500);
    }
  },
};

export default checkoutFunction;
