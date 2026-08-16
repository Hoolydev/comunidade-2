import {
  autorizarComunidade,
  bancoComunidade,
  garantirPerfil,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

type PerfilRow = {
  usuario_id: string;
  nome: string;
  email: string | null;
  cargo: string;
  foco: string;
  cidade: string;
  bio: string;
  foto_url: string | null;
  visivel: number;
  atualizado_em: number;
};

function mapear(row: PerfilRow, proprioId: string) {
  return {
    usuarioId: row.usuario_id,
    nome: row.nome,
    email: row.usuario_id === proprioId ? row.email : null,
    cargo: row.cargo,
    foco: row.foco,
    cidade: row.cidade,
    bio: row.bio,
    fotoUrl: row.foto_url,
    visivel: row.visivel === 1,
    proprio: row.usuario_id === proprioId,
    atualizadoEm: row.atualizado_em,
  };
}

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  try {
    await garantirPerfil(membro);
    const db = bancoComunidade();
    const busca = textoLimitado(new URL(request.url).searchParams.get("busca"), 80);
    const termo = `%${busca}%`;
    const resultado = busca
      ? await db
          .prepare(
            `SELECT * FROM perfis
             WHERE (visivel = 1 OR usuario_id = ?)
               AND (nome LIKE ? OR cargo LIKE ? OR foco LIKE ? OR cidade LIKE ?)
             ORDER BY CASE WHEN usuario_id = ? THEN 0 ELSE 1 END, atualizado_em DESC LIMIT 100`,
          )
          .bind(membro.uid, termo, termo, termo, termo, membro.uid)
          .all<PerfilRow>()
      : await db
          .prepare(
            `SELECT * FROM perfis WHERE visivel = 1 OR usuario_id = ?
             ORDER BY CASE WHEN usuario_id = ? THEN 0 ELSE 1 END, atualizado_em DESC LIMIT 100`,
          )
          .bind(membro.uid, membro.uid)
          .all<PerfilRow>();
    return Response.json({ usuarioId: membro.uid, perfis: resultado.results.map((row) => mapear(row, membro.uid)) });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function PUT(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!corpo) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  const nome = textoLimitado(corpo.nome, 80);
  const cargo = textoLimitado(corpo.cargo, 100);
  const foco = textoLimitado(corpo.foco, 120);
  const cidade = textoLimitado(corpo.cidade, 80);
  const bio = textoLimitado(corpo.bio, 500);
  if (nome.length < 2 || cargo.length < 2 || foco.length < 2 || cidade.length < 2) {
    return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  }
  try {
    await garantirPerfil(membro);
    const db = bancoComunidade();
    await db
      .prepare(
        `UPDATE perfis SET nome = ?, cargo = ?, foco = ?, cidade = ?, bio = ?, visivel = ?, atualizado_em = ?
         WHERE usuario_id = ?`,
      )
      .bind(nome, cargo, foco, cidade, bio, corpo.visivel === false ? 0 : 1, Date.now(), membro.uid)
      .run();
    return Response.json({ salvo: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
