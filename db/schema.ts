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

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
