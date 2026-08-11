import { autorizarAdministrador } from "../../../lib/autorizacao-conteudo";
import {
  atualizarVideoAula,
  extrairYoutubeVideoId,
  listarFormacoes,
  listarMateriais,
} from "../../../lib/conteudo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await autorizarAdministrador(request);
  if (!admin) return Response.json({ erro: "nao_autorizado" }, { status: 403 });

  const [formacoes, materiais] = await Promise.all([
    listarFormacoes({ incluirRascunhos: true }),
    listarMateriais({ incluirRascunhos: true }),
  ]);
  return Response.json({ formacoes, materiais });
}

export async function PATCH(request: Request) {
  const admin = await autorizarAdministrador(request);
  if (!admin) return Response.json({ erro: "nao_autorizado" }, { status: 403 });

  const corpo = (await request.json().catch(() => null)) as
    | { acao?: string; aulaId?: string; youtubeUrl?: string }
    | null;
  if (corpo?.acao !== "video" || typeof corpo.aulaId !== "string") {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }

  const videoId = corpo.youtubeUrl?.trim() ? extrairYoutubeVideoId(corpo.youtubeUrl) : null;
  if (corpo.youtubeUrl?.trim() && !videoId) {
    return Response.json({ erro: "youtube_invalido" }, { status: 400 });
  }

  const formacoes = await listarFormacoes({ incluirRascunhos: true });
  const aula = formacoes.flatMap((formacao) => formacao.aulas).find((item) => item.id === corpo.aulaId);
  if (!aula) return Response.json({ erro: "aula_nao_encontrada" }, { status: 404 });

  await atualizarVideoAula(aula, videoId);
  return Response.json({ salvo: true, youtubeVideoId: videoId });
}
