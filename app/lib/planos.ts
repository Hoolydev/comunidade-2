// CONTRATO CONGELADO — ver CLAUDE.md.
//
// O cliente nunca envia um price da Stripe. Ele envia um slug ("mensal" |
// "anual") e o servidor resolve para o price real a partir do ambiente. Isso
// elimina a classe de ataque "trocar o price no devtools".

import type { PlanoSlug } from "./tipos";

export type Plano = {
  slug: PlanoSlug;
  nome: string;
  /** Valor cobrado por cobrança, em centavos. Usado só para exibição. */
  precoCentavos: number;
  /** Sufixo de exibição: "R$ 97 /mês". */
  periodo: string;
  /** Nome da variável de ambiente que guarda o price da Stripe. */
  variavelDePrice: string;
};

// ATENÇÃO — dívida assumida (T-B4): estes valores são a fonte de verdade da
// exibição, e os prices da Stripe são a fonte de verdade da cobrança. São duas
// fontes. Se divergirem, o usuário vê um valor e paga outro. Existe um card no
// backlog para buscar os preços da própria Stripe.
export const PLANOS: Record<PlanoSlug, Plano> = {
  mensal: {
    slug: "mensal",
    nome: "Mensal",
    precoCentavos: 9700,
    periodo: "/mês",
    variavelDePrice: "STRIPE_PRICE_MENSAL",
  },
  anual: {
    slug: "anual",
    nome: "Anual",
    precoCentavos: 97000,
    periodo: "/ano",
    variavelDePrice: "STRIPE_PRICE_ANUAL",
  },
};

export const SLUGS_DE_PLANO = Object.keys(PLANOS) as PlanoSlug[];

export function ehPlanoValido(valor: unknown): valor is PlanoSlug {
  // `hasOwn` e não `in`: o operador `in` percorre a cadeia de protótipos, então
  // `"constructor" in PLANOS` é verdadeiro. Com `in`, um slug inventado como
  // "toString" passava na validação e o usuário recebia 503 nao_configurado no
  // lugar do 400 plano_invalido que o contrato promete.
  return typeof valor === "string" && Object.hasOwn(PLANOS, valor);
}

/**
 * Resolve o slug para o price da Stripe. Devolve null quando a variável não
 * está no ambiente — quem chama responde `nao_configurado`, nunca 500 cru.
 *
 * `STRIPE_PRICE_ID` é aceito como fallback do plano mensal para não quebrar os
 * ambientes que já estavam configurados com a variável antiga.
 */
export function priceIdDoPlano(slug: PlanoSlug): string | null {
  const direto = process.env[PLANOS[slug].variavelDePrice];
  if (direto) return direto;
  if (slug === "mensal" && process.env.STRIPE_PRICE_ID) {
    return process.env.STRIPE_PRICE_ID;
  }
  return null;
}

/** Caminho inverso, usado pelo webhook para saber que plano foi assinado. */
export function planoDoPriceId(priceId: string | null | undefined): PlanoSlug | null {
  if (!priceId) return null;
  for (const slug of SLUGS_DE_PLANO) {
    if (priceIdDoPlano(slug) === priceId) return slug;
  }
  return null;
}

/** "R$ 97" — sem centavos quando são zero, que é o caso dos nossos planos. */
export function formatarPreco(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  }).format(centavos / 100);
}

/** Quanto o anual economiza em relação a doze cobranças mensais, em centavos. */
export function economiaDoAnual(): number {
  return PLANOS.mensal.precoCentavos * 12 - PLANOS.anual.precoCentavos;
}
