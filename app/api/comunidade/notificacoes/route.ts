import {
  autorizarComunidade,
  bancoComunidade,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

type NotificacaoRow = {
  id: string;
  titulo: string;
  mensagem: string;
  href: string;
  criado_em: number;
  lida: number;
};

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  try {
    const resultado = await bancoComunidade()
      .prepare(
        `SELECT n.id, n.titulo, n.mensagem, n.href, n.criado_em,
                EXISTS(SELECT 1 FROM notificacoes_lidas l WHERE l.notificacao_id = n.id AND l.usuario_id = ?) AS lida
         FROM notificacoes n
         WHERE n.usuario_id IS NULL OR n.usuario_id = ?
         ORDER BY n.criado_em DESC LIMIT 30`,
      )
      .bind(membro.uid, membro.uid)
      .all<NotificacaoRow>();
    const notificacoes = resultado.results.map((item) => ({
      id: item.id,
      titulo: item.titulo,
      mensagem: item.mensagem,
      href: item.href,
      criadoEm: item.criado_em,
      lida: item.lida === 1,
    }));
    return Response.json({ notificacoes, naoLidas: notificacoes.filter((item) => !item.lida).length });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = textoLimitado(corpo?.id, 80);
  try {
    const db = bancoComunidade();
    if (id) {
      await db
        .prepare("INSERT OR REPLACE INTO notificacoes_lidas (notificacao_id, usuario_id, lida_em) VALUES (?, ?, ?)")
        .bind(id, membro.uid, Date.now())
        .run();
    } else {
      const resultado = await db
        .prepare("SELECT id FROM notificacoes WHERE usuario_id IS NULL OR usuario_id = ?")
        .bind(membro.uid)
        .all<{ id: string }>();
      if (resultado.results.length) {
        await db.batch(
          resultado.results.map((item) =>
            db
              .prepare("INSERT OR REPLACE INTO notificacoes_lidas (notificacao_id, usuario_id, lida_em) VALUES (?, ?, ?)")
              .bind(item.id, membro.uid, Date.now()),
          ),
        );
      }
    }
    return Response.json({ salvo: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
