CREATE TABLE `candidaturas` (
	`oportunidade_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`mensagem` text DEFAULT 'Tenho interesse em conversar sobre esta oportunidade.' NOT NULL,
	`status` text DEFAULT 'enviada' NOT NULL,
	`criado_em` integer NOT NULL,
	PRIMARY KEY(`oportunidade_id`, `usuario_id`)
);
--> statement-breakpoint
CREATE TABLE `comentarios` (
	`id` text PRIMARY KEY NOT NULL,
	`publicacao_id` text NOT NULL,
	`autor_id` text NOT NULL,
	`conteudo` text NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_comentarios_publicacao_criado` ON `comentarios` (`publicacao_id`,`criado_em`);--> statement-breakpoint
CREATE TABLE `conversas_agentes` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`agente` text NOT NULL,
	`papel` text NOT NULL,
	`conteudo` text NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_conversas_usuario_agente` ON `conversas_agentes` (`usuario_id`,`agente`,`criado_em`);--> statement-breakpoint
CREATE TABLE `eventos_comunidade` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`anfitriao` text NOT NULL,
	`tipo` text NOT NULL,
	`inicio_em` integer NOT NULL,
	`duracao_minutos` integer DEFAULT 60 NOT NULL,
	`url_ao_vivo` text,
	`youtube_replay_id` text,
	`publicado` integer DEFAULT true NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_eventos_publicado_inicio` ON `eventos_comunidade` (`publicado`,`inicio_em`);--> statement-breakpoint
CREATE TABLE `interacoes_publicacao` (
	`publicacao_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`curtiu` integer DEFAULT false NOT NULL,
	`salvou` integer DEFAULT false NOT NULL,
	`atualizado_em` integer NOT NULL,
	PRIMARY KEY(`publicacao_id`, `usuario_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_interacoes_usuario` ON `interacoes_publicacao` (`usuario_id`,`atualizado_em`);--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text,
	`titulo` text NOT NULL,
	`mensagem` text NOT NULL,
	`href` text DEFAULT '/inicio' NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notificacoes_usuario_criado` ON `notificacoes` (`usuario_id`,`criado_em`);--> statement-breakpoint
CREATE TABLE `notificacoes_lidas` (
	`notificacao_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`lida_em` integer NOT NULL,
	PRIMARY KEY(`notificacao_id`, `usuario_id`)
);
--> statement-breakpoint
CREATE TABLE `perfis` (
	`usuario_id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text,
	`cargo` text DEFAULT 'Membro Hágios' NOT NULL,
	`foco` text DEFAULT 'Implementação de IA' NOT NULL,
	`cidade` text DEFAULT 'Brasil' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`foto_url` text,
	`visivel` integer DEFAULT true NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_perfis_visivel_nome` ON `perfis` (`visivel`,`nome`);--> statement-breakpoint
CREATE TABLE `presencas_eventos` (
	`evento_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`criado_em` integer NOT NULL,
	PRIMARY KEY(`evento_id`, `usuario_id`)
);
--> statement-breakpoint
CREATE TABLE `projetos_membros` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`titulo` text NOT NULL,
	`area` text NOT NULL,
	`status` text DEFAULT 'Planejamento' NOT NULL,
	`progresso` integer DEFAULT 0 NOT NULL,
	`proxima_acao` text DEFAULT 'Definir próximo passo' NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_projetos_usuario_atualizado` ON `projetos_membros` (`usuario_id`,`atualizado_em`);--> statement-breakpoint
CREATE TABLE `publicacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`autor_id` text NOT NULL,
	`categoria` text DEFAULT 'Implementação' NOT NULL,
	`titulo` text NOT NULL,
	`conteudo` text NOT NULL,
	`criado_em` integer NOT NULL,
	`atualizado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_publicacoes_criado_em` ON `publicacoes` (`criado_em`);
--> statement-breakpoint
INSERT OR IGNORE INTO `perfis`
(`usuario_id`, `nome`, `email`, `cargo`, `foco`, `cidade`, `bio`, `foto_url`, `visivel`, `criado_em`, `atualizado_em`)
VALUES
('hagios-equipe', 'Equipe Hágios', NULL, 'Curadoria da comunidade', 'Direção de implementação', 'Brasil', 'Conteúdo, encontros e direção prática para os membros do Movimento Hágios.', NULL, 1, 1786816800000, 1786816800000),
('hagios-silfarney', 'Silfarney Oliveira', NULL, 'Fundador do Movimento Hágios', 'IA aplicada a negócios', 'Brasil', 'Direção estratégica e aplicação prática de inteligência artificial em empresas.', NULL, 1, 1786816800000, 1786816800000);
--> statement-breakpoint
INSERT OR IGNORE INTO `publicacoes`
(`id`, `autor_id`, `categoria`, `titulo`, `conteudo`, `criado_em`, `atualizado_em`)
VALUES
('post-boas-vindas', 'hagios-equipe', 'Atualização', 'O feed da Comunidade Hágios está aberto', 'Use este espaço para compartilhar uma implementação, pedir ajuda e registrar aprendizados que possam acelerar outros membros.', 1786816800000, 1786816800000),
('post-direcao-semana', 'hagios-silfarney', 'Direção', 'Comece pelo processo, não pela ferramenta', 'Escolha uma tarefa repetitiva, registre quanto tempo ela consome e descreva entrada, decisão e saída. A ferramenta vem depois do problema bem definido.', 1786816700000, 1786816700000);
--> statement-breakpoint
INSERT OR IGNORE INTO `eventos_comunidade`
(`id`, `titulo`, `descricao`, `anfitriao`, `tipo`, `inicio_em`, `duracao_minutos`, `url_ao_vivo`, `youtube_replay_id`, `publicado`, `criado_em`)
VALUES
('clinica-automacoes-2026-08-21', 'Construindo agentes que usam ferramentas', 'Aula prática sobre contexto, ferramentas, limites e transferência para o time humano.', 'Equipe Hágios', 'Aula especial', 1787351400000, 90, NULL, NULL, 1, 1786816800000),
('mesa-implementacao-2026-08-28', 'Mesa de implementação: cases dos membros', 'Encontro para revisar projetos em andamento e transformar bloqueios em próximas ações.', 'Comunidade Hágios', 'Encontro da comunidade', 1787950800000, 90, NULL, NULL, 1, 1786816800000);
--> statement-breakpoint
INSERT OR IGNORE INTO `notificacoes`
(`id`, `usuario_id`, `titulo`, `mensagem`, `href`, `criado_em`)
VALUES
('notificacao-perfil', NULL, 'Complete seu perfil', 'Conte sua atuação e o que você está implementando para criar conexões melhores.', '/membros', 1786816800000),
('notificacao-feed', NULL, 'Compartilhe sua primeira implementação', 'Registre um avanço, uma dúvida ou um aprendizado no feed da comunidade.', '/feed', 1786816700000),
('notificacao-agentes', NULL, 'Agentes especialistas disponíveis', 'Use um especialista Hágios para estruturar ofertas, automações, conteúdo ou revisar agentes.', '/agentes', 1786816600000);
--> statement-breakpoint
PRAGMA optimize;
