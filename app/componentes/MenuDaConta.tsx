"use client";

// Menu da conta no rodapé da barra lateral. Existe por dois motivos:
// dar um lugar previsível para "Gerenciar assinatura" e não deixar o botão de
// opções ser um beco sem saída.

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { CreditCard, MoreHorizontal, Receipt } from "lucide-react";

import { usePortal } from "./useCobranca";

export function MenuDaConta() {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLButtonElement>(null);
  const idMenu = useId();
  const portal = usePortal();

  useEffect(() => {
    if (!aberto) return;

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      setAberto(false);
      gatilho.current?.focus();
    };
    const aoClicar = (evento: MouseEvent) => {
      if (caixa.current?.contains(evento.target as Node)) return;
      setAberto(false);
    };

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [aberto]);

  const rotuloPortal =
    portal.fase === "abrindo"
      ? "Abrindo pagamento seguro…"
      : portal.fase === "voltando"
        ? "Redirecionando…"
        : "Gerenciar assinatura";

  return (
    <div className="menu-conta" ref={caixa}>
      <button
        ref={gatilho}
        type="button"
        className="menu-conta-gatilho"
        aria-label="Opções da conta"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={idMenu}
        onClick={() => setAberto((valor) => !valor)}
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>

      {aberto && (
        <div className="menu-conta-lista" id={idMenu} role="menu">
          <button
            type="button"
            role="menuitem"
            className="menu-conta-item"
            onClick={() => void portal.abrir()}
            disabled={portal.ocupado}
            aria-busy={portal.ocupado}
          >
            <CreditCard size={16} aria-hidden="true" />
            <span>{rotuloPortal}</span>
          </button>
          <Link
            href="/planos"
            role="menuitem"
            className="menu-conta-item"
            onClick={() => setAberto(false)}
          >
            <Receipt size={16} aria-hidden="true" />
            <span>Ver planos</span>
          </Link>
          <p className="menu-conta-erro" role="alert" aria-live="assertive">
            {portal.erro ?? ""}
          </p>
        </div>
      )}
    </div>
  );
}
