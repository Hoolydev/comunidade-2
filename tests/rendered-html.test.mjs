import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);

async function ler(caminho) {
  return readFile(new URL(caminho, raiz), "utf8");
}

test("configura persistência para conteúdo e arquivos", async () => {
  const [hosting, schema, migration] = await Promise.all([
    ler(".openai/hosting.json"),
    ler("db/schema.ts"),
    ler("drizzle/0000_luxuriant_warhawk.sql"),
  ]);

  assert.deepEqual(JSON.parse(hosting), {
    project_id: "appgprj_6a70caaa8db881919669309983c9f0ab",
    d1: "DB",
    r2: "FILES",
  });
  for (const tabela of ["formacoes", "aulas", "materiais", "progresso_aulas"]) {
    assert.match(schema, new RegExp(`"${tabela}"`));
    assert.match(migration, new RegExp("CREATE TABLE IF NOT EXISTS `" + tabela + "`"));
  }
});

test("usa YouTube privado e registra progresso das aulas", async () => {
  const [player, aula, progresso] = await Promise.all([
    ler("app/componentes/YouTubeLessonPlayer.tsx"),
    ler("app/(plataforma)/formacoes/[slug]/aulas/[lesson]/page.tsx"),
    ler("app/api/progresso/route.ts"),
  ]);

  assert.match(player, /youtube-nocookie\.com/);
  assert.match(player, /\/api\/progresso/);
  assert.match(player, /15_000/);
  assert.match(aula, /<YouTubeLessonPlayer/);
  assert.match(progresso, /posicaoSegundos/);
  assert.match(progresso, />= 0\.9/);
});

test("mantém biblioteca privada e painel de publicação", async () => {
  const [upload, download, painel] = await Promise.all([
    ler("app/api/admin/arquivos/route.ts"),
    ler("app/api/arquivos/[slug]/route.ts"),
    ler("app/componentes/AdminContentPanel.tsx"),
  ]);

  assert.match(upload, /env\.FILES\.put/);
  assert.match(upload, /25 \* 1024 \* 1024/);
  assert.match(download, /autorizarMembro/);
  assert.match(download, /private, no-store/);
  assert.match(painel, /Aulas no YouTube/);
  assert.match(painel, /Arquivos para membros/);
  await access(new URL("app/(plataforma)/admin/conteudos/page.tsx", raiz));
});
