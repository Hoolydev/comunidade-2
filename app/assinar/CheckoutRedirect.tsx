"use client";

// Ponte entre a escolha do plano e o checkout hospedado da Stripe.
// Dispara POST /api/checkout uma única vez e navega para fora.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import { BotaoPortal } from "../componentes/BotaoPortal";
import { useAssinatura } from "../componentes/useAssinatura";
import { caminhoDeEntrada, useCheckout } from "../componentes/useCobranca";
import { PLANOS } from "../lib/planos";
import type { PlanoSlug } from "../lib/tipos";

export function CheckoutRedirect({ plano }: { plano: PlanoSlug }) {
  const router = useRouter();
  const estado = useAssinatura();
  const checkout = useCheckout();
  const disparado = useRef(false);

  const { carregando, autenticado } = estado;
  const { temAcesso, status } = estado.assinatura;
  const { assinar } = checkout;

  useEffect(() => {
    if (carregando) return;

    // Sem sessão: manda para o login preservando o plano.
    if (!autenticado) {
      router.replace(caminhoDeEntrada(plano));
      return;
    }

    // Já é assinante: nem tenta o checkout, o servidor responderia 409.
    if (temAcesso) {
      router.replace("/");
      return;
    }

    // Pagamento recusado pede portal, não uma segunda assinatura.
    if (status === "past_due") return;

    if (disparado.current) return;
    disparado.current = true;
    void assinar(plano);
  }, [carregando, autenticado, temAcesso, status, plano, router, assinar]);

  const tentarDeNovo = () => {
    disparado.current = true;
    void assinar(plano);
  };

  const cabecalho = (
    <img src="/logo-hagios.png" alt="Movimento Hágios" />
  );

  if (carregando) {
    return (
      <main className="confirma">
        <div className="confirma-caixa">
          {cabecalho}
          <span className="confirma-sinal" aria-hidden="true" />
          <div aria-live="polite">
            <h1>Validando seu acesso…</h1>
          </div>
        </div>
      </main>
    );
  }

  if (autenticado && temAcesso) {
    return (
      <main className="confirma">
        <div className="confirma-caixa">
          {cabecalho}
          <div aria-live="polite">
            <p className="confirma-etapa">ASSINATURA ATIVA</p>
            <h1>Sua assinatura já está ativa.</h1>
            <p className="confirma-texto">Levando você para a área de membros…</p>
          </div>
          <div className="confirma-acoes">
            <Link href="/" className="assin-botao assin-botao--principal">
              <span>Ir para a área de membros</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (autenticado && status === "past_due") {
    return (
      <main className="confirma">
        <div className="confirma-caixa">
          {cabecalho}
          <span className="confirma-sinal confirma-sinal--parado" aria-hidden="true">
            <AlertTriangle size={22} />
          </span>
          <div aria-live="polite">
            <p className="confirma-etapa">PAGAMENTO PENDENTE</p>
            <h1>Sua assinatura está com um pagamento em aberto.</h1>
            <p className="confirma-texto">
              Atualize a forma de pagamento em vez de assinar de novo. Assim você
              não fica com duas cobranças.
            </p>
          </div>
          <div className="confirma-acoes">
            <BotaoPortal
              rotulo="Atualizar forma de pagamento"
              className="assin-botao assin-botao--principal"
            />
            <Link href="/planos" className="assin-botao assin-botao--fantasma">
              <span>Ver planos</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (checkout.erro) {
    return (
      <main className="confirma">
        <div className="confirma-caixa">
          {cabecalho}
          <div aria-live="assertive" role="alert">
            <h1>Não foi possível abrir o pagamento.</h1>
            <p className="confirma-texto">{checkout.erro}</p>
          </div>
          <div className="confirma-acoes">
            <button
              type="button"
              className="assin-botao assin-botao--principal"
              onClick={tentarDeNovo}
              disabled={checkout.ocupado}
              aria-busy={checkout.ocupado}
            >
              <span>{checkout.ocupado ? "Abrindo pagamento seguro…" : "Tentar de novo"}</span>
            </button>
            <Link href="/planos" className="assin-botao assin-botao--secundario">
              <span>Ver planos</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="confirma">
      <div className="confirma-caixa">
        {cabecalho}
        <span className="confirma-sinal" aria-hidden="true" />
        <div aria-live="polite">
          <p className="confirma-etapa">PLANO {PLANOS[plano].nome.toUpperCase()}</p>
          <h1>Abrindo pagamento seguro…</h1>
          <p className="confirma-texto">
            Você está sendo levado para o ambiente da Stripe. Não feche esta
            página.
          </p>
        </div>
        <p className="confirma-rodape">
          Nenhum dado de cartão passa pelo nosso site.
        </p>
      </div>
    </main>
  );
}
