import Link from "next/link";
import { ArrowUpRight, FileCheck2, FileText, PanelsTopLeft, Sheet } from "lucide-react";
import { materiais } from "../../dados-comunidade";

const icons = { Planilha: Sheet, Checklist: FileCheck2, Playbook: PanelsTopLeft, Roteiro: FileText, Template: FileText, Canvas: PanelsTopLeft } as const;

export default function BibliotecaPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Biblioteca de implementação</p><h1>Materiais para transformar aprendizado em execução.</h1><p>Planilhas, checklists, roteiros e modelos editáveis para você não começar do zero.</p></div><div className="area-hero-aside"><strong>{materiais.length}</strong><span>recursos disponíveis</span></div></section><div className="area-toolbar"><h2>Recursos da biblioteca</h2><div className="area-chips"><span className="area-chip active">Todos</span><span className="area-chip">Planilhas</span><span className="area-chip">Playbooks</span><span className="area-chip">Checklists</span></div></div><div className="resource-grid">{materiais.map((material) => { const Icon = icons[material.type as keyof typeof icons] ?? FileText; return <Link className="resource-card" href={`/biblioteca/${material.slug}`} key={material.slug}><div className="resource-card-top"><span className="resource-icon"><Icon /></span><small>{material.type}</small></div><h3>{material.title}</h3><p>{material.description}</p><footer><span>{material.meta}</span><strong>Abrir material <ArrowUpRight size={13} /></strong></footer></Link>; })}</div></div>;
}
