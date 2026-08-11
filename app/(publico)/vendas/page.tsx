/* eslint-disable @next/next/no-img-element -- O otimizador de imagens do Vinext exige ASSETS e falha no preview local. */

import { ArrowRight, Check, CirclePlay } from "lucide-react";
import Link from "next/link";

import { MarcaHagios } from "../../componentes/MarcaHagios";
import { formacoes } from "../../dados-comunidade";

const publicos = [
  ["Empresários", "Aumente faturamento e margem colocando sua empresa na vanguarda da inteligência artificial."],
  ["Profissionais", "Escale sua carreira criando tecnologia e soluções dentro das empresas."],
  ["Gestores de IA", "Preste serviços com agentes, automações e produtos inteligentes."],
  ["Builders", "Tire uma ideia do papel e construa aplicativos, SaaS ou Micro-SaaS sem precisar aprender a programar."],
];

export default function Vendas() {
  const capas = [...formacoes, ...formacoes];
  return (
    <main className="mh-sales">
      <header className="mh-public-nav">
        <MarcaHagios />
        <nav><a href="#formacoes">Formações</a><a href="#para-quem">Para quem</a></nav>
        <div><Link href="/entrar">Entrar</Link><Link className="mh-button mh-button--gold" href="/planos">Conhecer planos</Link></div>
      </header>

      <section className="mh-sales__hero">
        <div>
          <p className="mh-eyebrow">INTELIGÊNCIA APLICADA. NEGÓCIOS EM MOVIMENTO.</p>
          <h1>Prosperar na era da IA exige mais que acompanhar.</h1>
          <p>Exige construir. O Movimento Hágios reúne formação, comunidade e ferramentas para transformar IA em vantagem competitiva real.</p>
          <div className="mh-sales__actions">
            <Link className="mh-button mh-button--gold" href="/planos">Entrar no Movimento <ArrowRight /></Link>
            <a className="mh-button mh-button--ghost" href="#formacoes"><CirclePlay /> Ver formações</a>
          </div>
          <div className="mh-sales__trust"><span><Check /> Aplicação prática</span><span><Check /> Sem precisar programar</span><span><Check /> Evolução contínua</span></div>
        </div>
        <div className="mh-sales__hero-art" aria-label="Formações do Movimento Hágios">
          <img src={formacoes[0].cover} alt="" width="640" height="360" />
          <img src={formacoes[3].cover} alt="" width="640" height="360" />
          <img src={formacoes[6].cover} alt="" width="640" height="360" />
          <span>09<small>formações iniciais</small></span>
        </div>
      </section>

      <section className="mh-sales__tracks" id="formacoes">
        <div className="mh-section-title"><p className="mh-eyebrow">FORMAÇÕES EM PRIMEIRO PLANO</p><h2>Aprenda construindo soluções para problemas reais.</h2></div>
        <div className="mh-track-marquee">
          <div>
            {capas.map((formacao, indice) => (
              <article key={`${formacao.slug}-${indice}`} aria-hidden={indice >= formacoes.length || undefined}>
                <img src={formacao.cover} alt="" width="640" height="360" loading="lazy" />
                <span>{formacao.category}</span>
                <h3>{formacao.title}</h3>
                <p>{formacao.outcome}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mh-sales__audience" id="para-quem">
        <div className="mh-section-title"><p className="mh-eyebrow">FEITO PARA QUEM DECIDIU AVANÇAR</p><h2>Conhecimento que vira capacidade de execução.</h2></div>
        <div className="mh-sales__audience-list">
          {publicos.map(([titulo, texto], indice) => <article key={titulo}><span>0{indice + 1}</span><div><h3>{titulo}</h3><p>{texto}</p></div></article>)}
        </div>
      </section>

      <section className="mh-sales__cta">
        <img src="/logo-hagios.png" alt="" width="78" height="78" />
        <p className="mh-eyebrow">MOVIMENTO HÁGIOS</p>
        <h2>A próxima fronteira não espera.</h2>
        <p>Entre para uma comunidade que transforma inteligência artificial em crescimento, carreira e produtos.</p>
        <Link className="mh-button mh-button--gold" href="/planos">Escolher meu plano <ArrowRight /></Link>
      </section>
    </main>
  );
}
