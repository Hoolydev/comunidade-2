// Regras puras da tela de confirmação de pagamento (/pagamento/sucesso).
// Ficam fora do componente para poderem ser conferidas isoladamente.

/** Ids de sessão da Stripe são opacos, mas sempre alfanuméricos. */
const FORMATO_SESSAO = /^[A-Za-z0-9_-]{1,200}$/;

export const SEGUNDOS_FINALIZANDO = 5;
export const SEGUNDOS_DEMORANDO = 20;

export type EtapaDaEspera = "confirmando" | "finalizando" | "demorando";

/**
 * O tempo muda o significado da espera:
 *   0–5s   confirmando
 *   5–20s  finalizando, não feche a página
 *   >20s   o webhook provavelmente falhou
 */
export function etapaPor(segundos: number): EtapaDaEspera {
  if (segundos < SEGUNDOS_FINALIZANDO) return "confirmando";
  if (segundos < SEGUNDOS_DEMORANDO) return "finalizando";
  return "demorando";
}

/** 2s no começo; depois recua, para não torrar bateria nem cota. */
export function intervaloPor(segundos: number): number {
  if (segundos < SEGUNDOS_DEMORANDO) return 2000;
  if (segundos < 60) return 5000;
  return 15000;
}

/**
 * `session_id` vem da URL, ou seja, de qualquer pessoa. Só passa o que tem
 * cara de id da Stripe — o valor é exibido na tela e vai dentro de um mailto.
 */
export function sessaoValida(bruto: string | null): string | null {
  if (!bruto) return null;
  return FORMATO_SESSAO.test(bruto) ? bruto : null;
}
