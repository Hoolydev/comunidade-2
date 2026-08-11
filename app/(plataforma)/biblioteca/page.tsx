import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { listarMateriais } from "../../lib/conteudo";

const codigos: Record<string, string> = {
  Planilha: "XLS",
  Checklist: "CHK",
  Playbook: "PLAY",
  Roteiro: "GUIA",
  Template: "DOC",
  Canvas: "MAPA",
};

export default async function BibliotecaPage() {
  const materiais = await listarMateriais();
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Biblioteca de implementação</p><h1>Materiais para transformar aprendizado em execução.</h1><p>Planilhas, checklists, roteiros e modelos editáveis para você não começar do zero.</p></div><div className="area-hero-aside"><strong>{materiais.length}</strong><span>recursos disponíveis</span></div></section><div className="area-toolbar"><h2>Recursos da biblioteca</h2><div className="area-chips"><span className="area-chip active">Todos</span><span className="area-chip">Planilhas</span><span className="area-chip">Playbooks</span><span className="area-chip">Checklists</span></div></div><div className="resource-grid">{materiais.map((material, index) => <Link className={`resource-card resource-card--${(index % 4) + 1}`} href={`/biblioteca/${material.slug}`} key={material.slug}><div className="resource-art"><span className="resource-art-index">{String(index + 1).padStart(2, "0")}</span><span className="resource-art-code">{codigos[material.type] ?? "ARQ"}</span><i /><b>Movimento Hágios</b></div><div className="resource-card-copy"><div className="resource-card-top"><small>{material.type}</small>{material.nomeArquivo && <span>Disponível</span>}</div><h3>{material.title}</h3><p>{material.description}</p><footer><span>{material.meta}</span><strong>Abrir material <ArrowUpRight size={13} /></strong></footer></div></Link>)}</div></div>;
}
