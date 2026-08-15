"use client";

import Link from "next/link";
import { useEffect } from "react";

export function RedirecionarAcesso({ destino }: { destino: string }) {
  useEffect(() => {
    window.location.replace(destino);
  }, [destino]);

  return (
    <main className="checkout-loading">
      <span className="checkout-spinner" aria-hidden="true" />
      <h1>Direcionando seu acesso…</h1>
      <p>Estamos levando você para a próxima etapa.</p>
      <Link href={destino}>Continuar</Link>
    </main>
  );
}
