import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { oportunidades } from "../../dados-comunidade";

export default function OportunidadesPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Oportunidades</p><h1>Projetos e conexões que saem da comunidade.</h1><p>Encontre demandas reais, parceiros de implementação e oportunidades para aplicar suas competências.</p></div><div className="area-hero-aside"><strong>{oportunidades.length}</strong><span>oportunidades abertas</span></div></section><div className="area-toolbar"><h2>Oportunidades recentes</h2><div className="area-chips"><span className="area-chip active">Todas</span><span className="area-chip">Projetos</span><span className="area-chip">Parcerias</span></div></div><div className="opportunity-list">{oportunidades.map((item) => <article className="opportunity-card" key={item.title}><div><span className="status-pill">{item.tag}</span><p className="opportunity-company">{item.company}</p></div><div><h3>{item.title}</h3><p>{item.description}</p></div><aside><span>{item.deadline}</span><Link className="area-action" href="/membros">Quero participar <ArrowRight size={14} /></Link></aside></article>)}</div></div>;
}
