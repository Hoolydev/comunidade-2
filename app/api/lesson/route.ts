// =============================================================================
// GET /api/lesson?module=<slug>&lesson=<id>
// =============================================================================
//
// Esta rota é a fronteira real de segurança do conteúdo pago.
//
// As páginas da área de membros (`app/page.tsx`, `app/formacoes/**`) são Client
// Components: elas rodam no navegador e não podem guardar segredo nenhum. O
// único segredo que existe aqui é o `youtubeId` da aula, e quem o entrega é
// este Route Handler, depois de verificar sessão e assinatura no servidor.
//
// Regra, em uma linha: aula `free` é pública; aula paga exige `temAcesso()`.
//
// Os códigos de status são contrato com `app/formacoes/[module]/[lesson]/page.tsx`:
//
//   200  aula liberada        { youtubeId, locked: false }
//   400  parâmetros ausentes
//   401  anônimo em aula paga { error, locked: true }
//   402  logado sem acesso    { error, locked: true }
//   404  aula inexistente
//   503  Clerk não configurado
//
// O formato do corpo de erro (`{ error }`, em texto) é herança anterior ao
// contrato de `app/lib/tipos.ts`, que manda responder `{ erro: <CodigoErro> }`.
// Mantido como está para não quebrar o cliente. Registrado em
// `docs/handoff/duvidas.md` (D-06).
//
// =============================================================================

import { getLesson } from "../../content";
import { sessaoDeRequest } from "../../lib/sessao";
import { temAcesso } from "../../lib/tipos";

export const runtime = "nodejs";

/** Nada nesta rota pode ser guardado por CDN, proxy ou pelo próprio navegador. */
const SEM_CACHE = { "Cache-Control": "private, no-store" } as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const moduleSlug = url.searchParams.get("module");
  const lessonId = url.searchParams.get("lesson");
  if (!moduleSlug || !lessonId) {
    return Response.json(
      { error: "Parâmetros ausentes." },
      { status: 400, headers: SEM_CACHE },
    );
  }

  const found = getLesson(moduleSlug, lessonId);
  if (!found) {
    return Response.json(
      { error: "Aula não encontrada." },
      { status: 404, headers: SEM_CACHE },
    );
  }
  const { lesson } = found;

  // Aula gratuita: liberada para qualquer visitante, sem consultar o Clerk.
  if (lesson.free) {
    return Response.json({ youtubeId: lesson.youtubeId, locked: false }, { headers: SEM_CACHE });
  }

  // A partir daqui a aula é paga. Nenhum caminho abaixo pode devolver o
  // youtubeId sem passar por temAcesso().
  const sessao = await sessaoDeRequest(request);

  if (sessao.estado === "nao_configurado") {
    // Falta CLERK_SECRET_KEY. É erro de operação, não do usuário — e negar é a
    // única resposta segura: sem Clerk não há como saber quem está pedindo.
    return Response.json(
      { error: "Autenticação não configurada.", locked: true },
      { status: 503, headers: SEM_CACHE },
    );
  }

  if (sessao.estado === "anonimo") {
    return Response.json(
      { error: "Faça login para assistir.", locked: true },
      { status: 401, headers: SEM_CACHE },
    );
  }

  if (!temAcesso(sessao.assinatura.status)) {
    return Response.json(
      { error: "Assinatura necessária para assistir.", locked: true },
      { status: 402, headers: SEM_CACHE },
    );
  }

  return Response.json({ youtubeId: lesson.youtubeId, locked: false }, { headers: SEM_CACHE });
}
