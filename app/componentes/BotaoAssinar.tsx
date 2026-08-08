"use client";

// CTA de assinatura com os três estados possíveis do visitante:
//
//   deslogado           -> /cadastro?plano=<slug>
//   logado sem acesso   -> POST /api/checkout e navegação para a Stripe
//   já assinante        -> /  (área de membros)
//
// Um quarto caminho existe por segurança: quem está em `past_due` não deve
// abrir um segundo checkout, e sim consertar o cartão no portal.

import Link from "next/link";

import { PLANOS } from "../lib/planos";
import type { PlanoSlug } from "../lib/tipos";
import { BotaoPortal } from "./BotaoPortal";
import type { EstadoConta } from "./useAssinatura";
import { useCheckout } from "./useCobranca";

type Props = {
  plano: PlanoSlug;
  estado: EstadoConta;
  rotulo?: string;
  className?: string;
};

export function BotaoAssinar({
  plano,
  estado,
  rotulo,
  className = "assin-botao assin-botao--principal",
}: Props) {
  const checkout = useCheckout();
  const texto = rotulo ?? `Assinar plano ${PLANOS[plano].nome.toLowerCase()}`;

  // 1. Ainda não sabemos quem é. Melhor esperar do que mandar para o lugar errado.
  if (estado.carregando) {
    return (
      <div className="assin-acao">
        <button type="button" className={className} disabled aria-busy="true">
          <span>Carregando…</span>
        </button>
        <p className="assin-erro" role="alert" aria-live="assertive" />
      </div>
    );
  }

  // 2. Pagamento recusado: o caminho é atualizar o cartão, não assinar de novo.
  //
  // Vem antes do teste de `temAcesso` de propósito: `past_due` tem acesso, e se
  // a ordem fosse a inversa este ramo nunca rodaria — quem está com a cobrança
  // falhando leria "sua assinatura já está ativa" e não teria como consertar.
  if (estado.autenticado && estado.assinatura.status === "past_due") {
    return (
      <BotaoPortal rotulo="Atualizar forma de pagamento" className={className} />
    );
  }

  // 3. Já é assinante — o lugar dele é a área de membros.
  if (estado.assinatura.temAcesso) {
    return (
      <div className="assin-acao">
        <Link className={className} href="/">
          <span>Ir para a área de membros</span>
        </Link>
        <p className="assin-nota">Sua assinatura já está ativa.</p>
      </div>
    );
  }

  // 4. Deslogado — cria a conta antes, levando o plano escolhido junto.
  if (!estado.autenticado) {
    return (
      <div className="assin-acao">
        <Link className={className} href={`/cadastro?plano=${plano}`}>
          <span>{texto}</span>
        </Link>
        <p className="assin-nota">Você cria a conta e segue direto para o pagamento.</p>
      </div>
    );
  }

  // 5. Logado e sem assinatura — checkout direto.
  const emAndamento =
    checkout.fase === "abrindo"
      ? "Abrindo pagamento seguro…"
      : checkout.fase === "voltando"
        ? "Levando para a área de membros…"
        : null;

  return (
    <div className="assin-acao">
      <button
        type="button"
        className={className}
        onClick={() => void checkout.assinar(plano)}
        disabled={checkout.ocupado}
        aria-busy={checkout.ocupado}
      >
        <span>{emAndamento ?? texto}</span>
      </button>
      <p className="assin-erro" role="alert" aria-live="assertive">
        {checkout.erro ?? ""}
      </p>
    </div>
  );
}
