import {
  autorizarComunidade,
  bancoComunidade,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  try {
    const resultado = await bancoComunidade()
      .prepare("SELECT oportunidade_id, status, criado_em FROM candidaturas WHERE usuario_id = ?")
      .bind(membro.uid)
      .all<{ oportunidade_id: string; status: string; criado_em: number }>();
    return Response.json({
      candidaturas: resultado.results.map((item) => ({
        oportunidadeId: item.oportunidade_id,
        status: item.status,
        criadoEm: item.criado_em,
      })),
    });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const oportunidadeId = textoLimitado(corpo?.oportunidadeId, 80);
  const mensagem = textoLimitado(corpo?.mensagem, 600) || "Tenho interesse em conversar sobre esta oportunidade.";
  if (!oportunidadeId) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  try {
    await bancoComunidade()
      .prepare(
        `INSERT INTO candidaturas (oportunidade_id, usuario_id, mensagem, status, criado_em)
         VALUES (?, ?, ?, 'enviada', ?)
         ON CONFLICT (oportunidade_id, usuario_id) DO UPDATE SET mensagem = excluded.mensagem`,
      )
      .bind(oportunidadeId, membro.uid, mensagem, Date.now())
      .run();
    return Response.json({ enviada: true }, { status: 201 });
  } catch (erro) {
    return respostaErro(erro);
  }
}
