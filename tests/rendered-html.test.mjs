import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const raiz = new URL("../", import.meta.url);

async function ler(caminho) {
  return readFile(new URL(caminho, raiz), "utf8");
}

test("configura persistência para conteúdo e arquivos", async () => {
  const [hosting, schema, migration, remoteConfig, seed] = await Promise.all([
    ler(".openai/hosting.json"),
    ler("db/schema.ts"),
    ler("drizzle/0000_luxuriant_warhawk.sql"),
    ler("wrangler.remote.jsonc"),
    ler("drizzle/0001_seed_conteudo.sql"),
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
  assert.match(remoteConfig, /"binding": "DB"/);
  assert.match(remoteConfig, /"database_name": "movimento-hagios"/);
  assert.match(remoteConfig, /"binding": "FILES"/);
  assert.match(remoteConfig, /"bucket_name": "movimento-hagios-arquivos"/);
  assert.equal((seed.match(/INSERT OR IGNORE INTO formacoes/g) ?? []).length, 9);
  assert.equal((seed.match(/INSERT OR IGNORE INTO aulas/g) ?? []).length, 68);
  assert.equal((seed.match(/INSERT OR IGNORE INTO materiais/g) ?? []).length, 8);
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

test("protege a comunidade e libera acesso somente pelo webhook", async () => {
  const [inicio, layout, provider, checkout, webhook, webhookVercel, apiShared, sucesso, portal] = await Promise.all([
    ler("app/(plataforma)/inicio/page.tsx"),
    ler("app/(plataforma)/layout.tsx"),
    ler("app/ClerkClientProvider.tsx"),
    ler("app/api/checkout/route.ts"),
    ler("app/api/stripe/webhook/route.ts"),
    ler("api/stripe/webhook.ts"),
    ler("api/_shared.ts"),
    ler("app/componentes/ConfirmarPagamento.tsx"),
    ler("app/componentes/GerenciarAssinaturaButton.tsx"),
  ]);

  assert.match(inicio, /HomeMembro/);
  assert.match(layout, /verificarAcesso/);
  assert.match(layout, /RedirecionarAcesso/);
  assert.match(provider, /localization=\{ptBR\}/);
  assert.match(provider, /CLERK_PUBLISHABLE_KEY/);
  assert.doesNotMatch(provider, /publishableKey: string/);
  assert.match(checkout, /priceIdDoPlano/);
  assert.doesNotMatch(checkout, /pedido\.price/);
  assert.match(checkout, /client_reference_id/);
  assert.match(checkout, /subscription_data/);
  assert.match(webhook, /await request\.text\(\)/);
  assert.match(webhook, /constructEventAsync/);
  assert.match(webhook, /registrarEventoStripe/);
  assert.match(webhook, /invoice\.payment_succeeded/);
  assert.match(webhookVercel, /invoice\.payment_succeeded/);
  assert.match(apiShared, /status === "active" \|\| status === "trialing"/);
  assert.doesNotMatch(apiShared, /status === "trialing" \|\| status === "past_due"/);
  assert.match(sucesso, /\/api\/assinatura/);
  assert.doesNotMatch(sucesso, /updateUserMetadata/);
  assert.match(portal, /\/api\/portal/);
  assert.match(portal, /Gerenciar assinatura/);
});

test("usa a landing pública na raiz e mantém o início dos membros separado", async () => {
  const [raiz, area, entrar, vercel] = await Promise.all([
    ler("app/page.tsx"),
    ler("app/componentes/AreaShell.tsx"),
    ler("app/(publico)/entrar/page.tsx"),
    ler("vercel.json"),
  ]);

  assert.match(raiz, /\(publico\)\/vendas\/page/);
  assert.match(area, /href: "\/inicio"/);
  assert.match(entrar, /"\/inicio"/);
  assert.deepEqual(JSON.parse(vercel).rewrites[0], {
    source: "/",
    destination: "https://movimento-hagios.hoolydev.workers.dev/vendas",
  });
});

test("mantém as telas públicas de aquisição e autenticação", async () => {
  for (const caminho of [
    "app/(publico)/vendas/page.tsx",
    "app/(publico)/planos/page.tsx",
    "app/(publico)/entrar/page.tsx",
    "app/(publico)/cadastro/page.tsx",
    "app/(publico)/assinar/page.tsx",
    "app/(publico)/pagamento/sucesso/page.tsx",
  ]) {
    await access(new URL(caminho, raiz));
  }

  const [vendas, estilos] = await Promise.all([
    ler("app/(publico)/vendas/page.tsx"),
    ler("app/estilos/acesso.css"),
  ]);
  assert.match(vendas, /formacao\.cover/);
  assert.match(vendas, /mh-track-marquee/);
  assert.match(vendas, /mockup-comunidade-hagios\.png/);
  assert.match(vendas, /Quero implementar IA na minha empresa/);
  assert.match(vendas, /Quero ganhar produtividade com IA/);
  assert.match(vendas, /Aplicação prática no negócio/);
  assert.match(vendas, /Direção clara para implementar/);
  assert.match(vendas, /três operações com IA/);
  assert.match(vendas, /Quero o desconto do plano anual/);
  assert.match(vendas, /quase 2 mensalidades de desconto/);
  assert.doesNotMatch(vendas, /ArrowRight/);
  assert.doesNotMatch(vendas, /sales-orbit/);
  assert.match(estilos, /hero-immersive-ai-hagios\.png/);
  await access(new URL("public/mockup-comunidade-hagios.png", raiz));
  await access(new URL("public/hero-immersive-ai-hagios.png", raiz));
});

test("destaca a economia anual na oferta e no checkout", async () => {
  const [oferta, checkoutWorker, checkoutVercel] = await Promise.all([
    ler("app/lib/oferta-publica.ts"),
    ler("app/api/checkout/route.ts"),
    ler("api/checkout.ts"),
  ]);

  assert.match(oferta, /99_700/);
  assert.match(checkoutWorker, /custom_text/);
  assert.match(checkoutWorker, /economize R\$ 167/);
  assert.match(checkoutVercel, /custom_text/);
  assert.match(checkoutVercel, /economize R\$ 167/);
});
