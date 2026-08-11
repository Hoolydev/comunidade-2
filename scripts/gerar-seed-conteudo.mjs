import { writeFile } from "node:fs/promises";

import { formacoes, materiais } from "../app/dados-comunidade.ts";

const sql = (valor) => `'${String(valor).replaceAll("'", "''")}'`;
const linhas = [
  "-- Conteúdo inicial do Movimento Hágios. Pode ser reaplicado com segurança.",
];

formacoes.forEach((formacao, indice) => {
  linhas.push(
    `INSERT OR IGNORE INTO formacoes (slug, categoria, titulo, descricao, resultado, duracao, capa_url, nivel, ordem, publicado, atualizado_em) VALUES (${[
      formacao.slug,
      formacao.category,
      formacao.title,
      formacao.description,
      formacao.outcome,
      formacao.duration,
      formacao.cover,
      formacao.level,
    ].map(sql).join(", ")}, ${indice + 1}, 1, 0);`,
  );

  formacao.lessonTitles.forEach((titulo, aulaIndice) => {
    const numero = aulaIndice + 1;
    linhas.push(
      `INSERT OR IGNORE INTO aulas (id, formacao_slug, numero, titulo, publicado, atualizado_em) VALUES (${sql(`${formacao.slug}:${numero}`)}, ${sql(formacao.slug)}, ${numero}, ${sql(titulo)}, 1, 0);`,
    );
  });
});

materiais.forEach((material, indice) => {
  linhas.push(
    `INSERT OR IGNORE INTO materiais (slug, tipo, titulo, descricao, meta, ordem, publicado, atualizado_em) VALUES (${[
      material.slug,
      material.type,
      material.title,
      material.description,
      material.meta,
    ].map(sql).join(", ")}, ${indice + 1}, 1, 0);`,
  );
});

linhas.push("PRAGMA optimize;");
await writeFile(new URL("../drizzle/0001_seed_conteudo.sql", import.meta.url), `${linhas.join("\n")}\n`);
