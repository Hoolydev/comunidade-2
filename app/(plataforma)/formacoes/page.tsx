import { CatalogoFormacoes } from "../../componentes/CatalogosInterativos";
import { formacoes } from "../../dados-comunidade";

export default function FormacoesPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Formações Hágios</p><h1>Escolha o próximo processo que você vai transformar.</h1><p>Trilhas práticas organizadas por problema de negócio. Filtre pela área e avance até uma implementação funcional.</p></div><div className="area-hero-aside"><strong>{formacoes.length}</strong><span>formações iniciais</span></div></section><CatalogoFormacoes formacoes={formacoes} /></div>;
}
