import { json, lerAssinatura, sessao, temAcesso } from "./_shared.js";

const assinaturaFunction = {
  async fetch(request: Request) {
    if (request.method !== "GET") return json({ erro: "metodo_nao_permitido" }, 405);
    const usuario = await sessao(request);
    const assinatura =
      usuario.estado === "autenticado" ? usuario.assinatura : lerAssinatura(undefined);
    return json({
      autenticado: usuario.estado === "autenticado",
      status: assinatura.status,
      plano: assinatura.plano,
      temAcesso: temAcesso(assinatura.status),
      periodoFimEm: assinatura.periodoFimEm,
      cancelaNoFimDoPeriodo: assinatura.cancelaNoFimDoPeriodo,
    });
  },
};

export default assinaturaFunction;
