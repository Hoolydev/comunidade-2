import { env } from "cloudflare:workers";

import { autorizarMembro } from "../../../lib/autorizacao-conteudo";
import { obterMaterial } from "../../../lib/conteudo";

export const runtime = "nodejs";

function disposicao(nome: string) {
  const simples = nome.replace(/["\r\n]/g, "_");
  return `attachment; filename="${simples}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const membro = await autorizarMembro(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  if (!env.FILES) return Response.json({ erro: "armazenamento_nao_configurado" }, { status: 503 });

  const { slug } = await params;
  const material = await obterMaterial(slug);
  if (!material?.objetoR2 || !material.nomeArquivo) {
    return Response.json({ erro: "arquivo_nao_encontrado" }, { status: 404 });
  }

  const objeto = await env.FILES.get(material.objetoR2);
  if (!objeto) return Response.json({ erro: "arquivo_nao_encontrado" }, { status: 404 });

  return new Response(objeto.body, {
    headers: {
      "content-type": material.mimeType ?? objeto.httpMetadata?.contentType ?? "application/octet-stream",
      "content-disposition": disposicao(material.nomeArquivo),
      "content-length": String(objeto.size),
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
