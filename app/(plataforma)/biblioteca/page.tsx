import { CatalogoBiblioteca } from "../../componentes/CatalogosInterativos";
import { listarMateriais } from "../../lib/conteudo";

export default async function BibliotecaPage() {
  const materiais = await listarMateriais();
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Biblioteca de implementação</p><h1>Materiais para transformar aprendizado em execução.</h1><p>Planilhas, checklists, roteiros e modelos editáveis para você não começar do zero.</p></div><div className="area-hero-aside"><strong>{materiais.length}</strong><span>recursos disponíveis</span></div></section><CatalogoBiblioteca materiais={materiais} /></div>;
}
