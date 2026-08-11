import { env } from "cloudflare:workers";

import { autorizarAdministrador } from "../../../lib/autorizacao-conteudo";
import { obterMaterial, removerArquivoMaterial, vincularArquivoMaterial } from "../../../lib/conteudo";

export const runtime = "nodejs";

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
]);

const LIMITE_BYTES = 25 * 1024 * 1024;

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
}

export async function POST(request: Request) {
  const admin = await autorizarAdministrador(request);
  if (!admin) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  if (!env.FILES) return Response.json({ erro: "armazenamento_nao_configurado" }, { status: 503 });

  const formulario = await request.formData();
  const slug = formulario.get("slug");
  const arquivo = formulario.get("arquivo");
  if (typeof slug !== "string" || !(arquivo instanceof File)) {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
    return Response.json({ erro: "tipo_nao_permitido" }, { status: 415 });
  }
  if (arquivo.size === 0 || arquivo.size > LIMITE_BYTES) {
    return Response.json({ erro: "tamanho_invalido" }, { status: 413 });
  }

  const material = await obterMaterial(slug, { incluirRascunhos: true });
  if (!material) return Response.json({ erro: "material_nao_encontrado" }, { status: 404 });

  const chave = `materiais/${slug}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`;
  await env.FILES.put(chave, await arquivo.arrayBuffer(), {
    httpMetadata: { contentType: arquivo.type },
    customMetadata: { material: slug, enviadoPor: admin.uid },
  });

  try {
    await vincularArquivoMaterial(slug, {
      objetoR2: chave,
      nomeArquivo: arquivo.name,
      mimeType: arquivo.type,
      tamanhoBytes: arquivo.size,
    });
  } catch (erro) {
    await env.FILES.delete(chave);
    throw erro;
  }

  if (material.objetoR2 && material.objetoR2 !== chave) {
    await env.FILES.delete(material.objetoR2).catch(() => undefined);
  }

  return Response.json({
    salvo: true,
    arquivo: { nome: arquivo.name, tamanhoBytes: arquivo.size, mimeType: arquivo.type },
  });
}

export async function DELETE(request: Request) {
  const admin = await autorizarAdministrador(request);
  if (!admin) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  if (!env.FILES) return Response.json({ erro: "armazenamento_nao_configurado" }, { status: 503 });
  const corpo = (await request.json().catch(() => null)) as { slug?: string } | null;
  if (typeof corpo?.slug !== "string") {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }
  const material = await obterMaterial(corpo.slug, { incluirRascunhos: true });
  if (!material) return Response.json({ erro: "material_nao_encontrado" }, { status: 404 });
  if (material.objetoR2) await env.FILES.delete(material.objetoR2);
  await removerArquivoMaterial(material.slug);
  return Response.json({ removido: true });
}
