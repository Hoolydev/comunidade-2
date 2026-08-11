import { IniciarCheckout } from "../../componentes/IniciarCheckout";
import { ehPlanoValido } from "../../lib/planos";

export const runtime = "nodejs";

export default async function Assinar({ searchParams }: { searchParams: Promise<{ plano?: string }> }) {
  const { plano } = await searchParams;
  return <IniciarCheckout plano={ehPlanoValido(plano) ? plano : "mensal"} />;
}
