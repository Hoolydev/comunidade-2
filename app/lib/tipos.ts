// CONTRATO CONGELADO — não altere sem sync point (ver CLAUDE.md §Contrato).
//
// Este arquivo é a única fonte de verdade dos formatos trocados entre o
// servidor (rotas em app/api) e o cliente (páginas em app/). As duas trilhas
// programam contra ele em paralelo.

// ---------------------------------------------------------------------------
// Planos
// ---------------------------------------------------------------------------

export type PlanoSlug = "mensal" | "anual";

// ---------------------------------------------------------------------------
// Assinatura
// ---------------------------------------------------------------------------

// Espelha os status da Stripe que nos interessam. "nenhuma" é o estado local de
// quem nunca assinou — a Stripe não tem equivalente.
export type StatusAssinatura =
  | "nenhuma"
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type Assinatura = {
  status: StatusAssinatura;
  plano: PlanoSlug | null;
  stripeSubscriptionId: string | null;
  /** Epoch em milissegundos. Fim do período pago vigente. */
  periodoFimEm: number | null;
  cancelaNoFimDoPeriodo: boolean;
  /** Epoch em milissegundos da última escrita. */
  atualizadoEm: number;
  /**
   * `event.created` (epoch em segundos) do evento da Stripe que produziu este
   * estado. Usado para descartar eventos que chegam fora de ordem.
   */
  eventoEm: number | null;
};

export const ASSINATURA_VAZIA: Assinatura = {
  status: "nenhuma",
  plano: null,
  stripeSubscriptionId: null,
  periodoFimEm: null,
  cancelaNoFimDoPeriodo: false,
  atualizadoEm: 0,
  eventoEm: null,
};

/**
 * Regra de acesso. Definição única — não reimplemente esta comparação em
 * nenhum outro arquivo.
 *
 * `past_due` entra na lista de propósito. Ele só acontece quando uma cobrança
 * de *renovação* falha, e a Stripe fica tentando de novo por cerca de duas
 * semanas antes de desistir. Quem está em `past_due` já pagou pelo menos uma
 * vez: uma primeira cobrança que falha deixa a assinatura em `incomplete`, não
 * em `past_due`. Cortar o acesso no primeiro cartão recusado é tirar o produto
 * de um cliente pagante por causa de um cartão vencido.
 *
 * O acesso cai em `canceled`, que é quando a Stripe desiste de cobrar.
 * Enquanto isso, a interface mostra um aviso com link para o portal.
 */
export function temAcesso(status: StatusAssinatura): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

export type SessaoAutenticada = {
  estado: "autenticado";
  uid: string;
  email: string | null;
  nome: string | null;
  fotoUrl: string | null;
  stripeCustomerId: string | null;
  assinatura: Assinatura;
};

export type Sessao =
  /** Faltam variáveis de ambiente do Clerk. Trate como erro de operação, não do usuário. */
  | { estado: "nao_configurado" }
  | { estado: "anonimo" }
  | SessaoAutenticada;

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------

// Strings estáveis. O servidor nunca devolve texto voltado ao usuário — o
// cliente mapeia código → mensagem em app/lib/erros-auth.ts.
export type CodigoErro =
  | "nao_autenticado"
  | "plano_invalido"
  | "ja_assinante"
  | "sem_cliente_stripe"
  | "nao_configurado"
  | "erro_interno";

export type RespostaErro = { erro: CodigoErro };

// ---------------------------------------------------------------------------
// Rotas
// ---------------------------------------------------------------------------

/** POST /api/checkout */
export type CheckoutPedido = { plano: PlanoSlug };
export type CheckoutResposta = { url: string };

/** POST /api/portal */
export type PortalResposta = { url: string };

/**
 * GET /api/assinatura
 *
 * Substitui o listener em tempo real do Firestore previsto no PRD: o Firestore
 * expõe `onSnapshot` ao cliente, o Clerk não. A página de processamento faz
 * polling desta rota. Sempre 200 — visitante anônimo recebe o estado vazio.
 */
export type AssinaturaResposta = {
  autenticado: boolean;
  status: StatusAssinatura;
  plano: PlanoSlug | null;
  temAcesso: boolean;
  periodoFimEm: number | null;
  cancelaNoFimDoPeriodo: boolean;
};

/** POST /api/stripe/webhook */
export type WebhookResposta = { recebido: true; duplicado?: boolean };
