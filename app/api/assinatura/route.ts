import { NextResponse } from "next/server";

import { sessaoDeRequest } from "../../lib/sessao";
import { ASSINATURA_VAZIA, temAcesso, type AssinaturaResposta } from "../../lib/tipos";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessao = await sessaoDeRequest(request);
  const assinatura = sessao.estado === "autenticado" ? sessao.assinatura : ASSINATURA_VAZIA;
  const resposta: AssinaturaResposta = {
    autenticado: sessao.estado === "autenticado",
    status: assinatura.status,
    plano: assinatura.plano,
    temAcesso: temAcesso(assinatura.status),
    periodoFimEm: assinatura.periodoFimEm,
    cancelaNoFimDoPeriodo: assinatura.cancelaNoFimDoPeriodo,
  };
  return NextResponse.json(resposta);
}
