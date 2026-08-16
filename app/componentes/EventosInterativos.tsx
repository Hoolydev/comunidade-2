"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { CalendarCheck, CalendarPlus, ExternalLink, Play, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Evento = { id: string; titulo: string; descricao: string; anfitriao: string; tipo: string; inicioEm: number; duracaoMinutos: number; urlAoVivo: string | null; youtubeReplayId: string | null; confirmado: boolean; participantes: number };

function formatarData(data: number) {
  const valor = new Date(data);
  return {
    dia: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(valor).toUpperCase().replace(".", ""),
    hora: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(valor),
  };
}

export function EventosInterativos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [agora] = useState(() => Date.now());
  const carregar = useCallback(async () => {
    const resposta = await fetch("/api/comunidade/eventos", { cache: "no-store" });
    if (resposta.ok) setEventos(((await resposta.json()) as { eventos: Evento[] }).eventos);
    setCarregando(false);
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  async function confirmar(eventoId: string) {
    const resposta = await fetch("/api/comunidade/eventos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ eventoId }) });
    if (resposta.ok) {
      const { confirmado } = await resposta.json() as { confirmado: boolean };
      setEventos((atuais) => atuais.map((item) => item.id === eventoId ? { ...item, confirmado, participantes: Math.max(0, item.participantes + (confirmado ? 1 : -1)) } : item));
    }
  }

  const proximos = eventos.filter((item) => item.inicioEm + item.duracaoMinutos * 60000 >= agora && !item.youtubeReplayId);
  const replays = eventos.filter((item) => item.youtubeReplayId);

  return <>{carregando ? <div className="empty-state">Carregando agenda…</div> : <>
    <div className="area-toolbar"><h2>Próximos encontros</h2><span className="area-chip active">{proximos.length} na agenda</span></div>
    {proximos.length === 0 ? <div className="empty-state">A próxima agenda será publicada em breve.</div> : <div className="event-list">{proximos.map((evento) => { const data = formatarData(evento.inicioEm); return <article className="event-card event-card--interactive" key={evento.id}><div className="event-date"><strong>{data.dia}</strong><span>{data.hora}</span></div><div><span className="status-pill">{evento.tipo}</span><h3>{evento.titulo}</h3><p>{evento.descricao}</p><small>Com {evento.anfitriao} · {evento.duracaoMinutos} min · {evento.participantes} confirmados</small></div><div className="event-buttons"><button className={evento.confirmado ? "event-action confirmed" : "event-action"} onClick={() => void confirmar(evento.id)}>{evento.confirmado ? <CalendarCheck size={15} /> : <CalendarPlus size={15} />}{evento.confirmado ? "Presença confirmada" : "Confirmar presença"}</button>{evento.urlAoVivo && <a className="event-live" href={evento.urlAoVivo} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Acessar sala</a>}</div></article>; })}</div>}
    <div className="area-toolbar"><h2>Replays disponíveis</h2></div>
    {replays.length === 0 ? <div className="empty-state">Os replays aparecerão aqui depois dos encontros.</div> : <div className="agent-grid">{replays.map((evento) => <a className="agent-card replay-card" href={`https://www.youtube-nocookie.com/embed/${evento.youtubeReplayId}`} target="_blank" rel="noreferrer" key={evento.id}><header><span className="agent-symbol"><Video /></span><span className="status-pill">Replay</span></header><h3>{evento.titulo}</h3><p>{evento.descricao}</p><footer><Play size={14} /> Assistir replay</footer></a>)}</div>}
  </>}</>;
}
