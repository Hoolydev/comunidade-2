import Link from "next/link";
import { ArrowRight, Workflow } from "lucide-react";
import { automacoes } from "../../dados-comunidade";

export default function AutomacoesPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Biblioteca de automações</p><h1>Comece por um fluxo que resolve um problema claro.</h1><p>Modelos de automação organizados por área, resultado esperado e nível de complexidade.</p></div><div className="area-hero-aside"><strong>{automacoes.length}</strong><span>fluxos iniciais</span></div></section><div className="area-toolbar"><h2>Automações recomendadas</h2><div className="area-chips"><span className="area-chip active">Todas</span><span className="area-chip">Atendimento</span><span className="area-chip">Comercial</span></div></div><div className="automation-grid">{automacoes.map((item, index) => <article className="automation-card" key={item.title}><header><span className="automation-symbol"><Workflow /></span><span className="status-pill">{String(index + 1).padStart(2, "0")} · {item.category}</span></header><h3>{item.title}</h3><p>{item.description}</p><footer><Link href="/formacoes">Ver formação relacionada <ArrowRight size={13} /></Link></footer></article>)}</div></div>;
}
