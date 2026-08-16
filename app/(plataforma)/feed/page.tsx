import { FeedInterativo } from "../../componentes/FeedInterativo";

export default function FeedPage() {
  return (
    <div className="area-content">
      <section className="area-hero">
        <div className="area-hero-copy"><p className="area-eyebrow">Feed da comunidade</p><h1>Implementações, decisões e aprendizados reais.</h1><p>Compartilhe avanços, receba respostas dos membros e salve conversas para consultar depois.</p></div>
        <div className="area-hero-aside"><strong>Ao vivo</strong><span>conversas da comunidade</span></div>
      </section>
      <FeedInterativo />
    </div>
  );
}
