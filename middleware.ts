// =============================================================================
// GUARDA DE ROTAS — CAMADA DE EXPERIÊNCIA. NÃO É AUTORIZAÇÃO.
// =============================================================================
//
// LEIA ISTO ANTES DE "CONSERTAR" ESTE ARQUIVO.
//
// Este middleware faz uma coisa só: se a rota é protegida e a requisição não
// traz nenhum cookie de sessão do Clerk, ele manda o visitante para /entrar
// antes de qualquer render. Isso evita o piscar de tela em que a área de
// membros aparece por um instante e some.
//
// Ele NÃO valida o token de sessão. Ele NÃO consulta o Clerk. Ele NÃO olha o
// estado da assinatura. Ele NÃO autoriza nada. Um cookie `__session` com valor
// inventado passa por aqui — e isso está correto, porque não é aqui que o
// conteúdo pago é protegido.
//
// A fronteira real de segurança do conteúdo pago é `GET /api/lesson`: as
// páginas da área de membros são Client Components, o `youtubeId` de uma aula
// paga só é entregue por aquele Route Handler, e ele valida a sessão pelo
// Clerk e a assinatura por `temAcesso()` a cada requisição. Ver
// `docs/seguranca.md`.
//
// Consequência prática, para quem for mexer aqui:
//
//   - Apagar este arquivo NÃO abre o conteúdo pago. Só piora a experiência.
//   - Fazer este arquivo validar token NÃO fecha buraco nenhum, e ainda coloca
//     uma chamada de rede do Clerk em toda navegação. Não faça.
//   - Se um dia alguém mover a proteção para cá, o conteúdo passa a ser
//     protegido por um lugar que roda antes do cache e não conhece o estado da
//     assinatura. Não faça isso também.
//
// Rotas deliberadamente NÃO protegidas: `/`, `/vendas`, `/planos`, `/entrar`,
// `/cadastro`, `/pagamento/**` e todo `/api/**`. As rotas de API se defendem
// sozinhas, e o webhook da Stripe em `/api/stripe/webhook` não pode em
// hipótese alguma receber um 307 — a Stripe leria o redirecionamento como
// falha de entrega e ficaria reenviando o evento.
//
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";

/**
 * Prefixos que exigem sessão. O `matcher` no fim do arquivo já limita quais
 * requisições chegam aqui; esta lista é a mesma regra escrita de novo dentro
 * da função, para o caso de o matcher ser afrouxado por engano.
 */
const PREFIXOS_PROTEGIDOS = ["/formacoes"];

function ehRotaProtegida(pathname: string): boolean {
  // `/api/**` nunca é protegido aqui, mesmo que um prefixo futuro colida.
  if (pathname === "/api" || pathname.startsWith("/api/")) return false;

  return PREFIXOS_PROTEGIDOS.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`),
  );
}

/**
 * Indício de sessão, não prova de sessão.
 *
 * O Clerk grava o token de sessão em `__session` e um sinal de "usuário
 * autenticado" em `__client_uat` (valor "0" significa deslogado). Instâncias
 * de desenvolvimento e configurações com domínio satélite acrescentam um
 * sufixo ao nome dos dois cookies, por isso a checagem é por prefixo.
 *
 * A checagem é deliberadamente permissiva: um falso positivo apenas deixa a
 * página carregar, e aí o Route Handler cuida do resto. Um falso negativo
 * mandaria um assinante legítimo para a tela de login, que é o erro caro.
 */
function temIndicioDeSessao(request: NextRequest): boolean {
  for (const cookie of request.cookies.getAll()) {
    const nome = cookie.name;

    if (nome === "__session" || nome.startsWith("__session_")) {
      if (cookie.value) return true;
    }

    if (nome === "__client_uat" || nome.startsWith("__client_uat_")) {
      if (cookie.value && cookie.value !== "0") return true;
    }
  }

  return false;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname, search } = new URL(request.url);

  if (!ehRotaProtegida(pathname)) return NextResponse.next();
  if (temIndicioDeSessao(request)) return NextResponse.next();

  const destino = new URL("/entrar", request.url);
  destino.searchParams.set("destino", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/formacoes/:caminho*"],
};
