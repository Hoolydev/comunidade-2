import { ConfirmarPagamento } from "../../../componentes/ConfirmarPagamento";

export const runtime = "nodejs";

export default async function PagamentoSucesso({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  return <ConfirmarPagamento sessionId={session_id ?? null} />;
}
