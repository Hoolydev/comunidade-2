"use client";

// Cliente das rotas de assinatura descritas em docs/contrato.md.
//
// Regras que valem para as três chamadas:
// - o servidor nunca devolve texto para o usuário, só `{ erro: <codigo> }`;
// - se a rota ainda não existir (404) ou a resposta não for JSON, tratamos como
//   `erro_interno` em vez de quebrar a tela.

import type {
  AssinaturaResposta,
  CodigoErro,
  PlanoSlug,
  StatusAssinatura,
} from "../lib/tipos";
import { temAcesso } from "../lib/tipos";

export const ASSINATURA_VISITANTE: AssinaturaResposta = {
  autenticado: false,
  status: "nenhuma",
  plano: null,
  temAcesso: false,
  periodoFimEm: null,
  cancelaNoFimDoPeriodo: false,
};

export type ResultadoUrl =
  | { ok: true; url: string }
  | { ok: false; codigo: CodigoErro };

const STATUS_CONHECIDOS: StatusAssinatura[] = [
  "nenhuma",
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
];

function comoStatus(valor: unknown): StatusAssinatura {
  return STATUS_CONHECIDOS.includes(valor as StatusAssinatura)
    ? (valor as StatusAssinatura)
    : "nenhuma";
}

function comoPlano(valor: unknown): PlanoSlug | null {
  return valor === "mensal" || valor === "anual" ? valor : null;
}

function comoEpoch(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

/** Normaliza qualquer objeto solto no formato do contrato. */
export function normalizarAssinatura(bruto: unknown, autenticado: boolean): AssinaturaResposta {
  const dado = (bruto ?? {}) as Record<string, unknown>;
  const status = comoStatus(dado.status);
  return {
    autenticado: typeof dado.autenticado === "boolean" ? dado.autenticado : autenticado,
    status,
    plano: comoPlano(dado.plano),
    temAcesso: typeof dado.temAcesso === "boolean" ? dado.temAcesso : temAcesso(status),
    periodoFimEm: comoEpoch(dado.periodoFimEm),
    cancelaNoFimDoPeriodo: dado.cancelaNoFimDoPeriodo === true,
  };
}

async function lerJson(resposta: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await resposta.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function codigoDaResposta(corpo: Record<string, unknown> | null): CodigoErro {
  const bruto = corpo?.erro ?? corpo?.error;
  const conhecidos: CodigoErro[] = [
    "nao_autenticado",
    "plano_invalido",
    "ja_assinante",
    "sem_cliente_stripe",
    "nao_configurado",
    "erro_interno",
  ];
  return conhecidos.includes(bruto as CodigoErro) ? (bruto as CodigoErro) : "erro_interno";
}

/**
 * GET /api/assinatura — sempre 200 pelo contrato.
 * Devolve null quando a rota não respondeu, para quem chama decidir o fallback.
 */
export async function lerAssinatura(sinal?: AbortSignal): Promise<AssinaturaResposta | null> {
  try {
    const resposta = await fetch("/api/assinatura", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: sinal,
    });
    if (!resposta.ok) return null;
    const corpo = await lerJson(resposta);
    if (!corpo) return null;
    return normalizarAssinatura(corpo, corpo.autenticado === true);
  } catch {
    return null;
  }
}

/** POST /api/checkout — devolve a URL hospedada da Stripe. */
export async function criarCheckout(plano: PlanoSlug): Promise<ResultadoUrl> {
  try {
    const resposta = await fetch("/api/checkout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ plano }),
    });
    const corpo = await lerJson(resposta);
    if (resposta.ok && typeof corpo?.url === "string") return { ok: true, url: corpo.url };
    return { ok: false, codigo: codigoDaResposta(corpo) };
  } catch {
    return { ok: false, codigo: "erro_interno" };
  }
}

/** POST /api/portal — devolve a URL do Billing Portal da Stripe. */
export async function abrirPortal(): Promise<ResultadoUrl> {
  try {
    const resposta = await fetch("/api/portal", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const corpo = await lerJson(resposta);
    if (resposta.ok && typeof corpo?.url === "string") return { ok: true, url: corpo.url };
    return { ok: false, codigo: codigoDaResposta(corpo) };
  } catch {
    return { ok: false, codigo: "erro_interno" };
  }
}

/** "12 de março de 2026" — a partir de um epoch em milissegundos. */
export function formatarDataLonga(epochMs: number | null): string | null {
  if (!epochMs) return null;
  const data = new Date(epochMs);
  if (Number.isNaN(data.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}
