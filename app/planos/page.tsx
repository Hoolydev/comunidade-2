"use client";

// T-B4 · /planos — comparativo mensal × anual.
//
// Nenhum preço é escrito no JSX: tudo sai de app/lib/planos.ts (PLANOS,
// formatarPreco, economiaDoAnual). Se o valor mudar lá, muda aqui sozinho.

import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

import { BotaoAssinar } from "../componentes/BotaoAssinar";
import { AvisoCancelamentoAgendado } from "../componentes/AvisosAssinatura";
import { useAssinatura } from "../componentes/useAssinatura";
import { PLANOS, economiaDoAnual, formatarPreco } from "../lib/planos";
import "../estilos/assinatura.css";
import "../estilos/planos.css";

const INCLUSOES = [
  "Nove formações aplicadas, do problema à automação pronta",
  "Comunidade e networking com empresários e builders",
  "Lives, encontros e conteúdos novos todo mês",
  "Agentes especialistas prontos para usar",
  "Novos módulos incluídos enquanto a assinatura estiver ativa",
];

function CelulaSim() {
  return (
    <span className="planos-sim">
      <Check size={16} aria-hidden="true" />
      <span className="visualmente-oculto">Incluído</span>
    </span>
  );
}

export default function PaginaDePlanos() {
  const estado = useAssinatura();

  const totalDoMensalEmUmAno = PLANOS.mensal.precoCentavos * 12;
  const economia = economiaDoAnual();
  const percentual = Math.round((economia / totalDoMensalEmUmAno) * 100);
  const mensalidadeEquivalente = Math.round(PLANOS.anual.precoCentavos / 12);

  return (
    <main className="planos-page">
      <header className="planos-topo">
        <Link href="/vendas" className="planos-marca">
          <img src="/logo-hagios.png" alt="" />
          <span>
            <small>MOVIMENTO</small>
            <strong>HÁGIOS</strong>
          </span>
        </Link>
        <Link href="/" className="planos-voltar">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Área de membros</span>
        </Link>
      </header>

      <section className="planos-intro">
        <p className="kicker">PLANOS</p>
        <h1>Escolha como quer entrar no Movimento.</h1>
        <p className="planos-chamada">
          Os dois planos abrem exatamente o mesmo conteúdo. A diferença está em
          quanto você paga por mês e de quanto em quanto tempo a cobrança acontece.
        </p>
      </section>

      {estado.assinatura.temAcesso && (
        <p className="planos-estado" role="status">
          Sua assinatura já está ativa
          {estado.assinatura.plano ? ` no plano ${PLANOS[estado.assinatura.plano].nome.toLowerCase()}` : ""}.{" "}
          <Link href="/">Ir para a área de membros</Link>
        </p>
      )}

      {estado.assinatura.status === "past_due" && (
        <p className="planos-estado planos-estado--alerta" role="status">
          O último pagamento não foi aprovado. Atualize a forma de pagamento em vez
          de assinar de novo.
        </p>
      )}

      <AvisoCancelamentoAgendado estado={estado} />

      <div className="planos-cartoes">
        <article className="planos-cartao">
          <h2>{PLANOS.mensal.nome}</h2>
          <p className="planos-cartao-descricao">
            Para entrar sem compromisso de prazo.
          </p>
          <p className="planos-preco">
            <strong>{formatarPreco(PLANOS.mensal.precoCentavos)}</strong>
            <span>{PLANOS.mensal.periodo}</span>
          </p>
          <p className="planos-preco-apoio">
            {formatarPreco(totalDoMensalEmUmAno)} em doze meses.
          </p>
          <BotaoAssinar
            plano="mensal"
            estado={estado}
            className="assin-botao assin-botao--secundario"
          />
        </article>

        <article className="planos-cartao planos-cartao--destaque">
          <p className="planos-selo">
            Economize {formatarPreco(economia)} por ano ({percentual}%)
          </p>
          <h2>{PLANOS.anual.nome}</h2>
          <p className="planos-cartao-descricao">
            Para quem já decidiu que vai aplicar durante o ano inteiro.
          </p>
          <p className="planos-preco">
            <strong>{formatarPreco(PLANOS.anual.precoCentavos)}</strong>
            <span>{PLANOS.anual.periodo}</span>
          </p>
          <p className="planos-preco-apoio">
            Equivale a {formatarPreco(mensalidadeEquivalente)} por mês, contra{" "}
            {formatarPreco(PLANOS.mensal.precoCentavos)} no mensal.
          </p>
          <BotaoAssinar
            plano="anual"
            estado={estado}
            className="assin-botao assin-botao--principal"
          />
        </article>
      </div>

      <section className="planos-comparativo" aria-labelledby="planos-comparativo-titulo">
        <h2 id="planos-comparativo-titulo">Mensal × anual, lado a lado</h2>
        <div className="planos-tabela-caixa">
          <table className="planos-tabela">
            <caption className="visualmente-oculto">
              Comparativo entre o plano mensal e o plano anual
            </caption>
            <thead>
              <tr>
                <th scope="col">O que comparar</th>
                <th scope="col">{PLANOS.mensal.nome}</th>
                <th scope="col">{PLANOS.anual.nome}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Valor de cada cobrança</th>
                <td>
                  {formatarPreco(PLANOS.mensal.precoCentavos)} {PLANOS.mensal.periodo}
                </td>
                <td>
                  {formatarPreco(PLANOS.anual.precoCentavos)} {PLANOS.anual.periodo}
                </td>
              </tr>
              <tr>
                <th scope="row">Quando é cobrado</th>
                <td>Todo mês</td>
                <td>Uma vez por ano</td>
              </tr>
              <tr>
                <th scope="row">Custo por mês</th>
                <td>{formatarPreco(PLANOS.mensal.precoCentavos)}</td>
                <td className="planos-destaque">{formatarPreco(mensalidadeEquivalente)}</td>
              </tr>
              <tr>
                <th scope="row">Total em doze meses</th>
                <td>{formatarPreco(totalDoMensalEmUmAno)}</td>
                <td className="planos-destaque">{formatarPreco(PLANOS.anual.precoCentavos)}</td>
              </tr>
              <tr>
                <th scope="row">Economia em doze meses</th>
                <td>
                  <span aria-hidden="true">—</span>
                  <span className="visualmente-oculto">Nenhuma</span>
                </td>
                <td className="planos-destaque">{formatarPreco(economia)}</td>
              </tr>
              {INCLUSOES.map((item) => (
                <tr key={item}>
                  <th scope="row">{item}</th>
                  <td>
                    <CelulaSim />
                  </td>
                  <td>
                    <CelulaSim />
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row">Cancelar quando quiser</th>
                <td>
                  <CelulaSim />
                </td>
                <td>
                  <CelulaSim />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="planos-seguranca">
        <span className="planos-seguranca-icone" aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <div>
          <strong>Pagamento processado pela Stripe.</strong>
          <p>
            Nenhum dado de cartão passa pelo nosso site. Você gerencia cobrança,
            cartão e cancelamento a qualquer momento pelo portal da Stripe.
          </p>
        </div>
      </section>

      <footer className="planos-rodape">
        <span>© 2026 Movimento Hágios</span>
        <Link href="/vendas">Conhecer a formação</Link>
      </footer>
    </main>
  );
}
