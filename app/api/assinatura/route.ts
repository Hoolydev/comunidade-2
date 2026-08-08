// GET /api/assinatura — estado da assinatura do usuário da requisição.
//
// Substitui o listener em tempo real do Firestore previsto no PRD original: o
// Clerk não expõe stream ao cliente, então /pagamento/sucesso faz polling
// daqui enquanto espera o webhook. Por isso esta rota é barata (uma leitura de
// sessão) e **sempre responde 200**: um 500 no meio do polling faria a página
// de sucesso mostrar erro para quem acabou de pagar.

import { sessaoDeRequest } from "../../lib/sessao";
import {
  ASSINATURA_VAZIA,
  temAcesso,
  type AssinaturaResposta,
  type Assinatura,
} from "../../lib/tipos";

export const runtime = "nodejs";

function resposta(autenticado: boolean, assinatura: Assinatura): Response {
  return Response.json({
    autenticado,
    status: assinatura.status,
    plano: assinatura.plano,
    temAcesso: temAcesso(assinatura.status),
    periodoFimEm: assinatura.periodoFimEm,
    cancelaNoFimDoPeriodo: assinatura.cancelaNoFimDoPeriodo,
  } satisfies AssinaturaResposta);
}

export async function GET(request: Request): Promise<Response> {
  try {
    const sessao = await sessaoDeRequest(request);
    if (sessao.estado !== "autenticado") return resposta(false, ASSINATURA_VAZIA);
    return resposta(true, sessao.assinatura);
  } catch {
    // Clerk fora do ar ou ambiente incompleto: o polling continua e a próxima
    // tentativa resolve. Nunca lança.
    return resposta(false, ASSINATURA_VAZIA);
  }
}
