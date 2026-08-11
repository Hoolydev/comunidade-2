"use client";

import { useEffect, useId, useRef, useState } from "react";

type Player = {
  destroy(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
};

type PlayerEvent = { target: Player; data: number };

type YouTubeApi = {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      host?: string;
      playerVars: Record<string, number>;
      events: {
        onReady(event: PlayerEvent): void;
        onStateChange(event: PlayerEvent): void;
      };
    },
  ) => Player;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeApi> | null = null;

function carregarYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<YouTubeApi>((resolve) => {
    const callbackAnterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      callbackAnterior?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

export function YouTubeLessonPlayer({
  videoId,
  aulaId,
  titulo,
  capa,
}: {
  videoId: string | null;
  aulaId: string;
  titulo: string;
  capa: string;
}) {
  const reactId = useId().replace(/:/g, "");
  const elementId = `youtube-player-${reactId}`;
  const playerRef = useRef<Player | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posicaoInicialRef = useRef(0);
  const [concluida, setConcluida] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    let ativo = true;

    const salvar = async (forcarConclusao = false) => {
      const player = playerRef.current;
      if (!player) return;
      const posicaoSegundos = player.getCurrentTime() || 0;
      const duracaoSegundos = player.getDuration() || 0;
      const finalizada = forcarConclusao || (duracaoSegundos > 0 && posicaoSegundos / duracaoSegundos >= 0.9);
      if (finalizada && ativo) setConcluida(true);
      await fetch("/api/progresso", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aulaId, posicaoSegundos, duracaoSegundos, concluida: finalizada }),
        keepalive: true,
      }).catch(() => undefined);
    };

    const pararTimer = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };

    Promise.all([
      fetch(`/api/progresso?aulaId=${encodeURIComponent(aulaId)}`)
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null),
      carregarYouTubeApi(),
    ]).then(([dados, YT]) => {
      if (!ativo) return;
      const progresso = dados?.progresso as
        | { posicaoSegundos?: number; concluida?: boolean }
        | null
        | undefined;
      posicaoInicialRef.current = progresso?.posicaoSegundos ?? 0;
      setConcluida(progresso?.concluida === true);

      playerRef.current = new YT.Player(elementId, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 1,
          enablejsapi: 1,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady(event) {
            if (posicaoInicialRef.current > 5 && progresso?.concluida !== true) {
              event.target.seekTo(posicaoInicialRef.current, true);
            }
          },
          onStateChange(event) {
            if (event.data === 1) {
              pararTimer();
              timerRef.current = setInterval(() => void salvar(), 15_000);
            } else {
              pararTimer();
              if (event.data === 0) void salvar(true);
              if (event.data === 2) void salvar();
            }
          },
        },
      });
    });

    return () => {
      ativo = false;
      pararTimer();
      void salvar();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [aulaId, elementId, videoId]);

  if (!videoId) {
    return (
      <div className="lesson-stage lesson-stage--pending">
        <img src={capa} alt="" />
        <div className="lesson-pending-copy">
          <span>Conteúdo em preparação</span>
          <strong>{titulo}</strong>
          <p>O vídeo desta aula será publicado aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-stage">
      <div id={elementId} />
      {concluida && <span className="lesson-complete-badge">Aula concluída</span>}
    </div>
  );
}
