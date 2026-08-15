import { PLANOS } from "./planos";

// Stub de exibição enquanto app/lib/planos.ts permanece congelado pelo contrato.
// A alteração definitiva está registrada em docs/handoff/para-orquestrador.md.
export const PRECO_ANUAL_PUBLICO_CENTAVOS = 99_700;

export function economiaAnualPublicaCentavos(): number {
  return PLANOS.mensal.precoCentavos * 12 - PRECO_ANUAL_PUBLICO_CENTAVOS;
}

export function equivalenteMensalDoAnualCentavos(): number {
  return Math.round(PRECO_ANUAL_PUBLICO_CENTAVOS / 12);
}
