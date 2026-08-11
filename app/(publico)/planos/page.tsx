import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { MarcaHagios } from "../../componentes/MarcaHagios";
import { economiaDoAnual, formatarPreco, PLANOS } from "../../lib/planos";

const beneficios = [
  "Acesso a todas as formações e atualizações",
  "Biblioteca de templates, planilhas e playbooks",
  "Comunidade, encontros e oportunidades",
  "Laboratório de agentes e automações",
];

export default function Planos() {
  return (
    <main className="mh-plans">
      <header className="mh-public-nav">
        <MarcaHagios />
        <Link href="/entrar">Já sou membro</Link>
      </header>
      <section className="mh-plans__intro">
        <p className="mh-eyebrow">ESCOLHA COMO EVOLUIR</p>
        <h1>Um movimento para quem quer liderar na era da IA.</h1>
        <p>Os dois planos liberam a experiência completa da comunidade.</p>
      </section>
      <section className="mh-plans__grid" aria-label="Planos de assinatura">
        {(["mensal", "anual"] as const).map((slug) => {
          const plano = PLANOS[slug];
          const destaque = slug === "anual";
          return (
            <article className={destaque ? "mh-plan mh-plan--featured" : "mh-plan"} key={slug}>
              {destaque && <span className="mh-plan__tag">MELHOR ESCOLHA</span>}
              <p>{plano.nome}</p>
              <h2>{formatarPreco(plano.precoCentavos)}<small>{plano.periodo}</small></h2>
              {destaque ? (
                <span className="mh-plan__saving">Economize {formatarPreco(economiaDoAnual())} no ano</span>
              ) : <span className="mh-plan__saving">Flexibilidade para começar</span>}
              <ul>
                {beneficios.map((beneficio) => <li key={beneficio}><Check />{beneficio}</li>)}
              </ul>
              <Link className="mh-button mh-button--gold" href={`/cadastro?plano=${slug}`}>Quero fazer parte</Link>
            </article>
          );
        })}
      </section>
      <footer className="mh-plans__security"><ShieldCheck /> Pagamento processado com segurança pela Stripe.</footer>
    </main>
  );
}
