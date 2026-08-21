import type { ReactNode } from "react";
import { AreaShell } from "../componentes/AreaShell";
import { RedirecionarAcesso } from "../componentes/RedirecionarAcesso";
import { previewLocalAtivo } from "../lib/acesso-local";
import { ehAdministrador } from "../lib/administradores";
import { verificarAcesso } from "../lib/guarda";
import "../estilos/comunidade-interativa.css";

export const runtime = "nodejs";

export default async function PlataformaLayout({ children }: { children: ReactNode }) {
  let administrador = process.env.NODE_ENV === "development";
  let destino: string | null = null;
  if (!previewLocalAtivo()) {
    try {
      const acesso = await verificarAcesso();
      administrador = ehAdministrador(acesso.sessao?.email);
      if (!acesso.autenticado) {
        destino = "/entrar?destino=%2Finicio";
      } else if (!acesso.liberado && !administrador) {
        destino = "/planos";
      }
    } catch (erro) {
      console.error("Não foi possível validar o acesso à plataforma", erro);
      destino = "/entrar?destino=%2Finicio";
    }
  }
  if (destino) return <RedirecionarAcesso destino={destino} />;
  return <AreaShell administrador={administrador}>{children}</AreaShell>;
}
