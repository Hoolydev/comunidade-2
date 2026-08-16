import {
  autorizarComunidade,
  bancoComunidade,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

type EventoRow = {
  id: string;
  titulo: string;
  descricao: string;
  anfitriao: string;
  tipo: string;
  inicio_em: number;
  duracao_minutos: number;
  url_ao_vivo: string | null;
  youtube_replay_id: string | null;
  confirmado: number;
  participantes: number;
};

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  try {
    const resultado = await bancoComunidade()
      .prepare(
        `SELECT e.*,
                EXISTS(SELECT 1 FROM presencas_eventos p WHERE p.evento_id = e.id AND p.usuario_id = ?) AS confirmado,
                (SELECT COUNT(*) FROM presencas_eventos p WHERE p.evento_id = e.id) AS participantes
         FROM eventos_comunidade e WHERE e.publicado = 1 ORDER BY e.inicio_em ASC`,
      )
      .bind(membro.uid)
      .all<EventoRow>();
    return Response.json({
      eventos: resultado.results.map((evento) => ({
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        anfitriao: evento.anfitriao,
        tipo: evento.tipo,
        inicioEm: evento.inicio_em,
        duracaoMinutos: evento.duracao_minutos,
        urlAoVivo: evento.url_ao_vivo,
        youtubeReplayId: evento.youtube_replay_id,
        confirmado: evento.confirmado === 1,
        participantes: Number(evento.participantes),
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
  const eventoId = textoLimitado(corpo?.eventoId, 80);
  if (!eventoId) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  try {
    const db = bancoComunidade();
    const existente = await db
      .prepare("SELECT 1 AS existe FROM presencas_eventos WHERE evento_id = ? AND usuario_id = ?")
      .bind(eventoId, membro.uid)
      .first<{ existe: number }>();
    if (existente) {
      await db.prepare("DELETE FROM presencas_eventos WHERE evento_id = ? AND usuario_id = ?").bind(eventoId, membro.uid).run();
      return Response.json({ confirmado: false });
    }
    await db
      .prepare("INSERT INTO presencas_eventos (evento_id, usuario_id, criado_em) VALUES (?, ?, ?)")
      .bind(eventoId, membro.uid, Date.now())
      .run();
    return Response.json({ confirmado: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
