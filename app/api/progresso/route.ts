import { autorizarMembro } from "../../lib/autorizacao-conteudo";
import {
  obterFormacao,
  obterProgresso,
  salvarProgresso,
} from "../../lib/conteudo";

export const runtime = "nodejs";

function aulaValida(aulaId: string) {
  const separador = aulaId.lastIndexOf(":");
  if (separador < 1) return null;
  const slug = aulaId.slice(0, separador);
  const numero = Number(aulaId.slice(separador + 1));
  if (!Number.isInteger(numero) || numero < 1) return null;
  return { slug, numero };
}

export async function GET(request: Request) {
  const membro = await autorizarMembro(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const aulaId = new URL(request.url).searchParams.get("aulaId");
  if (!aulaId || !aulaValida(aulaId)) {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }
  const progresso = await obterProgresso(membro.uid, aulaId);
  return Response.json({ progresso });
}

export async function POST(request: Request) {
  const membro = await autorizarMembro(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as
    | {
        aulaId?: string;
        posicaoSegundos?: number;
        duracaoSegundos?: number;
        concluida?: boolean;
      }
    | null;
  if (
    !corpo ||
    typeof corpo.aulaId !== "string" ||
    typeof corpo.posicaoSegundos !== "number" ||
    typeof corpo.duracaoSegundos !== "number" ||
    !Number.isFinite(corpo.posicaoSegundos) ||
    !Number.isFinite(corpo.duracaoSegundos)
  ) {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }

  const referencia = aulaValida(corpo.aulaId);
  if (!referencia) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  const formacao = await obterFormacao(referencia.slug);
  const existe = formacao?.aulas.some((aula) => aula.numero === referencia.numero);
  if (!existe) return Response.json({ erro: "aula_nao_encontrada" }, { status: 404 });

  const duracao = Math.max(0, corpo.duracaoSegundos);
  const posicao = Math.min(Math.max(0, corpo.posicaoSegundos), duracao || corpo.posicaoSegundos);
  const concluida = corpo.concluida === true || (duracao > 0 && posicao / duracao >= 0.9);
  await salvarProgresso(membro.uid, {
    aulaId: corpo.aulaId,
    posicaoSegundos: posicao,
    duracaoSegundos: duracao,
    concluida,
  });
  return Response.json({ salvo: true, concluida });
}
