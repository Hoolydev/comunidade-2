"use client";

// Avisos que aparecem dentro da área de membros. Nenhum deles bloqueia a tela:
// os dois estados aqui são de gente que ainda tem acesso.

import { AlertTriangle, CalendarClock } from "lucide-react";

import { BotaoPortal } from "./BotaoPortal";
import { formatarDataLonga } from "./assinaturaApi";
import type { EstadoConta } from "./useAssinatura";

/**
 * Pagamento recusado. Pelo contrato o acesso segue até `canceled`, então o tom
 * é de aviso — o usuário precisa consertar o cartão, não perder a tela.
 */
export function AvisoPagamentoPendente({ estado }: { estado: EstadoConta }) {
  if (estado.assinatura.status !== "past_due") return null;

  return (
    <section className="assin-banner assin-banner--alerta" role="status">
      <span className="assin-banner-icone" aria-hidden="true">
        <AlertTriangle size={20} />
      </span>
      <div className="assin-banner-texto">
        <strong>Não conseguimos processar o seu último pagamento.</strong>
        <p>
          Seu acesso continua liberado. Atualize a forma de pagamento para manter
          a assinatura em dia.
        </p>
      </div>
      <BotaoPortal
        rotulo="Atualizar forma de pagamento"
        className="assin-botao assin-botao--principal"
      />
    </section>
  );
}

/**
 * Cancelamento já agendado: o acesso termina no fim do período pago. A data
 * precisa aparecer, senão o aviso não informa nada.
 */
export function AvisoCancelamentoAgendado({ estado }: { estado: EstadoConta }) {
  const { cancelaNoFimDoPeriodo, periodoFimEm, status } = estado.assinatura;
  if (!cancelaNoFimDoPeriodo) return null;
  if (status === "canceled" || status === "nenhuma") return null;

  const data = formatarDataLonga(periodoFimEm);

  return (
    <section className="assin-banner assin-banner--aviso" role="status">
      <span className="assin-banner-icone" aria-hidden="true">
        <CalendarClock size={20} />
      </span>
      <div className="assin-banner-texto">
        <strong>
          {data
            ? `Seu acesso vai até ${data}.`
            : "Seu acesso vai até o fim do período já pago."}
        </strong>
        <p>
          O cancelamento está agendado e nenhuma nova cobrança será feita. Até lá
          tudo continua liberado, e você pode voltar atrás quando quiser.
        </p>
      </div>
      <BotaoPortal
        rotulo="Retomar assinatura"
        className="assin-botao assin-botao--secundario"
      />
    </section>
  );
}
