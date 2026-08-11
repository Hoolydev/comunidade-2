import Link from "next/link";
import { BookOpen, Clock3 } from "lucide-react";
import { formacoes } from "../../dados-comunidade";

export default function FormacoesPage() {
  return (
    <div className="area-content">
      <section className="area-hero">
        <div className="area-hero-copy"><p className="area-eyebrow">Formações Hágios</p><h1>Escolha o próximo processo que você vai transformar.</h1><p>Trilhas práticas organizadas por problema de negócio. Comece por uma necessidade real e avance até uma implementação funcional.</p></div>
        <div className="area-hero-aside"><strong>9</strong><span>formações iniciais</span></div>
      </section>
      <div className="area-toolbar"><h2>Todas as formações</h2><div className="area-chips"><span className="area-chip active">Todas</span><span className="area-chip">Atendimento</span><span className="area-chip">Marketing</span><span className="area-chip">Comercial</span></div></div>
      <div className="formation-grid">
        {formacoes.map((formacao) => (
          <Link className="formation-card" href={`/formacoes/${formacao.slug}`} key={formacao.slug}>
            <div className="formation-card-cover"><img src={formacao.cover} alt={`Capa de ${formacao.title}`} /><span>{formacao.category}</span></div>
            <div className="formation-card-body"><h3>{formacao.title}</h3><p>{formacao.description}</p><div className="formation-card-meta"><span><BookOpen /> {formacao.lessons} aulas</span><span><Clock3 /> {formacao.duration}</span><span>{formacao.level}</span></div></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
