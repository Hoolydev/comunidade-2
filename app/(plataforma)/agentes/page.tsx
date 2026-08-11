import { Bot, Sparkles } from "lucide-react";
import { agentes } from "../../dados-comunidade";

export default function AgentesPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Agentes especialistas</p><h1>Especialistas de IA para pensar e executar com você.</h1><p>Cada agente foi configurado para uma tarefa específica, com contexto e método alinhados ao Movimento Hágios.</p></div><div className="area-hero-aside"><strong>{agentes.length}</strong><span>agentes especializados</span></div></section><div className="area-toolbar"><h2>Escolha um especialista</h2><span className="area-chip active"><Sparkles size={13} /> Laboratório Hágios</span></div><div className="agent-grid">{agentes.map((agente) => <article className="agent-card" key={agente.name}><header><span className="agent-symbol"><Bot /></span><span className="status-pill">{agente.status}</span></header><h3>{agente.name}</h3><p>{agente.description}</p><footer>Iniciar conversa →</footer></article>)}</div></div>;
}
