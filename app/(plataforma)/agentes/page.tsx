import { AgentesInterativos } from "../../componentes/AgentesInterativos";

export default function AgentesPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Agentes especialistas</p><h1>Especialistas de IA para pensar e executar com você.</h1><p>Cada agente tem método, contexto e limites próprios para transformar uma necessidade do negócio em direção prática.</p></div><div className="area-hero-aside"><strong>4</strong><span>especialidades Hágios</span></div></section><div className="area-toolbar"><h2>Escolha o problema que você quer destravar</h2><span className="area-chip active"><span>●</span> Workers AI ativo</span></div><AgentesInterativos /></div>;
}
