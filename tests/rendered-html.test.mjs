// =============================================================================
// T-A6 e T-A2 · Provas de ponta a ponta contra o worker construído
// =============================================================================
//
// Estes testes exercitam `dist/server/index.js`, o worker que o `vinext build`
// produz — o mesmo artefato que roda em produção. Nenhum deles toca a rede:
// o Clerk só é consultado quando a requisição traz credencial, e nenhuma
// requisição aqui traz. Cenários que exigiriam Clerk ou Stripe de verdade
// estão em `docs/seguranca.md`, no roteiro manual.
//
// Cobrem:
//   · o middleware redireciona /formacoes/** sem cookie de sessão
//   · o middleware não toca em rota pública nem em /api/**
//   · GET /api/lesson libera aula gratuita e nega aula paga
//   · nenhum youtubeId de aula paga aparece no HTML nem no bundle do cliente
//
// -----------------------------------------------------------------------------
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  aulasPagasComVideo,
  conteudo,
  primeiraAulaGratuitaComVideo,
  primeiraAulaPaga,
} from "./modulos-do-app.mjs";

// -----------------------------------------------------------------------------
// Harness
// -----------------------------------------------------------------------------

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const ENV = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};

const CTX = { waitUntil() {}, passThroughOnException() {} };

/** Uma requisição ao worker construído. `cookie` e `method` são opcionais. */
function pedir(caminho, { method = "GET", cookie, accept = "text/html" } = {}) {
  const headers = { accept };
  if (cookie) headers.cookie = cookie;
  return worker.fetch(
    new Request(`http://localhost${caminho}`, { method, headers, redirect: "manual" }),
    ENV,
    CTX,
  );
}

function ehRedirecionamento(resposta) {
  return resposta.status >= 300 && resposta.status < 400;
}

/** Para onde o redirecionamento aponta, como caminho + query. */
function destinoDoRedirecionamento(resposta) {
  const location = resposta.headers.get("location");
  assert.ok(location, "resposta 3xx sem header Location");
  const url = new URL(location, "http://localhost");
  return `${url.pathname}${url.search}`;
}

const AULA_PAGA = primeiraAulaPaga();
const AULA_GRATUITA = primeiraAulaGratuitaComVideo();
const ROTA_PROTEGIDA = `/formacoes/${AULA_PAGA.modulo}`;
const ROTA_PROTEGIDA_FUNDA = `/formacoes/${AULA_PAGA.modulo}/${AULA_PAGA.aula}`;

// Cookies que o Clerk usa. Valores inventados de propósito: o middleware não
// valida token, e é exatamente isso que estes testes fixam.
const COOKIE_SESSAO = "__session=token-inventado-nao-validado";
const COOKIE_SESSAO_COM_SUFIXO = "__session_abc123=token-inventado-nao-validado";
const COOKIE_UAT = "__client_uat=1738000000";
const COOKIE_UAT_DESLOGADO = "__client_uat=0";

// -----------------------------------------------------------------------------
// T-A6 · O middleware protege /formacoes/** — e só isso
// -----------------------------------------------------------------------------

test("sem cookie de sessão, /formacoes/** redireciona para /entrar com o destino", async () => {
  for (const rota of [ROTA_PROTEGIDA, ROTA_PROTEGIDA_FUNDA, "/formacoes/inexistente"]) {
    const resposta = await pedir(rota);
    assert.ok(
      ehRedirecionamento(resposta),
      `${rota} deveria redirecionar visitante anônimo, veio ${resposta.status}`,
    );
    assert.equal(
      destinoDoRedirecionamento(resposta),
      `/entrar?destino=${encodeURIComponent(rota)}`,
    );
  }
});

test("o destino preserva a query da rota original", async () => {
  const resposta = await pedir(`${ROTA_PROTEGIDA_FUNDA}?t=30`);
  assert.ok(ehRedirecionamento(resposta));
  assert.equal(
    destinoDoRedirecionamento(resposta),
    `/entrar?destino=${encodeURIComponent(`${ROTA_PROTEGIDA_FUNDA}?t=30`)}`,
  );
});

test("__client_uat=0 é sinal de deslogado e também redireciona", async () => {
  const resposta = await pedir(ROTA_PROTEGIDA, { cookie: COOKIE_UAT_DESLOGADO });
  assert.ok(ehRedirecionamento(resposta), "uat zerado significa sessão encerrada");
});

test("qualquer indício de sessão do Clerk deixa a página renderizar", async () => {
  // Deliberado: o middleware não valida o token. Um cookie inventado passa,
  // e o conteúdo pago continua protegido porque quem protege é /api/lesson.
  for (const cookie of [COOKIE_SESSAO, COOKIE_SESSAO_COM_SUFIXO, COOKIE_UAT]) {
    const resposta = await pedir(ROTA_PROTEGIDA, { cookie });
    assert.equal(
      ehRedirecionamento(resposta),
      false,
      `cookie "${cookie}" não deveria ser redirecionado`,
    );
    assert.equal(resposta.status, 200);
  }
});

test("rotas públicas nunca são redirecionadas pelo middleware", async () => {
  const publicas = [
    "/",
    "/vendas",
    "/planos",
    "/entrar",
    "/cadastro",
    "/pagamento/sucesso",
    "/assinar",
  ];

  for (const rota of publicas) {
    const resposta = await pedir(rota);
    if (ehRedirecionamento(resposta)) {
      assert.notEqual(
        new URL(resposta.headers.get("location"), "http://localhost").pathname,
        "/entrar",
        `${rota} é pública e não pode ser mandada para /entrar pelo middleware`,
      );
    }
  }
});

test("/api/** nunca passa por redirecionamento", async () => {
  // O webhook da Stripe é o caso crítico: um 307 seria lido como falha de
  // entrega e a Stripe reenviaria o evento para sempre.
  const rotas = [
    { caminho: "/api/stripe/webhook", method: "POST" },
    { caminho: "/api/checkout", method: "POST" },
    { caminho: `/api/lesson?module=${AULA_PAGA.modulo}&lesson=${AULA_PAGA.aula}` },
  ];

  for (const { caminho, method } of rotas) {
    const resposta = await pedir(caminho, { method, accept: "application/json" });
    assert.equal(
      ehRedirecionamento(resposta),
      false,
      `${caminho} não pode ser redirecionado, veio ${resposta.status} para ${resposta.headers.get("location")}`,
    );
  }
});

test("o middleware não é a camada de autorização, e o arquivo diz isso", async () => {
  // Um comentário não é executável, mas este é o único aviso que separa uma
  // manutenção correta de alguém "corrigindo" o middleware para validar token.
  const fonte = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");
  assert.match(fonte, /NÃO É AUTORIZAÇÃO|não autoriza/i);
  assert.match(fonte, /api\/lesson/);
  assert.doesNotMatch(fonte, /CLERK_SECRET_KEY/, "o middleware não pode ler a chave secreta");
  assert.doesNotMatch(fonte, /createClerkClient|authenticateRequest/);
});

// -----------------------------------------------------------------------------
// T-A2 · GET /api/lesson é a fronteira real
// -----------------------------------------------------------------------------

test("GET /api/lesson entrega aula gratuita a visitante anônimo", async () => {
  assert.ok(AULA_GRATUITA, "o conteúdo precisa ter ao menos uma aula gratuita com vídeo");

  const resposta = await pedir(
    `/api/lesson?module=${AULA_GRATUITA.modulo}&lesson=${AULA_GRATUITA.aula}`,
    { accept: "application/json" },
  );

  assert.equal(resposta.status, 200);
  const corpo = await resposta.json();
  assert.equal(corpo.youtubeId, AULA_GRATUITA.youtubeId);
  assert.equal(corpo.locked, false);
});

test("GET /api/lesson nunca entrega youtubeId de aula paga a visitante anônimo", async () => {
  const resposta = await pedir(
    `/api/lesson?module=${AULA_PAGA.modulo}&lesson=${AULA_PAGA.aula}`,
    { accept: "application/json" },
  );

  // 401 quando o Clerk está configurado e a requisição é anônima; 503 quando o
  // ambiente de teste não tem CLERK_SECRET_KEY. Os dois negam, que é o ponto.
  assert.ok(
    [401, 503].includes(resposta.status),
    `aula paga para anônimo deveria negar, veio ${resposta.status}`,
  );

  const corpo = await resposta.json();
  assert.equal(corpo.youtubeId, undefined, "nenhum youtubeId pode aparecer numa negativa");
  assert.equal(corpo.locked, true);
});

test("GET /api/lesson não vaza aula paga por parâmetro malformado", async () => {
  const tentativas = [
    "/api/lesson",
    "/api/lesson?module=&lesson=",
    `/api/lesson?module=${AULA_PAGA.modulo}`,
    `/api/lesson?lesson=${AULA_PAGA.aula}`,
    `/api/lesson?module=${AULA_PAGA.modulo}&lesson=${AULA_PAGA.aula}&free=true`,
    `/api/lesson?module=${AULA_PAGA.modulo}&lesson=${AULA_PAGA.aula}&lesson=${AULA_GRATUITA.aula}`,
    "/api/lesson?module=../&lesson=../",
    `/api/lesson?module=${AULA_PAGA.modulo}&lesson=__proto__`,
    "/api/lesson?module=constructor&lesson=constructor",
  ];

  for (const caminho of tentativas) {
    const resposta = await pedir(caminho, { accept: "application/json" });
    assert.notEqual(resposta.status, 200, `${caminho} não pode responder 200`);
    const corpo = await resposta.json();
    assert.equal(corpo.youtubeId, undefined, `${caminho} devolveu youtubeId`);
  }
});

test("a resposta de /api/lesson nunca pode ser guardada em cache", async () => {
  const resposta = await pedir(
    `/api/lesson?module=${AULA_GRATUITA.modulo}&lesson=${AULA_GRATUITA.aula}`,
    { accept: "application/json" },
  );
  assert.match(resposta.headers.get("cache-control") ?? "", /no-store/);
});

test("/api/lesson autoriza pelo contrato congelado, não por comparação própria", async () => {
  const fonte = await readFile(new URL("../app/api/lesson/route.ts", import.meta.url), "utf8");

  assert.match(fonte, /sessaoDeRequest/, "a sessão vem de app/lib/sessao.ts");
  assert.match(fonte, /temAcesso/, "o acesso vem de app/lib/tipos.ts");
  assert.doesNotMatch(fonte, /getMemberState|lib\/membership/, "o formato legado foi aposentado");
  assert.doesNotMatch(
    fonte,
    /===\s*["']active["']|===\s*["']trialing["']/,
    "a regra de acesso não pode ser reimplementada aqui",
  );
  assert.match(fonte, /runtime\s*=\s*["']nodejs["']/);
});

// -----------------------------------------------------------------------------
// T-A2 item 6 · Nenhum youtubeId de aula paga chega ao visitante anônimo
// -----------------------------------------------------------------------------

const AVISO_VAZAMENTO = [
  "app/content.ts é importado por Client Components, então tudo que está nele",
  "chega ao navegador. Um youtubeId de aula paga colocado lá torna /api/lesson",
  "decorativo. A saída é manter os ids das aulas pagas fora do módulo que o",
  "cliente importa (arquivo só de servidor, lido por /api/lesson).",
].join(" ");

/** Todo o JavaScript e HTML que o navegador de um anônimo pode baixar. */
async function corpusDoCliente() {
  const dirAssets = new URL("../dist/client/assets/", import.meta.url);
  const arquivos = await readdir(dirAssets);
  const textos = await Promise.all(
    arquivos
      .filter((nome) => nome.endsWith(".js") || nome.endsWith(".css"))
      .map((nome) => readFile(new URL(nome, dirAssets), "utf8")),
  );
  return textos.join("\n");
}

test("o varredor enxerga mesmo o que o cliente baixa", async () => {
  // Canário: sem isto, os dois testes abaixo passariam de graça se o corpus
  // viesse vazio ou o caminho do build mudasse.
  const corpus = await corpusDoCliente();
  assert.ok(corpus.length > 10_000, "o bundle do cliente veio vazio ou pequeno demais");
  assert.ok(
    corpus.includes(conteudo.modules[0].slug),
    "o corpus deveria conter os slugs dos módulos — o varredor não está lendo o build certo",
  );
});

test("nenhum youtubeId de aula paga aparece no bundle do cliente", async () => {
  const pagas = aulasPagasComVideo();
  const corpus = await corpusDoCliente();

  for (const aula of pagas) {
    assert.equal(
      corpus.includes(aula.youtubeId),
      false,
      `a aula paga ${aula.chave} vazou o youtubeId "${aula.youtubeId}" no bundle. ${AVISO_VAZAMENTO}`,
    );
  }
});

test("nenhum youtubeId de aula paga aparece no HTML servido a um anônimo", async () => {
  const pagas = aulasPagasComVideo();

  const rotas = ["/", ROTA_PROTEGIDA, ROTA_PROTEGIDA_FUNDA];
  for (const rota of rotas) {
    // A área de membros e as rotas protegidas, ambas vistas por quem tem
    // cookie inventado — o pior caso que o middleware deixa passar.
    const resposta = await pedir(rota, { cookie: COOKIE_SESSAO });
    if (ehRedirecionamento(resposta)) continue;

    const html = await resposta.text();
    for (const aula of pagas) {
      assert.equal(
        html.includes(aula.youtubeId),
        false,
        `${rota} vazou o youtubeId da aula paga ${aula.chave}. ${AVISO_VAZAMENTO}`,
      );
    }
    assert.doesNotMatch(
      html,
      /youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{6,}/,
      `${rota} embutiu um player do YouTube no HTML do servidor`,
    );
  }
});

test("a área de membros responde HTML a um visitante anônimo", async () => {
  const resposta = await pedir("/");
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await resposta.text();
  assert.match(html, /<html lang="pt-BR"/);
  // A porta de entrada é pública de propósito; o que ela não pode fazer é
  // entregar vídeo pago. Isso é o que o teste acima fixa.
  assert.ok(html.length > 1000);
});
