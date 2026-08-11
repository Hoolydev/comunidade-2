import type { ReactNode } from "react";
import { AreaShell } from "../componentes/AreaShell";

export default function PlataformaLayout({ children }: { children: ReactNode }) {
  return <AreaShell>{children}</AreaShell>;
}
