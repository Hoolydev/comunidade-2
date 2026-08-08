"use client";

// /assinar — recebe `?plano=` de /planos, /cadastro e /entrar e leva ao
// checkout. Plano ausente ou inválido cai no mensal, que é o padrão de entrada.

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { CheckoutRedirect } from "./CheckoutRedirect";
import { ehPlanoValido } from "../lib/planos";
import "../estilos/assinatura.css";

function Espera() {
  return (
    <main className="confirma">
      <div className="confirma-caixa">
        <img src="/logo-hagios.png" alt="Movimento Hágios" />
        <span className="confirma-sinal" aria-hidden="true" />
        <div aria-live="polite">
          <h1>Validando seu acesso…</h1>
        </div>
      </div>
    </main>
  );
}

function Ponte() {
  const searchParams = useSearchParams();
  const bruto = searchParams.get("plano");
  const plano = ehPlanoValido(bruto) ? bruto : "mensal";
  return <CheckoutRedirect plano={plano} />;
}

export default function PaginaDeAssinatura() {
  return (
    <Suspense fallback={<Espera />}>
      <Ponte />
    </Suspense>
  );
}
