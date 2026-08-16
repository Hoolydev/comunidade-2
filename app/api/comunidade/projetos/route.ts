import {
  autorizarComunidade,
  bancoComunidade,
  inteiroLimitado,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

type ProjetoRow = {
  id: string;
  titulo: string;
  area: string;
  status: string;
  progresso: number;
  proxima_acao: string;
  criado_em: number;
  atualizado_em: number;
};

function mapear(row: ProjetoRow) {
  return {
    id: row.id,
    titulo: row.titulo,
    area: row.area,
    status: row.status,
    progresso: row.progresso,
    proximaAcao: row.proxima_acao,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  try {
    const resultado = await bancoComunidade()
      .prepare("SELECT * FROM projetos_membros WHERE usuario_id = ? ORDER BY atualizado_em DESC")
      .bind(membro.uid)
      .all<ProjetoRow>();
    return Response.json({ projetos: resultado.results.map(mapear) });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const titulo = textoLimitado(corpo?.titulo, 120);
  const area = textoLimitado(corpo?.area, 60);
  if (titulo.length < 3 || area.length < 2) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  try {
    const agora = Date.now();
    const id = crypto.randomUUID();
    await bancoComunidade()
      .prepare(
        `INSERT INTO projetos_membros
         (id, usuario_id, titulo, area, status, progresso, proxima_acao, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, 'Planejamento', 0, 'Definir o resultado esperado', ?, ?)`,
      )
      .bind(id, membro.uid, titulo, area, agora, agora)
      .run();
    return Response.json({ criado: true, id }, { status: 201 });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function PUT(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = textoLimitado(corpo?.id, 80);
  const titulo = textoLimitado(corpo?.titulo, 120);
  const area = textoLimitado(corpo?.area, 60);
  const status = textoLimitado(corpo?.status, 40);
  const proximaAcao = textoLimitado(corpo?.proximaAcao, 220);
  const progresso = inteiroLimitado(corpo?.progresso, 0, 100);
  if (!id || titulo.length < 3 || area.length < 2 || status.length < 2 || proximaAcao.length < 3) {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }
  try {
    await bancoComunidade()
      .prepare(
        `UPDATE projetos_membros SET titulo = ?, area = ?, status = ?, progresso = ?, proxima_acao = ?, atualizado_em = ?
         WHERE id = ? AND usuario_id = ?`,
      )
      .bind(titulo, area, status, progresso, proximaAcao, Date.now(), id, membro.uid)
      .run();
    return Response.json({ salvo: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function DELETE(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const id = textoLimitado(new URL(request.url).searchParams.get("id"), 80);
  if (!id) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  try {
    await bancoComunidade()
      .prepare("DELETE FROM projetos_membros WHERE id = ? AND usuario_id = ?")
      .bind(id, membro.uid)
      .run();
    return Response.json({ removido: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
