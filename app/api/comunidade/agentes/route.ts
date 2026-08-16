import { env } from "cloudflare:workers";

import {
  autorizarComunidade,
  bancoComunidade,
  respostaErro,
  textoLimitado,
} from "../../../lib/membro-comunidade";

export const runtime = "nodejs";

const instrucoes: Record<string, string> = {
  "estrategista-ofertas": "Você estrutura posicionamento, promessa, entregáveis, preço, prova e objeções de ofertas de negócios.",
  "arquiteto-automacoes": "Você mapeia processos, identifica gargalos e desenha automações seguras com entradas, regras, saídas e intervenção humana.",
  "analista-conteudo": "Você cria direção editorial conectada a objetivos comerciais, público, distribuição e métricas.",
  "revisor-agentes": "Você revisa agentes de IA: instruções, conhecimento, ferramentas, limites, testes, escalonamento humano e observabilidade.",
};

type AiBinding = {
  run(
    modelo: string,
    entrada: { messages: { role: "system" | "user" | "assistant"; content: string }[]; max_tokens: number; temperature: number },
  ): Promise<{ response?: string }>;
};

type MensagemRow = { id: string; papel: "user" | "assistant"; conteudo: string; criado_em: number };

export async function GET(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const agente = textoLimitado(new URL(request.url).searchParams.get("agente"), 50);
  if (!instrucoes[agente]) return Response.json({ erro: "agente_invalido" }, { status: 400 });
  try {
    const resultado = await bancoComunidade()
      .prepare(
        `SELECT id, papel, conteudo, criado_em FROM conversas_agentes
         WHERE usuario_id = ? AND agente = ? ORDER BY criado_em ASC LIMIT 50`,
      )
      .bind(membro.uid, agente)
      .all<MensagemRow>();
    return Response.json({ mensagens: resultado.results.map((item) => ({ id: item.id, papel: item.papel, conteudo: item.conteudo, criadoEm: item.criado_em })) });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function POST(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const corpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const agente = textoLimitado(corpo?.agente, 50);
  const mensagem = textoLimitado(corpo?.mensagem, 3000);
  if (!instrucoes[agente] || mensagem.length < 2) return Response.json({ erro: "dados_invalidos" }, { status: 400 });
  const ai = env.AI as AiBinding | undefined;
  if (!ai) return Response.json({ erro: "ia_nao_configurada" }, { status: 503 });

  try {
    const db = bancoComunidade();
    const historico = await db
      .prepare(
        `SELECT id, papel, conteudo, criado_em FROM conversas_agentes
         WHERE usuario_id = ? AND agente = ? ORDER BY criado_em DESC LIMIT 16`,
      )
      .bind(membro.uid, agente)
      .all<MensagemRow>();
    const mensagens = historico.results.reverse().map((item) => ({ role: item.papel, content: item.conteudo }));
    const resultado = await ai.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      messages: [
        {
          role: "system",
          content: `${instrucoes[agente]} Responda sempre em português do Brasil. Seja direto, estratégico e orientado à implementação. Faça no máximo três perguntas quando faltarem dados. Quando houver dados suficientes, entregue próximos passos numerados, responsáveis sugeridos e uma métrica. Não invente números, integrações ou garantias. Não solicite senhas, chaves ou dados pessoais sensíveis.`,
        },
        ...mensagens,
        { role: "user", content: mensagem },
      ],
      max_tokens: 850,
      temperature: 0.35,
    });
    const resposta = textoLimitado(resultado.response, 6000);
    if (!resposta) throw new Error("resposta_vazia");
    const agora = Date.now();
    await db.batch([
      db
        .prepare("INSERT INTO conversas_agentes (id, usuario_id, agente, papel, conteudo, criado_em) VALUES (?, ?, ?, 'user', ?, ?)")
        .bind(crypto.randomUUID(), membro.uid, agente, mensagem, agora),
      db
        .prepare("INSERT INTO conversas_agentes (id, usuario_id, agente, papel, conteudo, criado_em) VALUES (?, ?, ?, 'assistant', ?, ?)")
        .bind(crypto.randomUUID(), membro.uid, agente, resposta, agora + 1),
    ]);
    return Response.json({ resposta });
  } catch (erro) {
    return respostaErro(erro);
  }
}

export async function DELETE(request: Request) {
  const membro = await autorizarComunidade(request);
  if (!membro) return Response.json({ erro: "nao_autorizado" }, { status: 403 });
  const agente = textoLimitado(new URL(request.url).searchParams.get("agente"), 50);
  if (!instrucoes[agente]) return Response.json({ erro: "agente_invalido" }, { status: 400 });
  try {
    await bancoComunidade()
      .prepare("DELETE FROM conversas_agentes WHERE usuario_id = ? AND agente = ?")
      .bind(membro.uid, agente)
      .run();
    return Response.json({ removido: true });
  } catch (erro) {
    return respostaErro(erro);
  }
}
