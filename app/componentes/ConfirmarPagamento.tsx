"use client";

/* eslint-disable @next/next/no-img-element -- O otimizador de imagens do Vinext exige ASSETS e falha no preview local. */

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AssinaturaResposta } from "../lib/tipos";

export function ConfirmarPagamento({ sessionId }: { sessionId: string | null }) {
  const [estado, setEstado] = useState<"confirmando" | "liberado" | "demorando">("confirmando");

  useEffect(() => {
    let cancelado = false;
    let tentativas = 0;
    let timer: number | undefined;

    async function conferir() {
      try {
        const resposta = await fetch("/api/assinatura", { cache: "no-store" });
        const dados = await resposta.json() as AssinaturaResposta;
        if (cancelado) return;
        if (dados.temAcesso) {
          setEstado("liberado");
          return;
        }
      } catch {
        // O polling continua; uma oscilação momentânea não deve assustar o aluno.
      }
      tentativas += 1;
      if (tentativas >= 10) {
        setEstado("demorando");
        return;
      }
      timer = window.setTimeout(conferir, 2000);
    }

    void conferir();
    return () => {
      cancelado = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <main className="mh-process">
      <img src="/logo-hagios.png" alt="Movimento Hágios" width="80" height="80" />
      {estado === "confirmando" && <span className="mh-spinner" aria-hidden="true" />}
      <p className="mh-eyebrow">PAGAMENTO RECEBIDO</p>
      <h1>{estado === "liberado" ? "Seu acesso está liberado." : "Estamos ativando sua assinatura."}</h1>
      <p>
        {estado === "demorando"
          ? "A confirmação está levando um pouco mais que o normal. O acesso será liberado automaticamente assim que a Stripe concluir o processamento."
          : estado === "liberado"
            ? "Bem-vindo ao Movimento Hágios. Suas formações já estão disponíveis."
            : "Isso costuma levar apenas alguns segundos. Pode manter esta página aberta."}
      </p>
      {estado === "liberado" && <Link className="mh-button mh-button--gold" href="/">Entrar na comunidade</Link>}
      {estado === "demorando" && (
        <div className="mh-process__reference">
          <span>Referência do checkout</span>
          <code>{sessionId ?? "não informada"}</code>
          <Link href="/planos">Voltar aos planos</Link>
        </div>
      )}
    </main>
  );
}
