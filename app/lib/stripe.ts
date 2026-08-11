import Stripe from "stripe";

let clienteMemorizado: { chave: string; cliente: Stripe } | null = null;

/** Cliente Stripe exclusivamente do servidor. */
export function obterStripe(): Stripe | null {
  const chave = process.env.STRIPE_SECRET_KEY;
  if (!chave) return null;
  if (clienteMemorizado?.chave === chave) return clienteMemorizado.cliente;

  const cliente = new Stripe(chave, {
    appInfo: { name: "Movimento Hagios", version: "1.0.0" },
    maxNetworkRetries: 2,
  });
  clienteMemorizado = { chave, cliente };
  return cliente;
}
