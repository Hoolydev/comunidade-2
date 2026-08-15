import type { ReactNode } from "react";
import { AreaShell } from "../componentes/AreaShell";
import { previewLocalAtivo } from "../lib/acesso-local";
import { exigirAssinante } from "../lib/guarda";

export const runtime = "nodejs";

export default async function PlataformaLayout({ children }: { children: ReactNode }) {
  if (!previewLocalAtivo()) await exigirAssinante("/inicio");
  return <AreaShell>{children}</AreaShell>;
}
