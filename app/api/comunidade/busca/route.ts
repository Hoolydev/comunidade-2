import { listarFormacoes, listarMateriais } from "../../../lib/conteudo";
import {
  autorizarComunidade,
  bancoComunidade,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const termo = textoLimitado(new URL(request.url).searchParams.get("termo"), 80);
  if (termo.length < 2) return Response.json({ resultados: [] });
  try {
    const normalizado = termo.toLocaleLowerCase("pt-BR");
    const [formacoes, materiais, membros, publicacoes] = await Promise.all([
      listarFormacoes(),
      listarMateriais(),
      bancoComunidade()
        .prepare(
          `SELECT usuario_id, nome, cargo, foco FROM perfis
           WHERE visivel = 1 AND (nome LIKE ? OR cargo LIKE ? OR foco LIKE ?) LIMIT 12`,
        )
        .bind(`%${termo}%`, `%${termo}%`, `%${termo}%`)
        .all<{ usuario_id: string; nome: string; cargo: string; foco: string }>(),
      bancoComunidade()
        .prepare(
          `SELECT id, titulo, conteudo, categoria FROM publicacoes
           WHERE titulo LIKE ? OR conteudo LIKE ? ORDER BY criado_em DESC LIMIT 12`,
        )
        .bind(`%${termo}%`, `%${termo}%`)
        .all<{ id: string; titulo: string; conteudo: string; categoria: string }>(),
    ]);
    const inclui = (texto: string) => texto.toLocaleLowerCase("pt-BR").includes(normalizado);
    return Response.json({
      resultados: [
        ...formacoes
          .filter((item) => inclui(`${item.title} ${item.description} ${item.category} ${item.lessonTitles.join(" ")}`))
          .map((item) => ({ tipo: "Formação", titulo: item.title, descricao: item.description, href: `/formacoes/${item.slug}` })),
        ...materiais
          .filter((item) => inclui(`${item.title} ${item.description} ${item.type}`))
          .map((item) => ({ tipo: "Biblioteca", titulo: item.title, descricao: item.description, href: `/biblioteca/${item.slug}` })),
        ...membros.results.map((item) => ({ tipo: "Membro", titulo: item.nome, descricao: `${item.cargo} · ${item.foco}`, href: `/membros?perfil=${encodeURIComponent(item.usuario_id)}` })),
        ...publicacoes.results.map((item) => ({ tipo: "Feed", titulo: item.titulo, descricao: item.conteudo.slice(0, 150), href: `/feed?publicacao=${encodeURIComponent(item.id)}` })),
      ].slice(0, 40),
    });
  } catch (erro) {
    return respostaErro(erro);
  }
}
