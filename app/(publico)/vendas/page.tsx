/* eslint-disable @next/next/no-img-element -- O otimizador de imagens do Vinext exige ASSETS e falha no preview local. */

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { MarcaHagios } from "../../componentes/MarcaHagios";
import { formacoes } from "../../dados-comunidade";
import {
  economiaAnualPublicaCentavos,
  equivalenteMensalDoAnualCentavos,
  PRECO_ANUAL_PUBLICO_CENTAVOS,
} from "../../lib/oferta-publica";
import { formatarPreco, PLANOS } from "../../lib/planos";

const entregas = [
  {
    titulo: "Trilhas práticas",
    texto: "Identifique onde a IA pode melhorar sua empresa e siga uma ordem clara de implantação.",
  },
  {
    titulo: "Aulas e materiais aplicáveis",
    texto: "Conteúdos, modelos e orientações que você pode levar diretamente para a sua rotina.",
  },
  {
    titulo: "Novos conteúdos toda semana",
    texto: "Aplicações e estratégias para manter sua empresa atualizada sem acompanhar tudo sozinho.",
  },
  {
    titulo: "Mentoria mensal ao vivo",
    texto: "Aprofunde os temas mais importantes e esclareça dúvidas sobre a aplicação no seu negócio.",
  },
  {
    titulo: "Desafios de implementação",
    texto: "Ações guiadas para transformar o que você aprendeu em melhorias realmente funcionando.",
  },
  {
    titulo: "Grupo no WhatsApp",
    texto: "Troca entre empresários, materiais, direcionamentos e contato contínuo com a Comunidade.",
  },
];

const transformacoes = [
  "Responder e acompanhar clientes com mais agilidade",
  "Organizar tarefas e informações que hoje estão espalhadas",
  "Produzir conteúdos com mais estratégia e consistência",
  "Automatizar atividades repetitivas",
  "Melhorar processos de vendas, atendimento ou gestão",
];

export default function Vendas() {
  const capas = [...formacoes, ...formacoes];
  const economiaAnual = economiaAnualPublicaCentavos();
  const equivalenteMensal = equivalenteMensalDoAnualCentavos();

  return (
    <main className="mh-sales">
      <header className="mh-public-nav">
        <MarcaHagios />
        <nav aria-label="Navegação da página">
          <a href="#como-funciona">Como funciona</a>
          <a href="#comunidade">A comunidade</a>
          <a href="#formacoes">Formações</a>
        </nav>
        <div>
          <Link href="/entrar">Entrar</Link>
          <a className="mh-button mh-button--gold" href="#planos">Quero participar</a>
        </div>
      </header>

      <section className="mh-sales__hero">
        <div className="mh-sales__hero-copy">
          <p className="mh-eyebrow">IA APLICADA À REALIDADE DA SUA EMPRESA</p>
          <h1>Sua empresa não precisa crescer no braço.</h1>
          <p>
            A comunidade que prepara empresários para usar a inteligência artificial, otimizar
            processos, reduzir o peso da operação e criar espaço para a empresa crescer.
          </p>
          <div className="mh-sales__actions">
            <a className="mh-button mh-button--gold" href="#planos">
              Quero participar <ArrowRight />
            </a>
            <a className="mh-sales__text-link" href="#como-funciona">Entender como funciona</a>
          </div>
          <div className="mh-sales__trust" aria-label="Benefícios principais">
            <span><Check /> Aplicação prática</span>
            <span><Check /> Direção para implementar</span>
            <span><Check /> Sem precisar ser especialista</span>
          </div>
          <a className="mh-sales__annual-callout" href="#planos">
            <span>PLANO ANUAL</span>
            <strong>Economize {formatarPreco(economiaAnual)}</strong>
            <small>{formatarPreco(PRECO_ANUAL_PUBLICO_CENTAVOS)}/ano · equivalente a {formatarPreco(equivalenteMensal)}/mês</small>
          </a>
        </div>

        <div className="mh-sales__mockup">
          <div className="mh-sales__mockup-glow" aria-hidden="true" />
          <img
            src="/mockup-comunidade-hagios.png"
            alt="Plataforma da Comunidade Hágios exibida em notebook e celular"
            width="1920"
            height="1080"
          />
        </div>
      </section>

      <section className="mh-sales__reality" id="como-funciona">
        <div className="mh-sales__reality-number" aria-hidden="true">01</div>
        <div>
          <p className="mh-eyebrow">O CENÁRIO ATUAL</p>
          <h2>Sua empresa não está parada. Mas talvez ainda esteja avançando no esforço, e não na estrutura.</h2>
        </div>
        <div className="mh-sales__reality-copy">
          <p>
            Cada tarefa que só acontece quando você cobra, cada resposta que depende de alguém
            parar o que está fazendo e cada processo que existe apenas “na cabeça” custa tempo,
            velocidade e oportunidades.
          </p>
          <strong>Você não precisa sustentar o crescimento no braço. Precisa fazer a empresa funcionar melhor.</strong>
        </div>
      </section>

      <section className="mh-sales__belief">
        <div className="mh-section-title">
          <p className="mh-eyebrow">NO QUE A HÁGIOS ACREDITA</p>
          <h2>Você não precisa aprender tudo sobre IA. Precisa saber o que faz sentido para a sua empresa.</h2>
        </div>
        <div className="mh-sales__belief-grid">
          <article>
            <span>01</span>
            <h3>Primeiro, o problema certo.</h3>
            <p>Uma ferramenta nova não resolve um processo confuso. Automatizar sem direção só faz o erro acontecer mais rápido.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Depois, uma aplicação possível.</h3>
            <p>Você escolhe o que precisa melhorar e leva o conhecimento para a operação, sem transformar tecnologia em mais uma função na rotina.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Por fim, resultado observável.</h3>
            <p>A IA deixa de ser tendência quando começa a reduzir esforço, organizar a empresa e abrir espaço para crescer.</p>
          </article>
        </div>
      </section>

      <section className="mh-sales__promise" id="comunidade">
        <div className="mh-sales__promise-copy">
          <p className="mh-eyebrow">A COMUNIDADE HÁGIOS</p>
          <h2>Do “eu preciso atualizar minha empresa” para um plano que sai do papel.</h2>
          <p>
            Você encontra direção, conhecimento prático e acompanhamento para identificar o que
            precisa mudar e colocar a inteligência artificial para funcionar no seu negócio.
          </p>
          <p>
            Você não entra apenas para consumir conteúdo. Entra para começar a construir uma empresa
            mais eficiente, atualizada e preparada para crescer.
          </p>
          <a className="mh-button mh-button--gold" href="#planos">Quero participar <ArrowRight /></a>
        </div>
        <div className="mh-sales__ninety">
          <span>EM ATÉ</span>
          <strong>90</strong>
          <em>dias</em>
          <p>Implemente <b>três operações com IA</b>, escolhidas a partir das prioridades reais da sua empresa.</p>
        </div>
      </section>

      <section className="mh-sales__inside">
        <div className="mh-section-title">
          <p className="mh-eyebrow">O QUE VOCÊ ENCONTRA</p>
          <h2>Tudo organizado para você escolher, aplicar e avançar.</h2>
        </div>
        <div className="mh-sales__inside-grid">
          {entregas.map((entrega, indice) => (
            <article key={entrega.titulo}>
              <span>{String(indice + 1).padStart(2, "0")}</span>
              <h3>{entrega.titulo}</h3>
              <p>{entrega.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mh-sales__tracks" id="formacoes">
        <div className="mh-section-title">
          <p className="mh-eyebrow">CONHECIMENTO APLICADO</p>
          <h2>Formações construídas a partir de problemas reais da operação.</h2>
        </div>
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

      <section className="mh-sales__outcomes">
        <div className="mh-section-title">
          <p className="mh-eyebrow">O QUE PODE MUDAR NA SUA EMPRESA</p>
          <h2>Em 90 dias, a IA pode deixar de ser assunto e começar a funcionar na operação.</h2>
        </div>
        <div className="mh-sales__outcomes-list">
          {transformacoes.map((transformacao, indice) => (
            <article key={transformacao}>
              <span>{String(indice + 1).padStart(2, "0")}</span>
              <p>{transformacao}</p>
              <Check aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      <section className="mh-sales__pricing" id="planos">
        <div className="mh-section-title">
          <p className="mh-eyebrow">ESCOLHA COMO PARTICIPAR</p>
          <h2>Acesso completo à comunidade, todos os dias do ano.</h2>
          <p>Os dois planos liberam as mesmas formações, encontros, materiais e atualizações.</p>
        </div>
        <div className="mh-sales__pricing-grid">
          <article className="mh-sales__price-card">
            <p>Plano mensal</p>
            <h3>{formatarPreco(PLANOS.mensal.precoCentavos)}<small>/mês</small></h3>
            <span>Flexibilidade para começar</span>
            <ul>
              <li><Check /> Acesso completo à plataforma</li>
              <li><Check /> Formações e atualizações semanais</li>
              <li><Check /> Comunidade e encontros ao vivo</li>
            </ul>
            <Link className="mh-button mh-button--ghost" href="/cadastro?plano=mensal">
              Começar no mensal <ArrowRight />
            </Link>
          </article>

          <article className="mh-sales__price-card mh-sales__price-card--featured">
            <span className="mh-sales__price-tag">MAIS VANTAJOSO</span>
            <p>Plano anual</p>
            <h3>{formatarPreco(PRECO_ANUAL_PUBLICO_CENTAVOS)}<small>/ano</small></h3>
            <strong>Economize {formatarPreco(economiaAnual)} — quase 2 mensalidades de desconto</strong>
            <small className="mh-sales__price-equivalent">
              Equivale a {formatarPreco(equivalenteMensal)} por mês
            </small>
            <ul>
              <li><Check /> Acesso completo à plataforma</li>
              <li><Check /> Formações e atualizações semanais</li>
              <li><Check /> Comunidade e encontros ao vivo</li>
            </ul>
            <Link className="mh-button mh-button--gold" href="/cadastro?plano=anual">
              Garantir o desconto anual <ArrowRight />
            </Link>
          </article>
        </div>
        <p className="mh-sales__pricing-security">Pagamento recorrente e seguro processado pela Stripe.</p>
      </section>

      <section className="mh-sales__cta">
        <img src="/logo-hagios.png" alt="" width="78" height="78" />
        <p className="mh-eyebrow">O CONVITE PARA COMEÇAR</p>
        <h2>Se continuar do mesmo jeito limita o crescimento, não faz sentido adiar a mudança.</h2>
        <p>
          Entre para a Comunidade Hágios e comece a construir uma empresa que funciona melhor,
          com a inteligência artificial aplicada às prioridades do seu negócio.
        </p>
        <Link className="mh-button mh-button--gold" href="/cadastro?plano=anual">
          Quero o plano anual com desconto <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
