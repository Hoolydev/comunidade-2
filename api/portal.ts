import { json, sessao, stripe, urlDoApp } from "./_shared.js";

const portalFunction = {
  async fetch(request: Request) {
    if (request.method !== "POST") return json({ erro: "metodo_nao_permitido" }, 405);
    const usuario = await sessao(request);
    if (usuario.estado === "nao_configurado") return json({ erro: "nao_configurado" }, 503);
    if (usuario.estado !== "autenticado") return json({ erro: "nao_autenticado" }, 401);
    if (!usuario.stripeCustomerId) return json({ erro: "sem_cliente_stripe" }, 404);
    const cliente = stripe();
    if (!cliente) return json({ erro: "nao_configurado" }, 503);

    try {
      const portal = await cliente.billingPortal.sessions.create({
        customer: usuario.stripeCustomerId,
        return_url: urlDoApp(),
      });
      return json({ url: portal.url });
    } catch (erro) {
      console.error("Erro ao abrir portal Stripe", erro);
      return json({ erro: "erro_interno" }, 500);
    }
  },
};

export default portalFunction;
