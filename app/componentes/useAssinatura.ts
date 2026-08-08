"use client";

// Estado da assinatura no cliente.
//
// Fonte primária: GET /api/assinatura (lê do servidor, enxerga a escrita do
// webhook na hora). Fallback: publicMetadata.assinatura do Clerk, que só muda
// quando o token é renovado — serve para não piscar a tela enquanto a rota
// responde, e para a tela continuar de pé se a rota falhar.

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";

import type { AssinaturaResposta } from "../lib/tipos";
import {
  ASSINATURA_VISITANTE,
  lerAssinatura,
  normalizarAssinatura,
} from "./assinaturaApi";

export type EstadoConta = {
  /** Verdadeiro enquanto ainda não sabemos o estado real. */
  carregando: boolean;
  autenticado: boolean;
  assinatura: AssinaturaResposta;
  recarregar: () => Promise<AssinaturaResposta | null>;
};

/** Lê `publicMetadata.assinatura` sem confiar no formato. */
export function assinaturaDoClerk(
  metadata: unknown,
): AssinaturaResposta | null {
  const raiz = (metadata ?? {}) as Record<string, unknown>;
  const bruto = raiz.assinatura;
  if (!bruto || typeof bruto !== "object") return null;
  return normalizarAssinatura(bruto, true);
}

export function useAssinatura(): EstadoConta {
  const { isLoaded, isSignedIn, user } = useUser();
  const [remoto, setRemoto] = useState<AssinaturaResposta | null>(null);
  const [consultado, setConsultado] = useState(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const recarregar = useCallback(async () => {
    const dados = await lerAssinatura();
    if (!montado.current) return dados;
    if (dados) setRemoto(dados);
    setConsultado(true);
    return dados;
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setRemoto(ASSINATURA_VISITANTE);
      setConsultado(true);
      return;
    }
    void recarregar();
  }, [isLoaded, isSignedIn, recarregar]);

  const doClerk = isSignedIn ? assinaturaDoClerk(user?.publicMetadata) : null;
  const assinatura = remoto ?? doClerk ?? ASSINATURA_VISITANTE;

  return {
    carregando: !isLoaded || (isSignedIn === true && !consultado && remoto === null && doClerk === null),
    autenticado: isSignedIn === true,
    assinatura,
    recarregar,
  };
}
