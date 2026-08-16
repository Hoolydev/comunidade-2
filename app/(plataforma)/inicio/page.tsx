import { InicioInterativo } from "../../componentes/InicioInterativo";
import { formacoes } from "../../dados-comunidade";
import { sessaoAtual } from "../../lib/sessao";

export default async function Inicio() {
  const sessao = await sessaoAtual();
  const nomeCompleto = sessao.estado === "autenticado" ? sessao.nome ?? sessao.email?.split("@")[0] ?? "Membro" : "Membro";
  return <InicioInterativo nome={nomeCompleto.split(" ")[0]} formacoes={formacoes} />;
}
