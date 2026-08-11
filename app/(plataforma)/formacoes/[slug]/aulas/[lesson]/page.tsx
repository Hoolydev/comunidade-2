import Link from "next/link";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { formacoes } from "../../../../../dados-comunidade";

export function generateStaticParams() {
  return formacoes.flatMap((formacao) => formacao.lessonTitles.map((_, index) => ({ slug: formacao.slug, lesson: String(index + 1) })));
}

export default async function AulaPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const { slug, lesson } = await params;
  const formacao = formacoes.find((item) => item.slug === slug);
  const index = Number(lesson) - 1;
  if (!formacao || !formacao.lessonTitles[index]) return <div className="area-content"><p>Aula não encontrada.</p></div>;
  const previous = index > 0 ? `/formacoes/${slug}/aulas/${index}` : `/formacoes/${slug}`;
  const next = index < formacao.lessonTitles.length - 1 ? `/formacoes/${slug}/aulas/${index + 2}` : `/formacoes/${slug}`;

  return (
    <div className="area-content">
      <div className="lesson-heading"><p className="area-eyebrow">{formacao.title} · Aula {index + 1}</p><h1>{formacao.lessonTitles[index]}</h1><p>Assista, aplique o exercício e registre o que mudou no processo.</p></div>
      <div className="lesson-stage"><img src={formacao.cover} alt="" /><span className="lesson-play"><Play size={30} fill="currentColor" /></span></div>
      <div className="area-toolbar"><Link className="area-chip" href={previous}><ArrowLeft size={14} /> Aula anterior</Link><Link className="area-action" href={next}>{index === formacao.lessonTitles.length - 1 ? "Voltar à formação" : "Próxima aula"} <ArrowRight size={15} /></Link></div>
      <section className="material-detail-card"><h2>Objetivo desta aula</h2><p>Ao concluir, você terá uma decisão prática documentada e um próximo passo claro para avançar na implementação.</p><ul><li>Mapeie o cenário atual antes de automatizar.</li><li>Defina o resultado que precisa ser observado.</li><li>Registre dúvidas para levar à mentoria ou ao feed.</li></ul></section>
    </div>
  );
}
