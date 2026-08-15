# Pedidos para o orquestrador

Precisa de mudança em arquivo que não é seu? Não edite. Descreva aqui o motivo e
o diff proposto, e siga trabalhando com um stub local.

Formato:

## [T-XX] título curto
**Arquivo:** caminho
**Motivo:** por que o contrato atual não resolve
**Proposta:** o diff

---

## [T-OFFER] Atualizar o valor público do plano anual
**Arquivo:** `app/lib/planos.ts`
**Motivo:** o preço anual criado na Stripe passou de R$ 970 para R$ 997. O arquivo é congelado pelo contrato, mas seus valores são usados para exibição.
**Proposta:** alterar `PLANOS.anual.precoCentavos` de `97000` para `99700`. Até a alteração ser aprovada, `app/lib/oferta-publica.ts` mantém o valor correto como stub de exibição.

---
