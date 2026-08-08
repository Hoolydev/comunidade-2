"use client";

// Botão que abre o Billing Portal da Stripe (POST /api/portal).
// Usado no aviso de pagamento recusado, no menu da conta e na área de membros.

import { usePortal } from "./useCobranca";

type Props = {
  rotulo?: string;
  className?: string;
  children?: React.ReactNode;
};

export function BotaoPortal({
  rotulo = "Gerenciar assinatura",
  className = "assin-botao assin-botao--secundario",
  children,
}: Props) {
  const portal = usePortal();

  const texto =
    portal.fase === "abrindo"
      ? "Abrindo pagamento seguro…"
      : portal.fase === "voltando"
        ? "Redirecionando…"
        : rotulo;

  return (
    <div className="assin-acao">
      <button
        type="button"
        className={className}
        onClick={() => void portal.abrir()}
        disabled={portal.ocupado}
        aria-busy={portal.ocupado}
      >
        {portal.fase === "parado" && children}
        <span>{texto}</span>
      </button>
      <p className="assin-erro" role="alert" aria-live="assertive">
        {portal.erro ?? ""}
      </p>
    </div>
  );
}
