import type { ReactNode } from "react";
import { AreaShell } from "../componentes/AreaShell";
import { RedirecionarAcesso } from "../componentes/RedirecionarAcesso";
import { previewLocalAtivo } from "../lib/acesso-local";
import { verificarAcesso } from "../lib/guarda";

export const runtime = "nodejs";

export default async function PlataformaLayout({ children }: { children: ReactNode }) {
  if (!previewLocalAtivo()) {
    try {
      const acesso = await verificarAcesso();
      if (!acesso.autenticado) {
        return <RedirecionarAcesso destino="/entrar?destino=%2Finicio" />;
      }
      if (!acesso.liberado) {
        return <RedirecionarAcesso destino="/planos" />;
      }
    } catch (erro) {
      console.error("Não foi possível validar o acesso à plataforma", erro);
      return <RedirecionarAcesso destino="/entrar?destino=%2Finicio" />;
    }
  }
  return <AreaShell>{children}</AreaShell>;
}
