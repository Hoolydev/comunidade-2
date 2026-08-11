/**
 * Permite revisar a interface sem uma cobrança real apenas no servidor local.
 * Mesmo que a variável seja copiada por engano, ela nunca abre o paywall em produção.
 */
export function previewLocalAtivo() {
  return process.env.NODE_ENV === "development" && process.env.DEV_BYPASS_PAYWALL === "true";
}
