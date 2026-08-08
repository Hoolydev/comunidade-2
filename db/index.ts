import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Banco = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Conexão com o D1, ou null quando o binding `DB` não existe.
 *
 * O binding depende de provisionamento pelo control plane (ver
 * docs/handoff/duvidas.md, D-05), então a ausência dele é um estado previsto e
 * não um erro: quem chama degrada. Em particular o webhook da Stripe precisa
 * creditar o pagamento mesmo sem banco — um binding ausente nunca pode
 * significar pagamento não creditado.
 *
 * Nada de `env` é lido no escopo do módulo: em Workers o ambiente pode não
 * existir quando o módulo é avaliado.
 */
export function obterBanco(): Banco | null {
  try {
    if (!env?.DB) return null;
    return drizzle(env.DB, { schema });
  } catch {
    // Fora do runtime do Workers `cloudflare:workers` não resolve `env`.
    return null;
  }
}

/**
 * Versão que lança. Use só onde o banco é requisito de verdade — nenhuma rota
 * de pagamento usa esta, de propósito.
 */
export function getDb(): Banco {
  const banco = obterBanco();
  if (!banco) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }
  return banco;
}
