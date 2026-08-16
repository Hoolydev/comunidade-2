import {
  autorizarComunidade,
  bancoComunidade,
  garantirPerfil,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

type PublicacaoRow = {
  id: string;
  autor_id: string;
  autor_nome: string;
  autor_cargo: string;
  autor_foto: string | null;
  categoria: string;
  titulo: string;
  conteudo: string;
  criado_em: number;
  curtidas: number;
  comentarios: number;
  curtiu: number;
  salvou: number;
};

type ComentarioRow = {
  id: string;
  publicacao_id: string;
  autor_id: string;
  autor_nome: string;
  conteudo: string;
  criado_em: number;
};

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });

  try {
    await garantirPerfil(membro);
    const db = bancoComunidade();
    const [publicacoes, comentarios] = await Promise.all([
      db
        .prepare(
          `SELECT p.id, p.autor_id, COALESCE(f.nome, 'Membro Hágios') AS autor_nome,
                  COALESCE(f.cargo, 'Membro Hágios') AS autor_cargo, f.foto_url AS autor_foto,
                  p.categoria, p.titulo, p.conteudo, p.criado_em,
                  (SELECT COUNT(*) FROM interacoes_publicacao i WHERE i.publicacao_id = p.id AND i.curtiu = 1) AS curtidas,
                  (SELECT COUNT(*) FROM comentarios c WHERE c.publicacao_id = p.id) AS comentarios,
                  COALESCE((SELECT i.curtiu FROM interacoes_publicacao i WHERE i.publicacao_id = p.id AND i.usuario_id = ?), 0) AS curtiu,
                  COALESCE((SELECT i.salvou FROM interacoes_publicacao i WHERE i.publicacao_id = p.id AND i.usuario_id = ?), 0) AS salvou
           FROM publicacoes p LEFT JOIN perfis f ON f.usuario_id = p.autor_id
           ORDER BY p.criado_em DESC LIMIT 50`,
        )
        .bind(membro.uid, membro.uid)
        .all<PublicacaoRow>(),
      db
        .prepare(
          `SELECT c.id, c.publicacao_id, c.autor_id,
                  COALESCE(f.nome, 'Membro Hágios') AS autor_nome,
                  c.conteudo, c.criado_em
           FROM comentarios c LEFT JOIN perfis f ON f.usuario_id = c.autor_id
           WHERE c.publicacao_id IN (SELECT id FROM publicacoes ORDER BY criado_em DESC LIMIT 50)
           ORDER BY c.criado_em ASC`,
        )
        .all<ComentarioRow>(),
    ]);

    return Response.json(
      {
        usuarioId: membro.uid,
        publicacoes: publicacoes.results.map((post) => ({
          id: post.id,
          autorId: post.autor_id,
          autorNome: post.autor_nome,
          autorCargo: post.autor_cargo,
          autorFoto: post.autor_foto,
          categoria: post.categoria,
          titulo: post.titulo,
          conteudo: post.conteudo,
          criadoEm: post.criado_em,
          curtidas: Number(post.curtidas),
          comentarios: comentarios.results.filter((item) => item.publicacao_id === post.id).map((item) => ({
            id: item.id,
            autorId: item.autor_id,
            autorNome: item.autor_nome,
            conteudo: item.conteudo,
            criadoEm: item.criado_em,
          })),
          totalComentarios: Number(post.comentarios),
          curtiu: post.curtiu === 1,
          salvou: post.salvou === 1,
        })),
      },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!corpo) return Response.json({ erro: "dados_invalidos" }, { status: 400 });

  try {
    await garantirPerfil(membro);
    const db = bancoComunidade();
    const agora = Date.now();
    const publicacaoId = textoLimitado(corpo.publicacaoId, 80);

    if (corpo.acao === "curtir" || corpo.acao === "salvar") {
      if (!publicacaoId) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
      const coluna = corpo.acao === "curtir" ? "curtiu" : "salvou";
      await db
        .prepare(
          `INSERT INTO interacoes_publicacao (publicacao_id, usuario_id, curtiu, salvou, atualizado_em)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (publicacao_id, usuario_id) DO UPDATE SET
             ${coluna} = CASE WHEN ${coluna} = 1 THEN 0 ELSE 1 END,
             atualizado_em = excluded.atualizado_em`,
        )
        .bind(publicacaoId, membro.uid, corpo.acao === "curtir" ? 1 : 0, corpo.acao === "salvar" ? 1 : 0, agora)
        .run();
      return Response.json({ salvo: true });
    }

    const conteudo = textoLimitado(corpo.conteudo, publicacaoId ? 800 : 3000);
    if (publicacaoId) {
      if (conteudo.length < 2) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
      await db
        .prepare("INSERT INTO comentarios (id, publicacao_id, autor_id, conteudo, criado_em) VALUES (?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), publicacaoId, membro.uid, conteudo, agora)
        .run();
      return Response.json({ criado: true }, { status: 201 });
    }

    const titulo = textoLimitado(corpo.titulo, 140);
    const categoria = textoLimitado(corpo.categoria, 40) || "Implementação";
    if (titulo.length < 4 || conteudo.length < 10) {
      return Response.json({ erro: "dados_invalidos" }, { status: 400 });
    }
    await db
      .prepare(
        `INSERT INTO publicacoes (id, autor_id, categoria, titulo, conteudo, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(crypto.randomUUID(), membro.uid, categoria, titulo, conteudo, agora, agora)
      .run();
    return Response.json({ criado: true }, { status: 201 });
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
    const db = bancoComunidade();
    await db.batch([
      db.prepare("DELETE FROM comentarios WHERE publicacao_id = ?").bind(id),
      db.prepare("DELETE FROM interacoes_publicacao WHERE publicacao_id = ?").bind(id),
      db.prepare("DELETE FROM publicacoes WHERE id = ? AND autor_id = ?").bind(id, membro.uid),
    ]);
    return Response.json({ removido: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
