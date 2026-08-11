import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, Play } from "lucide-react";
import { formacoes } from "../../../dados-comunidade";

export function generateStaticParams() { return formacoes.map(({ slug }) => ({ slug })); }

export default async function FormacaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const formacao = formacoes.find((item) => item.slug === slug);
  if (!formacao) return <div className="area-content"><p>Formação não encontrada.</p></div>;

  return (
    <div className="area-content">
      <section className="detail-hero">
        <div className="detail-cover"><img src={formacao.cover} alt={`Capa de ${formacao.title}`} /></div>
        <div className="detail-copy"><p className="area-eyebrow">{formacao.category} · {formacao.level}</p><h1>{formacao.title}</h1><p>{formacao.description}</p><div className="detail-meta"><span><BookOpen /> {formacao.lessons} aulas</span><span><Clock3 /> {formacao.duration}</span><span>Resultado: {formacao.outcome}</span></div><Link className="area-action" href={`/formacoes/${formacao.slug}/aulas/1`}>Começar formação <ArrowRight size={17} /></Link></div>
      </section>
      <h2 className="area-section-title">Conteúdo da formação</h2>
      <div className="lesson-list">
        {formacao.lessonTitles.map((title, index) => <Link className="lesson-row" href={`/formacoes/${formacao.slug}/aulas/${index + 1}`} key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{title}</strong><br /><small>{index === formacao.lessonTitles.length - 1 ? "Aplicação completa" : "Aula prática · 18 a 28 min"}</small></div><Play size={17} /></Link>)}
      </div>
    </div>
  );
}
