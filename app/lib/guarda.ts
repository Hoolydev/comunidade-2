// CONTRATO CONGELADO — ver CLAUDE.md e docs/seguranca.md.
//
// Guarda de rotas do lado do servidor. Esta é a camada que de fato protege o
// conteúdo pago. O middleware existe para melhorar a experiência (redirecionar
// cedo, sem piscar tela), nunca para autorizar.

import { redirect } from "next/navigation";

import { sessaoAtual } from "./sessao";
import { temAcesso, type SessaoAutenticada } from "./tipos";

/**
 * Exige apenas que o visitante esteja autenticado.
 * Sem sessão, redireciona para /entrar preservando o destino.
 */
export async function exigirSessao(destino: string): Promise<SessaoAutenticada> {
  const sessao = await sessaoAtual();
  if (sessao.estado !== "autenticado") {
    redirect(`/entrar?destino=${encodeURIComponent(destino)}`);
  }
  return sessao;
}

/**
 * Exige assinatura ativa. Use no topo de todo Server Component que renderiza
 * conteúdo pago, antes de qualquer leitura de conteúdo.
 *
 * Sem sessão   -> /entrar?destino=...
 * Sem acesso   -> /planos
 */
export async function exigirAssinante(destino: string): Promise<SessaoAutenticada> {
  const sessao = await exigirSessao(destino);
  if (!temAcesso(sessao.assinatura.status)) {
    redirect("/planos");
  }
  return sessao;
}

/**
 * Versão que não redireciona, para telas que precisam renderizar um paywall no
 * lugar do conteúdo em vez de mandar o usuário para outra rota.
 */
export async function verificarAcesso(): Promise<{
  autenticado: boolean;
  liberado: boolean;
  sessao: SessaoAutenticada | null;
}> {
  const sessao = await sessaoAtual();
  if (sessao.estado !== "autenticado") {
    return { autenticado: false, liberado: false, sessao: null };
  }
  return {
    autenticado: true,
    liberado: temAcesso(sessao.assinatura.status),
    sessao,
  };
}
