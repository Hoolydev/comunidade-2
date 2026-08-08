// CONTRATO CONGELADO — ver CLAUDE.md.
//
// Camada de sessão. Onde o PRD original falava em session cookie do Firebase
// Admin, aqui usamos o cookie de sessão do Clerk, que já é httpOnly e já é
// validado no servidor. Por isso não existe rota POST /api/auth/session: o
// Clerk cria e renova o cookie sozinho, e o servidor consegue identificar o
// usuário em Server Components e em Route Handlers sem chamada extra.
//
// O estado da assinatura vive no metadata do usuário no Clerk:
//   publicMetadata.assinatura   -> objeto Assinatura (legível pelo cliente)
//   privateMetadata.stripeCustomerId -> id do cliente na Stripe (só servidor)
//
// publicMetadata cumpre o papel das custom claims do PRD: escrito apenas pelo
// webhook, lido pelo cliente e pelo servidor.

import { cache } from "react";
import { headers } from "next/headers";
import { createClerkClient, type ClerkClient, type User } from "@clerk/backend";

import {
  ASSINATURA_VAZIA,
  type Assinatura,
  type PlanoSlug,
  type Sessao,
  type StatusAssinatura,
} from "./tipos";

const STATUS_VALIDOS: StatusAssinatura[] = [
  "nenhuma",
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
];

let clienteMemorizado: { chave: string; cliente: ClerkClient } | null = null;

/**
 * Cliente do Clerk. Memorizado pela chave secreta porque em ambiente de
 * desenvolvimento o processo é reaproveitado entre requisições e recriar o
 * cliente a cada chamada desperdiça handshake.
 *
 * Devolve null quando o ambiente não está configurado — quem chama decide o que
 * fazer, ninguém lança daqui.
 */
export function obterClerk(): ClerkClient | null {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  if (clienteMemorizado?.chave === secretKey) return clienteMemorizado.cliente;

  const cliente = createClerkClient({
    secretKey,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
  clienteMemorizado = { chave: secretKey, cliente };
  return cliente;
}

/**
 * Lê o objeto Assinatura do metadata do usuário, tolerando dados antigos.
 *
 * Antes deste PRD o webhook gravava apenas `publicMetadata.membership =
 * "active" | "inactive"`. Usuários criados naquele formato continuam existindo,
 * então a leitura converte o formato antigo em vez de tratá-lo como ausência de
 * assinatura — o contrário revogaria o acesso de quem já pagou.
 */
export function lerAssinatura(metadata: Record<string, unknown> | undefined): Assinatura {
  const bruto = metadata?.assinatura;

  if (bruto && typeof bruto === "object") {
    const objeto = bruto as Record<string, unknown>;
    const status = objeto.status;
    const plano = objeto.plano;
    return {
      status: STATUS_VALIDOS.includes(status as StatusAssinatura)
        ? (status as StatusAssinatura)
        : "nenhuma",
      plano: plano === "mensal" || plano === "anual" ? (plano as PlanoSlug) : null,
      stripeSubscriptionId:
        typeof objeto.stripeSubscriptionId === "string" ? objeto.stripeSubscriptionId : null,
      periodoFimEm: typeof objeto.periodoFimEm === "number" ? objeto.periodoFimEm : null,
      cancelaNoFimDoPeriodo: objeto.cancelaNoFimDoPeriodo === true,
      atualizadoEm: typeof objeto.atualizadoEm === "number" ? objeto.atualizadoEm : 0,
      eventoEm: typeof objeto.eventoEm === "number" ? objeto.eventoEm : null,
    };
  }

  // Formato legado.
  if (metadata?.membership === "active") {
    return {
      ...ASSINATURA_VAZIA,
      status: "active",
      stripeSubscriptionId:
        typeof metadata.stripeSubscriptionId === "string" ? metadata.stripeSubscriptionId : null,
    };
  }

  return ASSINATURA_VAZIA;
}

function montarSessao(usuario: User): Sessao {
  const publico = usuario.publicMetadata as Record<string, unknown> | undefined;
  const privado = usuario.privateMetadata as Record<string, unknown> | undefined;

  const customerId =
    (typeof privado?.stripeCustomerId === "string" ? privado.stripeCustomerId : null) ??
    // O formato legado gravava o customer em publicMetadata.
    (typeof publico?.stripeCustomerId === "string" ? publico.stripeCustomerId : null);

  const nome = [usuario.firstName, usuario.lastName].filter(Boolean).join(" ").trim();

  return {
    estado: "autenticado",
    uid: usuario.id,
    email: usuario.primaryEmailAddress?.emailAddress ?? null,
    nome: nome || null,
    fotoUrl: usuario.imageUrl || null,
    stripeCustomerId: customerId,
    assinatura: lerAssinatura(publico),
  };
}

/**
 * Sessão a partir de uma Request. Use em Route Handlers, que recebem a Request
 * de graça.
 */
export async function sessaoDeRequest(request: Request): Promise<Sessao> {
  const clerk = obterClerk();
  if (!clerk) return { estado: "nao_configurado" };

  const estadoRequisicao = await clerk.authenticateRequest(request, {
    acceptsToken: "session_token",
  });
  if (!estadoRequisicao.isSignedIn) return { estado: "anonimo" };

  const { userId } = estadoRequisicao.toAuth();
  const usuario = await clerk.users.getUser(userId);
  return montarSessao(usuario);
}

/**
 * Sessão a partir dos headers da requisição em curso. Use em Server Components
 * e em layouts, que não recebem a Request.
 *
 * Memorizado por requisição com `cache` do React: várias chamadas na mesma
 * árvore custam uma ida só ao Clerk.
 */
export const sessaoAtual = cache(async (): Promise<Sessao> => {
  const cabecalhos = await headers();
  const host =
    cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "localhost:3000";
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");

  // authenticateRequest só lê headers e cookies, então uma Request sintética
  // com a mesma origem é suficiente.
  const requisicao = new Request(`${protocolo}://${host}/`, { headers: cabecalhos });
  return sessaoDeRequest(requisicao);
});

/** Base pública do site, usada para montar success_url, cancel_url e return_url. */
export async function urlDoApp(request?: Request): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;

  const cabecalhos = await headers();
  const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host") ?? "localhost:3000";
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
