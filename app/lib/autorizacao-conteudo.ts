import { sessaoDeRequest } from "./sessao";
import { temAcesso } from "./tipos";

export type IdentidadeConteudo = { uid: string; email: string | null };

function ambienteLocal() {
  return process.env.NODE_ENV === "development";
}

function emailsAdministradores() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function autorizarMembro(request: Request): Promise<IdentidadeConteudo | null> {
  const sessao = await sessaoDeRequest(request);
  if (sessao.estado === "autenticado" && temAcesso(sessao.assinatura.status)) {
    return { uid: sessao.uid, email: sessao.email };
  }
  if (ambienteLocal()) {
    return sessao.estado === "autenticado"
      ? { uid: sessao.uid, email: sessao.email }
      : { uid: "preview-local", email: null };
  }
  return null;
}

export async function autorizarAdministrador(
  request: Request,
): Promise<IdentidadeConteudo | null> {
  const sessao = await sessaoDeRequest(request);
  if (ambienteLocal() && sessao.estado !== "autenticado") {
    return { uid: "admin-local", email: null };
  }
  if (sessao.estado !== "autenticado") return null;

  const permitidos = emailsAdministradores();
  if (ambienteLocal() && permitidos.length === 0) {
    return { uid: sessao.uid, email: sessao.email };
  }
  if (!sessao.email || !permitidos.includes(sessao.email.toLowerCase())) return null;
  return { uid: sessao.uid, email: sessao.email };
}
