// Tabelas do D1. Ver docs/contrato.md.
//
// O estado da assinatura NÃO vive aqui — ele vive no metadata do usuário no
// Clerk, que é a fonte de verdade (app/lib/sessao.ts). O banco guarda apenas
// duas coisas de apoio ao webhook:
//
//   eventos_stripe   -> livro-razão de idempotência, para não processar o mesmo
//                       evento duas vezes quando a Stripe reenvia
//   clientes_stripe  -> busca reversa customer -> usuário, para eventos de
//                       assinatura que chegam sem o id do usuário no metadata
//
// As duas são otimizações de robustez. O webhook funciona sem o banco (ver
// app/lib/eventos.ts): ele cai para a guarda por `event.created` e para a busca
// do customer na própria Stripe. Isso é deliberado — um binding de D1 ausente
// em produção não pode significar pagamento não creditado.

import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const eventosStripe = sqliteTable("eventos_stripe", {
  /** `event.id` da Stripe. Chave primária: a segunda inserção falha, e é isso que queremos. */
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(),
  /** Epoch em milissegundos. */
  recebidoEm: integer("recebido_em").notNull(),
});

export const clientesStripe = sqliteTable("clientes_stripe", {
  stripeCustomerId: text("stripe_customer_id").primaryKey(),
  /** Id do usuário no Clerk. */
  uid: text("uid").notNull(),
  /** Epoch em milissegundos. */
  criadoEm: integer("criado_em").notNull(),
});

export const formacoes = sqliteTable(
  "formacoes",
  {
    slug: text("slug").primaryKey(),
    categoria: text("categoria").notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    resultado: text("resultado").notNull(),
    duracao: text("duracao").notNull(),
    capaUrl: text("capa_url").notNull(),
    nivel: text("nivel").notNull(),
    ordem: integer("ordem").notNull(),
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(true),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [index("idx_formacoes_publicado_ordem").on(tabela.publicado, tabela.ordem)],
);

export const aulas = sqliteTable(
  "aulas",
  {
    id: text("id").primaryKey(),
    formacaoSlug: text("formacao_slug").notNull(),
    numero: integer("numero").notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao"),
    duracaoSegundos: integer("duracao_segundos"),
    youtubeVideoId: text("youtube_video_id"),
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(true),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [index("idx_aulas_formacao_numero").on(tabela.formacaoSlug, tabela.numero)],
);

export const materiais = sqliteTable(
  "materiais",
  {
    slug: text("slug").primaryKey(),
    tipo: text("tipo").notNull(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    meta: text("meta").notNull(),
    ordem: integer("ordem").notNull(),
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(true),
    objetoR2: text("objeto_r2"),
    nomeArquivo: text("nome_arquivo"),
    mimeType: text("mime_type"),
    tamanhoBytes: integer("tamanho_bytes"),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [index("idx_materiais_publicado_ordem").on(tabela.publicado, tabela.ordem)],
);

export const progressoAulas = sqliteTable(
  "progresso_aulas",
  {
    usuarioId: text("usuario_id").notNull(),
    aulaId: text("aula_id").notNull(),
    posicaoSegundos: integer("posicao_segundos").notNull().default(0),
    duracaoSegundos: integer("duracao_segundos").notNull().default(0),
    concluida: integer("concluida", { mode: "boolean" }).notNull().default(false),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [
    primaryKey({ columns: [tabela.usuarioId, tabela.aulaId] }),
    index("idx_progresso_usuario_atualizado").on(tabela.usuarioId, tabela.atualizadoEm),
  ],
);
