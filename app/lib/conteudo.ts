import { env } from "cloudflare:workers";

import {
  formacoes as formacoesIniciais,
  materiais as materiaisIniciais,
  type Formacao as FormacaoInicial,
} from "../dados-comunidade";

export type AulaConteudo = {
  id: string;
  formacaoSlug: string;
  numero: number;
  titulo: string;
  descricao: string | null;
  duracaoSegundos: number | null;
  youtubeVideoId: string | null;
  publicado: boolean;
};

export type FormacaoConteudo = Omit<FormacaoInicial, "lessonTitles" | "lessons" | "progress"> & {
  ordem: number;
  publicado: boolean;
  aulas: AulaConteudo[];
  lessonTitles: string[];
  lessons: number;
  progress: number;
};

export type MaterialConteudo = {
  slug: string;
  type: string;
  title: string;
  description: string;
  meta: string;
  ordem: number;
  publicado: boolean;
  objetoR2: string | null;
  nomeArquivo: string | null;
  mimeType: string | null;
  tamanhoBytes: number | null;
};

export type ProgressoAula = {
  aulaId: string;
  posicaoSegundos: number;
  duracaoSegundos: number;
  concluida: boolean;
  atualizadoEm: number;
};

type FormacaoRow = {
  slug: string;
  categoria: string;
  titulo: string;
  descricao: string;
  resultado: string;
  duracao: string;
  capa_url: string;
  nivel: string;
  ordem: number;
  publicado: number;
};

type AulaRow = {
  id: string;
  formacao_slug: string;
  numero: number;
  titulo: string;
  descricao: string | null;
  duracao_segundos: number | null;
  youtube_video_id: string | null;
  publicado: number;
};

type MaterialRow = {
  slug: string;
  tipo: string;
  titulo: string;
  descricao: string;
  meta: string;
  ordem: number;
  publicado: number;
  objeto_r2: string | null;
  nome_arquivo: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
};

let inicializacao: Promise<void> | null = null;

function banco(): D1Database | null {
  return env.DB ?? null;
}

function aulaId(formacaoSlug: string, numero: number) {
  return `${formacaoSlug}:${numero}`;
}

function formacaoDeFallback(formacao: FormacaoInicial, ordem: number): FormacaoConteudo {
  const aulas = formacao.lessonTitles.map((titulo, indice) => ({
    id: aulaId(formacao.slug, indice + 1),
    formacaoSlug: formacao.slug,
    numero: indice + 1,
    titulo,
    descricao: null,
    duracaoSegundos: null,
    youtubeVideoId: null,
    publicado: true,
  }));

  return { ...formacao, ordem, publicado: true, aulas };
}

function materialDeFallback(
  material: (typeof materiaisIniciais)[number],
  ordem: number,
): MaterialConteudo {
  return {
    ...material,
    ordem,
    publicado: true,
    objetoR2: null,
    nomeArquivo: null,
    mimeType: null,
    tamanhoBytes: null,
  };
}

function mapearAula(row: AulaRow): AulaConteudo {
  return {
    id: row.id,
    formacaoSlug: row.formacao_slug,
    numero: row.numero,
    titulo: row.titulo,
    descricao: row.descricao,
    duracaoSegundos: row.duracao_segundos,
    youtubeVideoId: row.youtube_video_id,
    publicado: row.publicado === 1,
  };
}

function mapearFormacao(row: FormacaoRow, aulas: AulaConteudo[]): FormacaoConteudo {
  return {
    slug: row.slug,
    category: row.categoria,
    title: row.titulo,
    description: row.descricao,
    outcome: row.resultado,
    duration: row.duracao,
    cover: row.capa_url,
    level: row.nivel,
    ordem: row.ordem,
    publicado: row.publicado === 1,
    aulas,
    lessonTitles: aulas.map((aula) => aula.titulo),
    lessons: aulas.length,
    progress: 0,
  };
}

function mapearMaterial(row: MaterialRow): MaterialConteudo {
  return {
    slug: row.slug,
    type: row.tipo,
    title: row.titulo,
    description: row.descricao,
    meta: row.meta,
    ordem: row.ordem,
    publicado: row.publicado === 1,
    objetoR2: row.objeto_r2,
    nomeArquivo: row.nome_arquivo,
    mimeType: row.mime_type,
    tamanhoBytes: row.tamanho_bytes,
  };
}

async function criarEstrutura(db: D1Database) {
  const consultas = [
    `CREATE TABLE IF NOT EXISTS formacoes (
      slug TEXT PRIMARY KEY NOT NULL,
      categoria TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      resultado TEXT NOT NULL,
      duracao TEXT NOT NULL,
      capa_url TEXT NOT NULL,
      nivel TEXT NOT NULL,
      ordem INTEGER NOT NULL,
      publicado INTEGER DEFAULT 1 NOT NULL,
      atualizado_em INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS aulas (
      id TEXT PRIMARY KEY NOT NULL,
      formacao_slug TEXT NOT NULL,
      numero INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      duracao_segundos INTEGER,
      youtube_video_id TEXT,
      publicado INTEGER DEFAULT 1 NOT NULL,
      atualizado_em INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS materiais (
      slug TEXT PRIMARY KEY NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      meta TEXT NOT NULL,
      ordem INTEGER NOT NULL,
      publicado INTEGER DEFAULT 1 NOT NULL,
      objeto_r2 TEXT,
      nome_arquivo TEXT,
      mime_type TEXT,
      tamanho_bytes INTEGER,
      atualizado_em INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS progresso_aulas (
      usuario_id TEXT NOT NULL,
      aula_id TEXT NOT NULL,
      posicao_segundos INTEGER DEFAULT 0 NOT NULL,
      duracao_segundos INTEGER DEFAULT 0 NOT NULL,
      concluida INTEGER DEFAULT 0 NOT NULL,
      atualizado_em INTEGER NOT NULL,
      PRIMARY KEY (usuario_id, aula_id)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_formacoes_publicado_ordem ON formacoes (publicado, ordem)",
    "CREATE INDEX IF NOT EXISTS idx_aulas_formacao_numero ON aulas (formacao_slug, numero)",
    "CREATE INDEX IF NOT EXISTS idx_materiais_publicado_ordem ON materiais (publicado, ordem)",
    "CREATE INDEX IF NOT EXISTS idx_progresso_usuario_atualizado ON progresso_aulas (usuario_id, atualizado_em)",
  ];

  await db.batch(consultas.map((consulta) => db.prepare(consulta)));
}

async function semearConteudo(db: D1Database) {
  const agora = Date.now();
  const statements: D1PreparedStatement[] = [];

  formacoesIniciais.forEach((formacao, indice) => {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO formacoes
          (slug, categoria, titulo, descricao, resultado, duracao, capa_url, nivel, ordem, publicado, atualizado_em)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(
          formacao.slug,
          formacao.category,
          formacao.title,
          formacao.description,
          formacao.outcome,
          formacao.duration,
          formacao.cover,
          formacao.level,
          indice + 1,
          agora,
        ),
    );

    formacao.lessonTitles.forEach((titulo, aulaIndice) => {
      const numero = aulaIndice + 1;
      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO aulas
            (id, formacao_slug, numero, titulo, publicado, atualizado_em)
            VALUES (?, ?, ?, ?, 1, ?)`,
          )
          .bind(aulaId(formacao.slug, numero), formacao.slug, numero, titulo, agora),
      );
    });
  });

  materiaisIniciais.forEach((material, indice) => {
    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO materiais
          (slug, tipo, titulo, descricao, meta, ordem, publicado, atualizado_em)
          VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        )
        .bind(
          material.slug,
          material.type,
          material.title,
          material.description,
          material.meta,
          indice + 1,
          agora,
        ),
    );
  });

  for (let indice = 0; indice < statements.length; indice += 60) {
    await db.batch(statements.slice(indice, indice + 60));
  }
}

export async function garantirConteudo() {
  const db = banco();
  if (!db) return;
  if (!inicializacao) {
    inicializacao = (async () => {
      await criarEstrutura(db);
      await semearConteudo(db);
    })().catch((erro) => {
      inicializacao = null;
      throw erro;
    });
  }
  await inicializacao;
}

export async function listarFormacoes(options?: { incluirRascunhos?: boolean }) {
  const db = banco();
  if (!db) return formacoesIniciais.map(formacaoDeFallback);

  try {
    await garantirConteudo();
    const filtro = options?.incluirRascunhos ? "" : "WHERE publicado = 1";
    const resultado = await db
      .prepare(`SELECT * FROM formacoes ${filtro} ORDER BY ordem, titulo`)
      .all<FormacaoRow>();
    const aulasResultado = await db
      .prepare(
        `SELECT * FROM aulas ${options?.incluirRascunhos ? "" : "WHERE publicado = 1"}
         ORDER BY formacao_slug, numero`,
      )
      .all<AulaRow>();
    const aulasPorFormacao = new Map<string, AulaConteudo[]>();
    aulasResultado.results.forEach((row) => {
      const lista = aulasPorFormacao.get(row.formacao_slug) ?? [];
      lista.push(mapearAula(row));
      aulasPorFormacao.set(row.formacao_slug, lista);
    });
    return resultado.results.map((row) => mapearFormacao(row, aulasPorFormacao.get(row.slug) ?? []));
  } catch {
    return formacoesIniciais.map(formacaoDeFallback);
  }
}

export async function obterFormacao(slug: string, options?: { incluirRascunhos?: boolean }) {
  const formacoes = await listarFormacoes(options);
  return formacoes.find((formacao) => formacao.slug === slug) ?? null;
}

export async function listarMateriais(options?: { incluirRascunhos?: boolean }) {
  const db = banco();
  if (!db) return materiaisIniciais.map(materialDeFallback);

  try {
    await garantirConteudo();
    const filtro = options?.incluirRascunhos ? "" : "WHERE publicado = 1";
    const resultado = await db
      .prepare(`SELECT * FROM materiais ${filtro} ORDER BY ordem, titulo`)
      .all<MaterialRow>();
    return resultado.results.map(mapearMaterial);
  } catch {
    return materiaisIniciais.map(materialDeFallback);
  }
}

export async function obterMaterial(slug: string, options?: { incluirRascunhos?: boolean }) {
  const materiais = await listarMateriais(options);
  return materiais.find((material) => material.slug === slug) ?? null;
}

export async function atualizarVideoAula(aula: AulaConteudo, youtubeVideoId: string | null) {
  const db = banco();
  if (!db) throw new Error("banco_indisponivel");
  await garantirConteudo();
  await db
    .prepare("UPDATE aulas SET youtube_video_id = ?, atualizado_em = ? WHERE id = ?")
    .bind(youtubeVideoId, Date.now(), aula.id)
    .run();
}

export async function vincularArquivoMaterial(
  slug: string,
  arquivo: { objetoR2: string; nomeArquivo: string; mimeType: string; tamanhoBytes: number },
) {
  const db = banco();
  if (!db) throw new Error("banco_indisponivel");
  await garantirConteudo();
  await db
    .prepare(
      `UPDATE materiais
       SET objeto_r2 = ?, nome_arquivo = ?, mime_type = ?, tamanho_bytes = ?, atualizado_em = ?
       WHERE slug = ?`,
    )
    .bind(
      arquivo.objetoR2,
      arquivo.nomeArquivo,
      arquivo.mimeType,
      arquivo.tamanhoBytes,
      Date.now(),
      slug,
    )
    .run();
}

export async function removerArquivoMaterial(slug: string) {
  const db = banco();
  if (!db) throw new Error("banco_indisponivel");
  await garantirConteudo();
  await db
    .prepare(
      `UPDATE materiais
       SET objeto_r2 = NULL, nome_arquivo = NULL, mime_type = NULL, tamanho_bytes = NULL, atualizado_em = ?
       WHERE slug = ?`,
    )
    .bind(Date.now(), slug)
    .run();
}

export async function obterProgresso(usuarioId: string, aulaIdBuscada: string) {
  const db = banco();
  if (!db) return null;
  await garantirConteudo();
  const row = await db
    .prepare(
      `SELECT aula_id, posicao_segundos, duracao_segundos, concluida, atualizado_em
       FROM progresso_aulas WHERE usuario_id = ? AND aula_id = ?`,
    )
    .bind(usuarioId, aulaIdBuscada)
    .first<{
      aula_id: string;
      posicao_segundos: number;
      duracao_segundos: number;
      concluida: number;
      atualizado_em: number;
    }>();
  if (!row) return null;
  return {
    aulaId: row.aula_id,
    posicaoSegundos: row.posicao_segundos,
    duracaoSegundos: row.duracao_segundos,
    concluida: row.concluida === 1,
    atualizadoEm: row.atualizado_em,
  } satisfies ProgressoAula;
}

export async function salvarProgresso(
  usuarioId: string,
  dados: { aulaId: string; posicaoSegundos: number; duracaoSegundos: number; concluida: boolean },
) {
  const db = banco();
  if (!db) throw new Error("banco_indisponivel");
  await garantirConteudo();
  await db
    .prepare(
      `INSERT INTO progresso_aulas
       (usuario_id, aula_id, posicao_segundos, duracao_segundos, concluida, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (usuario_id, aula_id) DO UPDATE SET
         posicao_segundos = excluded.posicao_segundos,
         duracao_segundos = MAX(progresso_aulas.duracao_segundos, excluded.duracao_segundos),
         concluida = MAX(progresso_aulas.concluida, excluded.concluida),
         atualizado_em = excluded.atualizado_em`,
    )
    .bind(
      usuarioId,
      dados.aulaId,
      Math.max(0, Math.round(dados.posicaoSegundos)),
      Math.max(0, Math.round(dados.duracaoSegundos)),
      dados.concluida ? 1 : 0,
      Date.now(),
    )
    .run();
}

export async function listarProgressoUsuario(usuarioId: string) {
  const db = banco();
  if (!db) return [];
  await garantirConteudo();
  const resultado = await db
    .prepare(
      `SELECT aula_id, posicao_segundos, duracao_segundos, concluida, atualizado_em
       FROM progresso_aulas WHERE usuario_id = ? ORDER BY atualizado_em DESC`,
    )
    .bind(usuarioId)
    .all<{
      aula_id: string;
      posicao_segundos: number;
      duracao_segundos: number;
      concluida: number;
      atualizado_em: number;
    }>();
  return resultado.results.map((row) => ({
    aulaId: row.aula_id,
    posicaoSegundos: row.posicao_segundos,
    duracaoSegundos: row.duracao_segundos,
    concluida: row.concluida === 1,
    atualizadoEm: row.atualizado_em,
  } satisfies ProgressoAula));
}

export function extrairYoutubeVideoId(valor: string) {
  const texto = valor.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(texto)) return texto;
  try {
    const url = new URL(texto);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)) {
      const partes = url.pathname.split("/").filter(Boolean);
      const id = url.searchParams.get("v") ?? (partes[0] === "embed" || partes[0] === "shorts" ? partes[1] : null);
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}
