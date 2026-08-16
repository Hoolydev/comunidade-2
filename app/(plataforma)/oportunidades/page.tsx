import { oportunidades } from "../../dados-comunidade";
import { OportunidadesInterativas } from "../../componentes/OportunidadesInterativas";

export default function OportunidadesPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Oportunidades</p><h1>Projetos e conexões que saem da comunidade.</h1><p>Demonstre interesse em demandas reais. A equipe Hágios recebe sua candidatura e facilita a conexão.</p></div><div className="area-hero-aside"><strong>{oportunidades.length}</strong><span>oportunidades abertas</span></div></section><div className="area-toolbar"><h2>Oportunidades recentes</h2></div><OportunidadesInterativas /></div>;
}
