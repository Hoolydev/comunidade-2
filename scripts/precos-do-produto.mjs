// Lista os prices de um produto da Stripe e imprime as linhas prontas para o
// .env.local, já dizendo qual é o mensal e qual é o anual.
//
//   STRIPE_SECRET_KEY=sk_test_... node scripts/precos-do-produto.mjs
//   npm run precos                       (lê a chave do .env.local)
//
// Existe porque o par produto/price é a junta mais fácil de errar do go-live:
// o front exibe o valor de app/lib/planos.ts e a Stripe cobra o valor do price.
// Se divergirem, o usuário vê um número e paga outro. Este script compara os
// dois lados e acusa a diferença em vez de deixar descobrir na fatura.

import { readFile } from "node:fs/promises";

const PRODUTO_PADRAO = "prod_V2NIEDOZO1Meh9";

// Espelha app/lib/planos.ts. Não importa de lá para o script continuar
// funcionando sem passar pelo TypeScript.
const ESPERADO = {
  mensal: { centavos: 9700, intervalo: "month", contagem: 1 },
  anual: { centavos: 97000, intervalo: "year", contagem: 1 },
};

async function chaveSecreta() {
  if (process.env.STRIPE_SECRET_KEY) return process.env.STRIPE_SECRET_KEY;
  try {
    const env = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    const linha = env.split("\n").find((l) => l.startsWith("STRIPE_SECRET_KEY="));
    if (linha) return linha.slice("STRIPE_SECRET_KEY=".length).trim();
  } catch {
    // .env.local pode não existir; a mensagem abaixo explica o que fazer.
  }
  return null;
}

function reais(centavos) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    centavos / 100,
  );
}

const chave = await chaveSecreta();
if (!chave) {
  console.error(
    "Falta a chave secreta da Stripe.\n" +
      "  STRIPE_SECRET_KEY=sk_test_... node scripts/precos-do-produto.mjs\n" +
      "ou coloque STRIPE_SECRET_KEY no .env.local.",
  );
  process.exit(1);
}

const produto = process.argv[2] ?? PRODUTO_PADRAO;
const url = new URL("https://api.stripe.com/v1/prices");
url.searchParams.set("product", produto);
url.searchParams.set("active", "true");
url.searchParams.set("limit", "100");

const resposta = await fetch(url, { headers: { Authorization: `Bearer ${chave}` } });
const corpo = await resposta.json();

if (!resposta.ok) {
  console.error(`Stripe respondeu ${resposta.status}: ${corpo?.error?.message ?? "erro desconhecido"}`);
  process.exit(1);
}

const prices = corpo.data ?? [];
if (prices.length === 0) {
  console.error(
    `Nenhum price ativo em ${produto}.\n` +
      "Crie um price recorrente mensal e um anual no Dashboard da Stripe.",
  );
  process.exit(1);
}

console.log(`\nProduto ${produto} — ${prices.length} price(s) ativo(s):\n`);

const achados = {};
for (const price of prices) {
  const r = price.recurring;
  const tipo = r ? `${r.interval_count}× ${r.interval}` : "avulso (não serve para assinatura)";
  console.log(
    `  ${price.id}  ${reais(price.unit_amount ?? 0)} ${String(price.currency).toUpperCase()}  ${tipo}` +
      (price.nickname ? `  — ${price.nickname}` : ""),
  );

  if (!r || r.interval_count !== 1) continue;
  if (r.interval === "month") achados.mensal ??= price;
  if (r.interval === "year") achados.anual ??= price;
}

console.log("\nPara o .env.local e para os três ambientes do deploy:\n");
for (const slug of ["mensal", "anual"]) {
  const price = achados[slug];
  const variavel = `STRIPE_PRICE_${slug.toUpperCase()}`;
  if (!price) {
    console.log(`  ${variavel}=   # NÃO ENCONTRADO — falta um price recorrente ${slug}`);
    continue;
  }
  console.log(`  ${variavel}=${price.id}`);
}

// A comparação que justifica o script.
let divergiu = false;
console.log("");
for (const slug of ["mensal", "anual"]) {
  const price = achados[slug];
  if (!price) continue;
  const alvo = ESPERADO[slug];
  if (price.currency !== "brl") {
    console.log(`  ! ${slug}: moeda ${String(price.currency).toUpperCase()}, e a interface formata em BRL.`);
    divergiu = true;
  }
  if (price.unit_amount !== alvo.centavos) {
    console.log(
      `  ! ${slug}: a Stripe cobra ${reais(price.unit_amount ?? 0)} e ` +
        `app/lib/planos.ts exibe ${reais(alvo.centavos)}. Ajuste o arquivo.`,
    );
    divergiu = true;
  }
}
console.log(
  divergiu
    ? "\nCorrija app/lib/planos.ts antes de cobrar alguém.\n"
    : "\nValores da Stripe batem com app/lib/planos.ts.\n",
);
