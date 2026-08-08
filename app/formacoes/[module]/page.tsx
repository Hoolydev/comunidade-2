"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Lock,
  Play,
} from "lucide-react";
import { getModule } from "../../content";
import { getCompleted, moduleProgress } from "../../lib/progress";
import { lessonKey } from "../../content";

export default function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleSlug } = use(params);
  const module = getModule(moduleSlug);

  const [progress, setProgress] = useState(0);
  const [completed, setCompletedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    setProgress(moduleProgress(moduleSlug));
    setCompletedSet(getCompleted());
  }, [moduleSlug]);

  if (!module) {
    return (
      <main className="lesson-shell">
        <div className="lesson-missing">
          <h1>Módulo não encontrado</h1>
          <Link href="/">Voltar ao início</Link>
        </div>
      </main>
    );
  }

  const firstUndone =
    module.lessons.find((l) => !completed.has(lessonKey(moduleSlug, l.id))) ??
    module.lessons[0];

  return (
    <main className="lesson-shell">
      <header className="lesson-topbar">
        <Link href="/" className="lesson-back"><ArrowLeft size={18} /> Área de membros</Link>
      </header>

      <section className="module-hero">
        <div className="module-hero-art">
          <img src={module.cover} alt="" />
          <div className="module-hero-shade" />
        </div>
        <div className="module-hero-copy">
          <span className="lesson-eyebrow">{module.category}</span>
          <h1>{module.title}</h1>
          <p>{module.description}</p>
          <div className="module-hero-meta">
            <span><BookOpen size={15} /> {module.lessons.length} aulas</span>
            <span className="module-outcome">{module.outcome}</span>
          </div>
          <div className="module-progress">
            <div className="progress"><i style={{ width: `${progress}%` }} /></div>
            <strong>{progress}%</strong>
          </div>
          <Link href={`/formacoes/${moduleSlug}/${firstUndone.id}`} className="module-cta">
            <Play size={16} fill="currentColor" /> {progress > 0 ? "Continuar módulo" : "Começar módulo"}
          </Link>
        </div>
      </section>

      <ol className="module-lessons">
        {module.lessons.map((l, i) => {
          const isDone = completed.has(lessonKey(moduleSlug, l.id));
          return (
            <li key={l.id}>
              <Link href={`/formacoes/${moduleSlug}/${l.id}`}>
                <span className="module-lesson-icon">
                  {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </span>
                <span className="module-lesson-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="module-lesson-title">{l.title}</span>
                <span className="module-lesson-meta">
                  {l.free && <span className="lesson-tag">grátis</span>}
                  {!l.free && !l.youtubeId && <Lock size={14} />}
                  <span><Clock3 size={13} /> {l.duration}</span>
                  <ArrowRight size={15} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
