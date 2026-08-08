CREATE TABLE `clientes_stripe` (
	`stripe_customer_id` text PRIMARY KEY NOT NULL,
	`uid` text NOT NULL,
	`criado_em` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `eventos_stripe` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`recebido_em` integer NOT NULL
);
