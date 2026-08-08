"use client";

// Paywall da área de membros. É a última tela antes de a pessoa desistir, então
// ela vende: o que a comunidade entrega, quanto custa e um caminho único e
// claro para /planos. Nunca é um muro seco.

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  GraduationCap,
  MessageSquareText,
} from "lucide-react";

import { PLANOS, economiaDoAnual, formatarPreco } from "../lib/planos";
import type { EstadoConta } from "./useAssinatura";

const ENTREGAS = [
  {
    icone: GraduationCap,
    titulo: "Nove formações aplicadas",
    texto: "Cada módulo parte de um problema real e termina com uma automação pronta.",
  },
  {
    icone: Bot,
    titulo: "Agentes especialistas",
    texto: "Assistentes prontos para atendimento, prospecção, conteúdo e operação.",
  },
  {
    icone: MessageSquareText,
    titulo: "Comunidade ativa",
    texto: "Empresários e builders trocando o que está funcionando agora.",
  },
  {
    icone: CalendarDays,
    titulo: "Lives e novos conteúdos",
    texto: "Encontros ao vivo e material novo entrando todo mês.",
  },
];

function tituloEChamada(estado: EstadoConta): { titulo: string; texto: string } {
  if (!estado.autenticado) {
    return {
      titulo: "Conhecimento aplicado para liderar na nova economia.",
      texto:
        "Entre no Movimento Hágios para abrir as formações, a comunidade e os agentes especialistas.",
    };
  }
  switch (estado.assinatura.status) {
    case "canceled":
      return {
        titulo: "Sua assinatura foi encerrada.",
        texto:
          "Seu progresso continua guardado. Reative para voltar às formações, à comunidade e aos encontros.",
      };
    case "incomplete":
      return {
        titulo: "Seu pagamento ainda não foi concluído.",
        texto:
          "Finalize a assinatura para liberar as formações, a comunidade e os agentes especialistas.",
      };
    default:
      return {
        titulo: "Falta um passo para liberar seu acesso.",
        texto:
          "Sua conta já existe. Escolha um plano para abrir as formações, a comunidade e os agentes especialistas.",
      };
  }
}

export function Paywall({ estado }: { estado: EstadoConta }) {
  const { titulo, texto } = tituloEChamada(estado);
  const mensalNoAnual = formatarPreco(Math.round(PLANOS.anual.precoCentavos / 12));
  const economia = formatarPreco(economiaDoAnual());

  return (
    <section className="paywall" aria-labelledby="paywall-titulo">
      <div className="paywall-principal">
        <p className="kicker">ACESSO DE MEMBRO</p>
        <h2 id="paywall-titulo">{titulo}</h2>
        <p className="paywall-chamada">{texto}</p>

        <ul className="paywall-entregas">
          {ENTREGAS.map(({ icone: Icone, titulo: nome, texto: descricao }) => (
            <li key={nome}>
              <span className="paywall-entrega-icone" aria-hidden="true">
                <Icone size={18} />
              </span>
              <div>
                <strong>{nome}</strong>
                <p>{descricao}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="paywall-oferta">
        <p className="paywall-oferta-rotulo">A PARTIR DE</p>
        <p className="paywall-preco">
          <strong>{mensalNoAnual}</strong>
          <span>por mês, no plano anual</span>
        </p>
        <p className="paywall-economia">
          <Check size={15} aria-hidden="true" /> Economia de {economia} em doze meses
        </p>
        <p className="paywall-alternativa">
          Ou {formatarPreco(PLANOS.mensal.precoCentavos)} {PLANOS.mensal.periodo}, sem
          fidelidade.
        </p>

        <Link href="/planos" className="assin-botao assin-botao--principal">
          <span>Ver planos</span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>

        {!estado.autenticado && (
          <Link href="/entrar" className="assin-botao assin-botao--fantasma">
            <span>Já sou membro</span>
          </Link>
        )}

        <p className="paywall-nota">
          Pagamento processado pela Stripe. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
}
