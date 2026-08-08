// Declarações mínimas do runtime do Cloudflare Workers.
//
// Não usamos `@cloudflare/workers-types` inteiro de propósito: aquele pacote
// substitui os globais de DOM (`Request`, `Response`, `fetch`) pelas versões do
// workerd, o que conflita com os tipos do Next e do React neste mesmo projeto.
// Aqui declaramos só o que o nosso código realmente toca.

interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
  error?: string;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
  dump(): Promise<ArrayBuffer>;
}

interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

declare module "cloudflare:workers" {
  /**
   * Bindings do Worker. `DB` é opcional porque o binding só existe quando o
   * control plane o provisiona — ver docs/handoff/duvidas.md, D-05.
   */
  export const env: {
    DB?: D1Database;
    ASSETS?: Fetcher;
    [chave: string]: unknown;
  };
}
