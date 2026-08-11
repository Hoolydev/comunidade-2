"use client";

/* eslint-disable @next/next/no-img-element -- O otimizador de imagens do Vinext exige ASSETS e falha no preview local. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { PlanoSlug } from "../lib/tipos";

const mensagens: Record<string, string> = {
  plano_invalido: "O plano selecionado não é válido.",
  nao_configurado: "O checkout está em configuração. Tente novamente em breve.",
  erro_interno: "Não foi possível abrir o pagamento. Tente novamente.",
};

export function IniciarCheckout({ plano }: { plano: PlanoSlug }) {
  const router = useRouter();
  const iniciou = useRef(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    async function abrir() {
      try {
        const resposta = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plano }),
        });
        const dados = await resposta.json() as { url?: string; erro?: string };
        if (resposta.status === 401) {
          router.replace(`/entrar?destino=${encodeURIComponent(`/assinar?plano=${plano}`)}`);
          return;
        }
        if (resposta.status === 409) {
          router.replace("/");
          return;
        }
        if (!resposta.ok || !dados.url) throw new Error(dados.erro ?? "erro_interno");
        window.location.assign(dados.url);
      } catch (causa) {
        const codigo = causa instanceof Error ? causa.message : "erro_interno";
        setErro(mensagens[codigo] ?? mensagens.erro_interno);
      }
    }

    void abrir();
  }, [plano, router]);

  return (
    <main className="mh-process">
      <img src="/logo-hagios.png" alt="Movimento Hágios" width="80" height="80" />
      {erro ? (
        <>
          <p className="mh-eyebrow">NÃO CONCLUÍDO</p>
          <h1>Vamos tentar novamente.</h1>
          <p>{erro}</p>
          <Link className="mh-button mh-button--gold" href="/planos">Voltar aos planos</Link>
        </>
      ) : (
        <>
          <span className="mh-spinner" aria-hidden="true" />
          <h1>Preparando seu checkout seguro…</h1>
          <p>Você será direcionado para o ambiente protegido da Stripe.</p>
        </>
      )}
    </main>
  );
}
