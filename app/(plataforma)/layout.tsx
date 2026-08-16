import type { ReactNode } from "react";
import { AreaShell } from "../componentes/AreaShell";
import { RedirecionarAcesso } from "../componentes/RedirecionarAcesso";
import { previewLocalAtivo } from "../lib/acesso-local";
import { verificarAcesso } from "../lib/guarda";
import "../estilos/comunidade-interativa.css";

export const runtime = "nodejs";

export default async function PlataformaLayout({ children }: { children: ReactNode }) {
  let administrador = process.env.NODE_ENV === "development";
  let destino: string | null = null;
  if (!previewLocalAtivo()) {
    try {
      const acesso = await verificarAcesso();
      if (!acesso.autenticado) {
        destino = "/entrar?destino=%2Finicio";
      } else if (!acesso.liberado) {
        destino = "/planos";
      }
      const emailsAdministradores = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      administrador = Boolean(
        acesso.sessao?.email && emailsAdministradores.includes(acesso.sessao.email.toLowerCase()),
      );
    } catch (erro) {
      console.error("Não foi possível validar o acesso à plataforma", erro);
      destino = "/entrar?destino=%2Finicio";
    }
  }
  if (destino) return <RedirecionarAcesso destino={destino} />;
  return <AreaShell administrador={administrador}>{children}</AreaShell>;
}
