// Carregador dos módulos TypeScript do app para dentro do runner de testes.
//
// Não é um arquivo de teste — é infraestrutura importada pelos testes.
//
// O Node 22.13+ já executa TypeScript por remoção de tipos, mas dois detalhes
// do projeto impedem o `import()` direto:
//
//   1. `app/lib/*.ts` importa `./tipos` sem extensão, e o resolvedor de ESM do
//      Node exige a extensão.
//   2. `app/lib/sessao.ts` importa `next/headers`, que o pacote `next` publica
//      sem mapa de `exports`, então o especificador não resolve fora do
//      bundler. A função `headers()` não é usada por nenhum teste — só o
//      import de topo precisa existir.
//
// O mesmo vale para o worker construído (`dist/server/index.js`), que importa
// `cloudflare:workers` — um esquema que só existe dentro do runtime da
// Cloudflare. `db/index.ts` já trata `env` ausente devolvendo null, então o
// stub abaixo reproduz exatamente o cenário "binding DB ausente".
//
// Todos são resolvidos por hooks de resolução em processo. Nada aqui altera o
// código do app, e nenhum teste depende de rede.

import { registerHooks } from "node:module";

const STUB_NEXT_HEADERS =
  "data:text/javascript," +
  encodeURIComponent(
    "export function headers(){throw new Error('next/headers nao esta disponivel nos testes');}\n" +
      "export function cookies(){throw new Error('next/cookies nao esta disponivel nos testes');}\n",
  );

// `env` indefinido é o cenário "binding DB ausente", que o app precisa suportar.
const STUB_CLOUDFLARE_WORKERS =
  "data:text/javascript," + encodeURIComponent("export const env = undefined;\n");

registerHooks({
  resolve(especificador, contexto, proximo) {
    if (especificador === "next/headers") {
      return { url: STUB_NEXT_HEADERS, shortCircuit: true };
    }
    if (especificador === "cloudflare:workers") {
      return { url: STUB_CLOUDFLARE_WORKERS, shortCircuit: true };
    }

    try {
      return proximo(especificador, contexto);
    } catch (erro) {
      const relativo = especificador.startsWith("./") || especificador.startsWith("../");
      if (erro?.code === "ERR_MODULE_NOT_FOUND" && relativo) {
        return proximo(`${especificador}.ts`, contexto);
      }
      throw erro;
    }
  },
});

const raiz = new URL("../app/", import.meta.url);

export const tipos = await import(new URL("lib/tipos.ts", raiz).href);
export const sessao = await import(new URL("lib/sessao.ts", raiz).href);
export const planos = await import(new URL("lib/planos.ts", raiz).href);
export const conteudo = await import(new URL("content.ts", raiz).href);

/** Todas as aulas pagas que já têm vídeo. São elas que não podem vazar. */
export function aulasPagasComVideo() {
  return conteudo.modules.flatMap((modulo) =>
    modulo.lessons
      .filter((aula) => !aula.free && aula.youtubeId)
      .map((aula) => ({
        chave: `${modulo.slug}/${aula.id}`,
        titulo: aula.title,
        youtubeId: aula.youtubeId,
      })),
  );
}

/** Uma aula gratuita com vídeo, para provar o caminho liberado da /api/lesson. */
export function primeiraAulaGratuitaComVideo() {
  for (const modulo of conteudo.modules) {
    for (const aula of modulo.lessons) {
      if (aula.free && aula.youtubeId) {
        return { modulo: modulo.slug, aula: aula.id, youtubeId: aula.youtubeId };
      }
    }
  }
  return null;
}

/** Uma aula paga qualquer, com ou sem vídeo, para provar o caminho negado. */
export function primeiraAulaPaga() {
  for (const modulo of conteudo.modules) {
    for (const aula of modulo.lessons) {
      if (!aula.free) return { modulo: modulo.slug, aula: aula.id };
    }
  }
  return null;
}
