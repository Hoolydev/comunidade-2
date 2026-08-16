import { env } from "cloudflare:workers";

import { sessaoDeRequest } from "./sessao";
import { temAcesso } from "./tipos";

export type MembroComunidade = {
  uid: string;
  email: string | null;
  nome: string;
  fotoUrl: string | null;
};

export function bancoComunidade() {
  const db = env.DB;
  if (!db) throw new Error("banco_indisponivel");
  return db;
}

function nomeDoEmail(email: string | null) {
  const parte = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return parte ? parte.replace(/\b\p{L}/gu, (letra) => letra.toUpperCase()) : "Membro Hágios";
}

export async function autorizarComunidade(request: Request): Promise<MembroComunidade | null> {
  const sessao = await sessaoDeRequest(request);
  if (sessao.estado === "autenticado" && temAcesso(sessao.assinatura.status)) {
    return {
      uid: sessao.uid,
      email: sessao.email,
      nome: sessao.nome?.trim() || nomeDoEmail(sessao.email),
      fotoUrl: sessao.fotoUrl,
    };
  }
  if (process.env.NODE_ENV === "development") {
    return {
      uid: sessao.estado === "autenticado" ? sessao.uid : "preview-local",
      email: sessao.estado === "autenticado" ? sessao.email : "preview@hagios.local",
      nome: sessao.estado === "autenticado" ? sessao.nome?.trim() || nomeDoEmail(sessao.email) : "Membro Preview",
      fotoUrl: sessao.estado === "autenticado" ? sessao.fotoUrl : null,
    };
  }
  return null;
}

export async function garantirPerfil(membro: MembroComunidade) {
  const db = bancoComunidade();
  const agora = Date.now();
  await db
    .prepare(
      `INSERT INTO perfis
       (usuario_id, nome, email, cargo, foco, cidade, bio, foto_url, visivel, criado_em, atualizado_em)
       VALUES (?, ?, ?, 'Membro Hágios', 'Implementação de IA', 'Brasil', '', ?, 1, ?, ?)
       ON CONFLICT (usuario_id) DO UPDATE SET
         email = excluded.email,
         foto_url = COALESCE(excluded.foto_url, perfis.foto_url),
         atualizado_em = CASE
           WHEN perfis.nome = 'Membro Hágios' THEN excluded.atualizado_em
           ELSE perfis.atualizado_em
         END`,
    )
    .bind(membro.uid, membro.nome, membro.email, membro.fotoUrl, agora, agora)
    .run();
}

export function textoLimitado(valor: unknown, limite: number) {
  if (typeof valor !== "string") return "";
  return valor.trim().replace(/\s+/g, " ").slice(0, limite);
}

export function inteiroLimitado(valor: unknown, minimo: number, maximo: number) {
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(numero)) return minimo;
  return Math.min(maximo, Math.max(minimo, Math.round(numero)));
}

export function respostaErro(erro: unknown) {
  console.error("Erro na comunidade", erro);
  const indisponivel = erro instanceof Error && erro.message === "banco_indisponivel";
  return Response.json(
    { erro: indisponivel ? "banco_indisponivel" : "erro_interno" },
    { status: indisponivel ? 503 : 500 },
  );
}
