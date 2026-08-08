"use client";

// Ações de cobrança disparadas pelo cliente: abrir o checkout da Stripe e abrir
// o Billing Portal. As duas terminam em navegação externa, então o estado de
// "enviando" nunca é desligado no caminho feliz: a página vai ser substituída e
// o usuário precisa continuar vendo que algo está acontecendo.

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { PlanoSlug } from "../lib/tipos";
import { mensagemDeErro } from "../lib/erros-auth";
import { abrirPortal, criarCheckout } from "./assinaturaApi";

export type FaseDeSaida = "parado" | "abrindo" | "voltando";

export type Cobranca = {
  fase: FaseDeSaida;
  /** Verdadeiro enquanto o botão precisa ficar desabilitado. */
  ocupado: boolean;
  erro: string | null;
  limparErro: () => void;
};

export type Checkout = Cobranca & {
  assinar: (plano: PlanoSlug) => Promise<void>;
};

export type Portal = Cobranca & {
  abrir: () => Promise<void>;
};

/** Rota de login preservando o plano escolhido e o destino. */
export function caminhoDeEntrada(plano: PlanoSlug): string {
  const destino = `/assinar?plano=${plano}`;
  return `/entrar?plano=${plano}&destino=${encodeURIComponent(destino)}`;
}

export function useCheckout(): Checkout {
  const router = useRouter();
  const [fase, setFase] = useState<FaseDeSaida>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const travado = useRef(false);

  const assinar = useCallback(
    async (plano: PlanoSlug) => {
      // Trava síncrona: dois cliques rápidos não podem criar duas sessões.
      if (travado.current) return;
      travado.current = true;
      setErro(null);
      setFase("abrindo");

      const resultado = await criarCheckout(plano);

      if (resultado.ok) {
        window.location.assign(resultado.url);
        return; // mantém "abrindo": esta página está de saída.
      }

      // 409 é corrida legítima: alguém já é assinante. Não é falha.
      if (resultado.codigo === "ja_assinante") {
        setFase("voltando");
        router.replace("/");
        return;
      }

      if (resultado.codigo === "nao_autenticado") {
        setFase("voltando");
        router.push(caminhoDeEntrada(plano));
        return;
      }

      travado.current = false;
      setFase("parado");
      setErro(mensagemDeErro(resultado.codigo));
    },
    [router],
  );

  return {
    assinar,
    fase,
    ocupado: fase !== "parado",
    erro,
    limparErro: () => setErro(null),
  };
}

export function usePortal(): Portal {
  const router = useRouter();
  const [fase, setFase] = useState<FaseDeSaida>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const travado = useRef(false);

  const abrir = useCallback(async () => {
    if (travado.current) return;
    travado.current = true;
    setErro(null);
    setFase("abrindo");

    const resultado = await abrirPortal();

    if (resultado.ok) {
      window.location.assign(resultado.url);
      return;
    }

    if (resultado.codigo === "nao_autenticado") {
      setFase("voltando");
      router.push("/entrar?destino=%2F");
      return;
    }

    // Sem cliente na Stripe não há portal para abrir: o caminho é assinar.
    if (resultado.codigo === "sem_cliente_stripe") {
      setFase("voltando");
      router.push("/planos");
      return;
    }

    travado.current = false;
    setFase("parado");
    setErro(mensagemDeErro(resultado.codigo));
  }, [router]);

  return {
    abrir,
    fase,
    ocupado: fase !== "parado",
    erro,
    limparErro: () => setErro(null),
  };
}
