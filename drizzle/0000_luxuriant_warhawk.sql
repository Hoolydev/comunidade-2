CREATE TABLE IF NOT EXISTS `aulas` (
	`id` text PRIMARY KEY NOT NULL,
	`formacao_slug` text NOT NULL,
	`numero` integer NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`duracao_segundos` integer,
	`youtube_video_id` text,
	`publicado` integer DEFAULT true NOT NULL,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_aulas_formacao_numero` ON `aulas` (`formacao_slug`,`numero`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `clientes_stripe` (
	`stripe_customer_id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `eventos_stripe` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`recebido_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `formacoes` (
	`slug` text PRIMARY KEY NOT NULL,
	`categoria` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`resultado` text NOT NULL,
	`duracao` text NOT NULL,
	`capa_url` text NOT NULL,
	`nivel` text NOT NULL,
	`ordem` integer NOT NULL,
	`publicado` integer DEFAULT true NOT NULL,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_formacoes_publicado_ordem` ON `formacoes` (`publicado`,`ordem`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `materiais` (
	`slug` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`meta` text NOT NULL,
	`ordem` integer NOT NULL,
	`publicado` integer DEFAULT true NOT NULL,
	`objeto_r2` text,
	`nome_arquivo` text,
	`mime_type` text,
	`tamanho_bytes` integer,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_materiais_publicado_ordem` ON `materiais` (`publicado`,`ordem`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `progresso_aulas` (
	`usuario_id` text NOT NULL,
	`aula_id` text NOT NULL,
	`posicao_segundos` integer DEFAULT 0 NOT NULL,
	`duracao_segundos` integer DEFAULT 0 NOT NULL,
	`concluida` integer DEFAULT false NOT NULL,
	`atualizado_em` integer NOT NULL,
	PRIMARY KEY(`usuario_id`, `aula_id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_progresso_usuario_atualizado` ON `progresso_aulas` (`usuario_id`,`atualizado_em`);
