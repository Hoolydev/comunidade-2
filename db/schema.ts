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

export const perfis = sqliteTable(
  "perfis",
  {
    usuarioId: text("usuario_id").primaryKey(),
    nome: text("nome").notNull(),
    email: text("email"),
    cargo: text("cargo").notNull().default("Membro Hágios"),
    foco: text("foco").notNull().default("Implementação de IA"),
    cidade: text("cidade").notNull().default("Brasil"),
    bio: text("bio").notNull().default(""),
    fotoUrl: text("foto_url"),
    visivel: integer("visivel", { mode: "boolean" }).notNull().default(true),
    criadoEm: integer("criado_em").notNull(),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [index("idx_perfis_visivel_nome").on(tabela.visivel, tabela.nome)],
);

export const publicacoes = sqliteTable(
  "publicacoes",
  {
    id: text("id").primaryKey(),
    autorId: text("autor_id").notNull(),
    categoria: text("categoria").notNull().default("Implementação"),
    titulo: text("titulo").notNull(),
    conteudo: text("conteudo").notNull(),
    criadoEm: integer("criado_em").notNull(),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [index("idx_publicacoes_criado_em").on(tabela.criadoEm)],
);

export const comentarios = sqliteTable(
  "comentarios",
  {
    id: text("id").primaryKey(),
    publicacaoId: text("publicacao_id").notNull(),
    autorId: text("autor_id").notNull(),
    conteudo: text("conteudo").notNull(),
    criadoEm: integer("criado_em").notNull(),
  },
  (tabela) => [index("idx_comentarios_publicacao_criado").on(tabela.publicacaoId, tabela.criadoEm)],
);

export const interacoesPublicacao = sqliteTable(
  "interacoes_publicacao",
  {
    publicacaoId: text("publicacao_id").notNull(),
    usuarioId: text("usuario_id").notNull(),
    curtiu: integer("curtiu", { mode: "boolean" }).notNull().default(false),
    salvou: integer("salvou", { mode: "boolean" }).notNull().default(false),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [
    primaryKey({ columns: [tabela.publicacaoId, tabela.usuarioId] }),
    index("idx_interacoes_usuario").on(tabela.usuarioId, tabela.atualizadoEm),
  ],
);

export const projetosMembros = sqliteTable(
  "projetos_membros",
  {
    id: text("id").primaryKey(),
    usuarioId: text("usuario_id").notNull(),
    titulo: text("titulo").notNull(),
    area: text("area").notNull(),
    status: text("status").notNull().default("Planejamento"),
    progresso: integer("progresso").notNull().default(0),
    proximaAcao: text("proxima_acao").notNull().default("Definir próximo passo"),
    criadoEm: integer("criado_em").notNull(),
    atualizadoEm: integer("atualizado_em").notNull(),
  },
  (tabela) => [index("idx_projetos_usuario_atualizado").on(tabela.usuarioId, tabela.atualizadoEm)],
);

export const eventosComunidade = sqliteTable(
  "eventos_comunidade",
  {
    id: text("id").primaryKey(),
    titulo: text("titulo").notNull(),
    descricao: text("descricao").notNull(),
    anfitriao: text("anfitriao").notNull(),
    tipo: text("tipo").notNull(),
    inicioEm: integer("inicio_em").notNull(),
    duracaoMinutos: integer("duracao_minutos").notNull().default(60),
    urlAoVivo: text("url_ao_vivo"),
    youtubeReplayId: text("youtube_replay_id"),
    publicado: integer("publicado", { mode: "boolean" }).notNull().default(true),
    criadoEm: integer("criado_em").notNull(),
  },
  (tabela) => [index("idx_eventos_publicado_inicio").on(tabela.publicado, tabela.inicioEm)],
);

export const presencasEventos = sqliteTable(
  "presencas_eventos",
  {
    eventoId: text("evento_id").notNull(),
    usuarioId: text("usuario_id").notNull(),
    criadoEm: integer("criado_em").notNull(),
  },
  (tabela) => [primaryKey({ columns: [tabela.eventoId, tabela.usuarioId] })],
);

export const notificacoes = sqliteTable(
  "notificacoes",
  {
    id: text("id").primaryKey(),
    usuarioId: text("usuario_id"),
    titulo: text("titulo").notNull(),
    mensagem: text("mensagem").notNull(),
    href: text("href").notNull().default("/inicio"),
    criadoEm: integer("criado_em").notNull(),
  },
  (tabela) => [index("idx_notificacoes_usuario_criado").on(tabela.usuarioId, tabela.criadoEm)],
);

export const notificacoesLidas = sqliteTable(
  "notificacoes_lidas",
  {
    notificacaoId: text("notificacao_id").notNull(),
    usuarioId: text("usuario_id").notNull(),
    lidaEm: integer("lida_em").notNull(),
  },
  (tabela) => [primaryKey({ columns: [tabela.notificacaoId, tabela.usuarioId] })],
);

export const candidaturas = sqliteTable(
  "candidaturas",
  {
    oportunidadeId: text("oportunidade_id").notNull(),
    usuarioId: text("usuario_id").notNull(),
    mensagem: text("mensagem").notNull().default("Tenho interesse em conversar sobre esta oportunidade."),
    status: text("status").notNull().default("enviada"),
    criadoEm: integer("criado_em").notNull(),
  },
  (tabela) => [primaryKey({ columns: [tabela.oportunidadeId, tabela.usuarioId] })],
);

export const conversasAgentes = sqliteTable(
  "conversas_agentes",
  {
    id: text("id").primaryKey(),
    usuarioId: text("usuario_id").notNull(),
    agente: text("agente").notNull(),
    papel: text("papel").notNull(),
    conteudo: text("conteudo").notNull(),
    criadoEm: integer("criado_em").notNull(),
  },
  (tabela) => [index("idx_conversas_usuario_agente").on(tabela.usuarioId, tabela.agente, tabela.criadoEm)],
);
