import { TelaAutenticacao } from "../../componentes/TelaAutenticacao";

export const runtime = "nodejs";

function destinoSeguro(valor: string | undefined) {
  return valor?.startsWith("/") && !valor.startsWith("//") ? valor : "/";
}

export default async function Entrar({ searchParams }: { searchParams: Promise<{ destino?: string; plano?: string }> }) {
  const parametros = await searchParams;
  const destino = parametros.plano === "mensal" || parametros.plano === "anual"
    ? `/assinar?plano=${parametros.plano}`
    : destinoSeguro(parametros.destino);
  return <TelaAutenticacao modo="entrar" destino={destino} />;
}
