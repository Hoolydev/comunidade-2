import { BuscaComunidade } from "../../componentes/BuscaComunidade";

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ termo?: string }> }) {
  const { termo = "" } = await searchParams;
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Busca Hágios</p><h1>Encontre o próximo passo.</h1><p>Pesquise formações, aulas, materiais, membros e conversas em um único lugar.</p></div></section><BuscaComunidade termoInicial={termo} /></div>;
}
