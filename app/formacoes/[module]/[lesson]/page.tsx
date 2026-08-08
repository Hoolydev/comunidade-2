"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Lock,
  PlayCircle,
} from "lucide-react";
import { getLesson, getModule } from "../../../content";
import { isCompleted, setCompleted, setLast } from "../../../lib/progress";

type LessonState =
  | { kind: "loading" }
  | { kind: "video"; youtubeId: string }
  | { kind: "soon" }
  | { kind: "locked"; reason: "anonymous" | "subscription" }
  | { kind: "error"; message: string };

export default function LessonPage({
  params,
}: {
  params: Promise<{ module: string; lesson: string }>;
}) {
  const { module: moduleSlug, lesson: lessonId } = use(params);
  const found = getLesson(moduleSlug, lessonId);
  const module = getModule(moduleSlug);
  const exists = Boolean(found);
  const { getToken } = useAuth();
  const { isSignedIn, isLoaded } = useUser();

  const [state, setState] = useState<LessonState>({ kind: "loading" });
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!exists) return;
    setLast(moduleSlug, lessonId);
    setDone(isCompleted(moduleSlug, lessonId));
  }, [exists, moduleSlug, lessonId]);

  useEffect(() => {
    if (!exists || !isLoaded) return;
    let active = true;
    setState({ kind: "loading" });
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `/api/lesson?module=${encodeURIComponent(moduleSlug)}&lesson=${encodeURIComponent(lessonId)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        const data = await res.json();
        if (!active) return;
        if (res.status === 401) return setState({ kind: "locked", reason: "anonymous" });
        if (res.status === 402) return setState({ kind: "locked", reason: "subscription" });
        if (!res.ok) return setState({ kind: "error", message: data.error || "Erro ao carregar." });
        if (!data.youtubeId) return setState({ kind: "soon" });
        setState({ kind: "video", youtubeId: data.youtubeId });
      } catch {
        if (active) setState({ kind: "error", message: "Falha de conexão." });
      }
    })();
    return () => {
      active = false;
    };
    // getToken é estável no Clerk; deps intencionalmente restritas a primitivos
    // para evitar refetch em loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exists, moduleSlug, lessonId, isSignedIn, isLoaded]);

  if (!found || !module) {
    return (
      <main className="lesson-shell">
        <div className="lesson-missing">
          <h1>Aula não encontrada</h1>
          <Link href="/">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const { lesson, index } = found;
  const prev = index > 0 ? module.lessons[index - 1] : null;
  const next = index < module.lessons.length - 1 ? module.lessons[index + 1] : null;

  const toggleDone = () => {
    const value = !done;
    setDone(value);
    setCompleted(moduleSlug, lessonId, value);
  };

  return (
    <main className="lesson-shell">
      <header className="lesson-topbar">
        <Link href={`/formacoes/${moduleSlug}`} className="lesson-back">
          <ArrowLeft size={18} /> {module.title}
        </Link>
        <Link href="/" className="lesson-home">Área de membros</Link>
      </header>

      <div className="lesson-grid">
        <section className="lesson-main">
          <div className="lesson-player">
            {state.kind === "loading" && <div className="lesson-player-msg"><span className="checkout-spinner" /></div>}
            {state.kind === "video" && (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${state.youtubeId}?rel=0&modestbranding=1`}
                title={lesson.title}
                allow="accelerated-media; autoplay; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
            {state.kind === "soon" && (
              <div className="lesson-player-msg">
                <PlayCircle size={40} />
                <strong>Vídeo em breve</strong>
                <p>Esta aula ainda não recebeu o link do YouTube.</p>
              </div>
            )}
            {state.kind === "locked" && (
              <div className="lesson-player-msg lesson-locked">
                <Lock size={40} />
                <strong>{state.reason === "anonymous" ? "Entre para assistir" : "Conteúdo para membros"}</strong>
                <p>
                  {state.reason === "anonymous"
                    ? "Faça login na sua conta para acessar esta aula."
                    : "Ative sua assinatura do Movimento Hágios para liberar todas as aulas."}
                </p>
                <Link href={state.reason === "anonymous" ? "/entrar" : "/assinar"} className="lesson-unlock">
                  {state.reason === "anonymous" ? "Fazer login" : "Assinar agora"} <ArrowRight size={16} />
                </Link>
              </div>
            )}
            {state.kind === "error" && (
              <div className="lesson-player-msg"><strong>Não foi possível carregar a aula.</strong><p>{state.message}</p></div>
            )}
          </div>

          <div className="lesson-heading">
            <span className="lesson-eyebrow">{module.category} · AULA {String(index + 1).padStart(2, "0")}</span>
            <h1>{lesson.title}</h1>
            <div className="lesson-meta"><Clock3 size={15} /> {lesson.duration}</div>
          </div>

          <div className="lesson-actions">
            <button className={`lesson-done ${done ? "is-done" : ""}`} onClick={toggleDone}>
              {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              {done ? "Aula concluída" : "Marcar como concluída"}
            </button>
            <div className="lesson-nav">
              {prev ? (
                <Link href={`/formacoes/${moduleSlug}/${prev.id}`}><ArrowLeft size={16} /> Anterior</Link>
              ) : <span />}
              {next && (
                <Link href={`/formacoes/${moduleSlug}/${next.id}`} className="lesson-next">Próxima <ArrowRight size={16} /></Link>
              )}
            </div>
          </div>
        </section>

        <aside className="lesson-side">
          <p className="lesson-side-title">Aulas do módulo</p>
          <ol className="lesson-list">
            {module.lessons.map((l, i) => {
              const current = l.id === lessonId;
              return (
                <li key={l.id}>
                  <Link href={`/formacoes/${moduleSlug}/${l.id}`} className={current ? "current" : ""}>
                    <span className="lesson-list-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="lesson-list-title">{l.title}</span>
                    {l.free && !l.youtubeId ? null : l.free ? <span className="lesson-tag">grátis</span> : <Lock size={13} />}
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </main>
  );
}
