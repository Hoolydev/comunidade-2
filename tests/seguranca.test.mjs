// =============================================================================
// T-A2 · Provas de segurança — unidades puras
// =============================================================================
//
// O PRD original pedia testes de Firestore Security Rules. Aqui não existe
// acesso do cliente ao banco: o navegador nunca fala com o D1, e o estado da
// assinatura só é escrito pelo webhook da Stripe usando a chave secreta do
// Clerk. As propriedades a provar são outras, e são estas.
//
// Nenhum teste deste arquivo toca a rede. Cenários que exigiriam Clerk ou
// Stripe de verdade estão listados em `docs/seguranca.md` como roteiro manual.
//
// =============================================================================

import assert from "node:assert/strict";
import test from "node:test";

import { planos, sessao, tipos } from "./modulos-do-app.mjs";

const { temAcesso, ASSINATURA_VAZIA } = tipos;
const { lerAssinatura } = sessao;
const { ehPlanoValido, priceIdDoPlano, planoDoPriceId } = planos;

// -----------------------------------------------------------------------------
// 1 · temAcesso — tabela-verdade completa
// -----------------------------------------------------------------------------

test("temAcesso libera active, trialing e past_due", () => {
  // Os seis status de StatusAssinatura, um a um. Se um status novo entrar no
  // tipo sem entrar aqui, o teste de exaustividade abaixo acusa.
  //
  // `past_due` libera de propósito: ele só surge quando uma cobrança de
  // renovação falha, e quem chega nele já pagou antes — a primeira cobrança
  // recusada deixa a assinatura em `incomplete`. O acesso cai em `canceled`.
  const tabela = [
    ["nenhuma", false],
    ["incomplete", false],
    ["trialing", true],
    ["active", true],
    ["past_due", true],
    ["canceled", false],
  ];

  for (const [status, esperado] of tabela) {
    assert.equal(
      temAcesso(status),
      esperado,
      `temAcesso("${status}") deveria ser ${esperado}`,
    );
  }

  const liberados = tabela.filter(([, ok]) => ok).map(([status]) => status);
  assert.deepEqual(liberados.sort(), ["active", "past_due", "trialing"]);
});

test("temAcesso nega qualquer valor fora da união de status", () => {
  // Um status desconhecido chegando aqui significa que lerAssinatura falhou em
  // saneá-lo. Mesmo assim, negar é a resposta certa.
  for (const valor of ["ACTIVE", "ativa", "paid", "", null, undefined, 1, {}, []]) {
    assert.equal(temAcesso(valor), false, `temAcesso(${JSON.stringify(valor)}) deveria ser false`);
  }
});

test("a tabela-verdade cobre todos os status conhecidos do sistema", () => {
  // Exaustividade: o conjunto de status que o próprio código sabe sanear é
  // exatamente o conjunto testado acima. Se alguém acrescentar um status novo
  // em tipos.ts e em sessao.ts, este teste quebra e obriga a atualizar a
  // tabela — que é o ponto.
  const conhecidos = new Set();
  for (const status of [
    "nenhuma",
    "incomplete",
    "trialing",
    "active",
    "past_due",
    "canceled",
  ]) {
    const lido = lerAssinatura({ assinatura: { status } }).status;
    assert.equal(lido, status, `lerAssinatura deveria preservar o status "${status}"`);
    conhecidos.add(lido);
  }
  assert.equal(conhecidos.size, 6);
});

// -----------------------------------------------------------------------------
// 2 · lerAssinatura — conversão do formato legado
// -----------------------------------------------------------------------------

test("lerAssinatura converte o formato legado membership: active em status: active", () => {
  // Se esta conversão quebrar, todo mundo que já pagou antes do contrato atual
  // perde o acesso sem nenhum erro aparecer em lugar nenhum.
  const assinatura = lerAssinatura({ membership: "active" });

  assert.equal(assinatura.status, "active");
  assert.equal(temAcesso(assinatura.status), true);
  assert.equal(assinatura.plano, null);
  assert.equal(assinatura.stripeSubscriptionId, null);
});

test("lerAssinatura preserva o stripeSubscriptionId do formato legado", () => {
  const assinatura = lerAssinatura({
    membership: "active",
    stripeSubscriptionId: "sub_legado_123",
  });

  assert.equal(assinatura.status, "active");
  assert.equal(assinatura.stripeSubscriptionId, "sub_legado_123");
});

test("lerAssinatura não confunde membership inativo com acesso", () => {
  for (const valor of ["inactive", "canceled", "", "Active", true, 1, null]) {
    const assinatura = lerAssinatura({ membership: valor });
    assert.equal(
      temAcesso(assinatura.status),
      false,
      `membership: ${JSON.stringify(valor)} não pode liberar acesso`,
    );
  }
});

test("o formato novo tem precedência sobre o legado", () => {
  // Um usuário migrado carrega os dois campos por um tempo. O objeto
  // `assinatura` é a fonte de verdade; `membership` é resíduo.
  const assinatura = lerAssinatura({
    membership: "active",
    assinatura: { status: "canceled" },
  });

  assert.equal(assinatura.status, "canceled");
  assert.equal(temAcesso(assinatura.status), false);
});

// -----------------------------------------------------------------------------
// 3 · lerAssinatura — estado vazio, nunca lança, nunca inventa acesso
// -----------------------------------------------------------------------------

test("lerAssinatura devolve o estado vazio para metadata ausente ou vazio", () => {
  for (const metadata of [undefined, null, {}]) {
    const assinatura = lerAssinatura(metadata);
    assert.deepEqual(
      assinatura,
      ASSINATURA_VAZIA,
      `metadata ${JSON.stringify(metadata)} deveria virar ASSINATURA_VAZIA`,
    );
    assert.equal(temAcesso(assinatura.status), false);
  }
});

test("lerAssinatura sanea status desconhecido para nenhuma", () => {
  for (const status of [
    "ativa",
    "ACTIVE",
    "paid",
    "unpaid",
    "",
    null,
    undefined,
    42,
    { status: "active" },
    ["active"],
  ]) {
    const assinatura = lerAssinatura({ assinatura: { status } });
    assert.equal(
      assinatura.status,
      "nenhuma",
      `status ${JSON.stringify(status)} deveria virar "nenhuma"`,
    );
    assert.equal(temAcesso(assinatura.status), false);
  }
});

test("lerAssinatura sanea os demais campos sem lançar", () => {
  const assinatura = lerAssinatura({
    assinatura: {
      status: "active",
      plano: "vitalicio",
      stripeSubscriptionId: 123,
      periodoFimEm: "amanhã",
      cancelaNoFimDoPeriodo: "sim",
      atualizadoEm: null,
      eventoEm: "ontem",
    },
  });

  assert.equal(assinatura.status, "active");
  assert.equal(assinatura.plano, null, "plano fora da união vira null");
  assert.equal(assinatura.stripeSubscriptionId, null);
  assert.equal(assinatura.periodoFimEm, null);
  assert.equal(assinatura.cancelaNoFimDoPeriodo, false, "só o booleano true conta");
  assert.equal(assinatura.atualizadoEm, 0);
  assert.equal(assinatura.eventoEm, null);
});

test("lerAssinatura nunca lança, qualquer que seja a entrada", () => {
  const entradas = [
    undefined,
    null,
    {},
    { assinatura: null },
    { assinatura: 0 },
    { assinatura: "active" },
    { assinatura: [] },
    { assinatura: { status: Symbol("x") } },
    { assinatura: Object.create(null) },
    Object.create(null),
  ];

  for (const [indice, entrada] of entradas.entries()) {
    let resultado;
    assert.doesNotThrow(() => {
      resultado = lerAssinatura(entrada);
    }, `lerAssinatura(entradas[${indice}]) não pode lançar`);
    assert.equal(
      temAcesso(resultado.status),
      false,
      "nenhuma entrada malformada pode virar acesso liberado",
    );
  }
});

// -----------------------------------------------------------------------------
// 4 · priceIdDoPlano e ehPlanoValido
// -----------------------------------------------------------------------------

const CHAVES_DE_PRICE = ["STRIPE_PRICE_MENSAL", "STRIPE_PRICE_ANUAL", "STRIPE_PRICE_ID"];

/** Roda `corpo` com um ambiente controlado e restaura o original no fim. */
function comAmbiente(valores, corpo) {
  const original = {};
  for (const chave of CHAVES_DE_PRICE) {
    original[chave] = process.env[chave];
    if (valores[chave] === undefined) delete process.env[chave];
    else process.env[chave] = valores[chave];
  }
  try {
    corpo();
  } finally {
    for (const chave of CHAVES_DE_PRICE) {
      if (original[chave] === undefined) delete process.env[chave];
      else process.env[chave] = original[chave];
    }
  }
}

test("priceIdDoPlano resolve cada plano pela sua própria variável", () => {
  comAmbiente(
    { STRIPE_PRICE_MENSAL: "price_mensal", STRIPE_PRICE_ANUAL: "price_anual" },
    () => {
      assert.equal(priceIdDoPlano("mensal"), "price_mensal");
      assert.equal(priceIdDoPlano("anual"), "price_anual");
    },
  );
});

test("priceIdDoPlano lê o ambiente a cada chamada, não no carregamento do módulo", () => {
  // Regra do CLAUDE.md: em Workers o ambiente pode não existir quando o módulo
  // é avaliado. Se a leitura tivesse sido içada para o topo do módulo, a
  // segunda asserção falharia.
  comAmbiente({ STRIPE_PRICE_MENSAL: "price_um" }, () => {
    assert.equal(priceIdDoPlano("mensal"), "price_um");
    process.env.STRIPE_PRICE_MENSAL = "price_dois";
    assert.equal(priceIdDoPlano("mensal"), "price_dois");
  });
});

test("STRIPE_PRICE_ID é fallback só do mensal", () => {
  comAmbiente({ STRIPE_PRICE_ID: "price_antigo" }, () => {
    assert.equal(priceIdDoPlano("mensal"), "price_antigo");
    assert.equal(priceIdDoPlano("anual"), null, "o anual nunca cai no price antigo");
  });
});

test("a variável específica tem precedência sobre o fallback antigo", () => {
  comAmbiente({ STRIPE_PRICE_MENSAL: "price_novo", STRIPE_PRICE_ID: "price_antigo" }, () => {
    assert.equal(priceIdDoPlano("mensal"), "price_novo");
  });
});

test("priceIdDoPlano devolve null quando o plano não está configurado", () => {
  comAmbiente({}, () => {
    assert.equal(priceIdDoPlano("mensal"), null);
    assert.equal(priceIdDoPlano("anual"), null);
  });

  // Variável presente e vazia conta como não configurada — senão a Stripe
  // receberia `price: ""` e o erro apareceria só no checkout do cliente.
  comAmbiente({ STRIPE_PRICE_MENSAL: "", STRIPE_PRICE_ANUAL: "" }, () => {
    assert.equal(priceIdDoPlano("mensal"), null);
    assert.equal(priceIdDoPlano("anual"), null);
  });
});

test("ehPlanoValido aceita apenas os dois slugs do contrato", () => {
  assert.equal(ehPlanoValido("mensal"), true);
  assert.equal(ehPlanoValido("anual"), true);
});

test("ehPlanoValido rejeita slug inventado, vazio, nulo e não-string", () => {
  const recusados = [
    "vitalicio",
    "",
    " mensal",
    "MENSAL",
    "Mensal",
    null,
    undefined,
    0,
    1,
    true,
    false,
    {},
    { plano: "mensal" },
    ["mensal"],
    Symbol("mensal"),
    () => "mensal",
  ];

  for (const valor of recusados) {
    assert.equal(
      ehPlanoValido(valor),
      false,
      `ehPlanoValido(${String(valor)}) deveria ser false`,
    );
  }
});

test(
  "ehPlanoValido rejeita chaves herdadas do protótipo de Object",
  () => {
    // `"constructor" in PLANOS` é true pela cadeia de protótipos. Com o `in`
    // antigo, `ehPlanoValido("constructor")` devolvia true e o checkout
    // respondia 503 nao_configurado no lugar do 400 plano_invalido que o
    // contrato promete. `app/lib/planos.ts` usa `Object.hasOwn` desde a
    // integração — este teste é o que impede a regressão.
    for (const chave of ["constructor", "toString", "valueOf", "__proto__", "hasOwnProperty"]) {
      assert.equal(ehPlanoValido(chave), false, `ehPlanoValido("${chave}") deveria ser false`);
    }
  },
);

// -----------------------------------------------------------------------------
// 5 · planoDoPriceId — caminho inverso
// -----------------------------------------------------------------------------

test("planoDoPriceId faz o caminho inverso de priceIdDoPlano", () => {
  comAmbiente(
    { STRIPE_PRICE_MENSAL: "price_mensal", STRIPE_PRICE_ANUAL: "price_anual" },
    () => {
      assert.equal(planoDoPriceId("price_mensal"), "mensal");
      assert.equal(planoDoPriceId("price_anual"), "anual");

      // Ida e volta para os dois slugs.
      for (const slug of ["mensal", "anual"]) {
        assert.equal(planoDoPriceId(priceIdDoPlano(slug)), slug);
      }
    },
  );
});

test("planoDoPriceId devolve null para price desconhecido, vazio ou ausente", () => {
  comAmbiente(
    { STRIPE_PRICE_MENSAL: "price_mensal", STRIPE_PRICE_ANUAL: "price_anual" },
    () => {
      for (const valor of ["price_de_outra_conta", "price_", "", null, undefined]) {
        assert.equal(
          planoDoPriceId(valor),
          null,
          `planoDoPriceId(${JSON.stringify(valor)}) deveria ser null`,
        );
      }
    },
  );
});

test("planoDoPriceId devolve null quando nenhum price está configurado", () => {
  // Ambiente vazio: `priceIdDoPlano` devolve null para os dois slugs. O
  // inverso não pode casar null com null e responder "mensal".
  comAmbiente({}, () => {
    assert.equal(planoDoPriceId(null), null);
    assert.equal(planoDoPriceId(undefined), null);
    assert.equal(planoDoPriceId("price_qualquer"), null);
  });
});

test("planoDoPriceId respeita o fallback STRIPE_PRICE_ID no mensal", () => {
  comAmbiente({ STRIPE_PRICE_ID: "price_antigo" }, () => {
    assert.equal(planoDoPriceId("price_antigo"), "mensal");
  });
});
