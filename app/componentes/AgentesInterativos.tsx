"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { Send, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

const agentes = [
  { id: "estrategista-ofertas", codigo: "EO", nome: "Estrategista de ofertas", descricao: "Estruture posicionamento, promessa, entregáveis, preço e objeções para uma oferta mais forte.", cor: "violet", inicio: "Conte o que você vende, para quem e qual resultado deseja tornar mais claro." },
  { id: "arquiteto-automacoes", codigo: "AA", nome: "Arquiteto de automações", descricao: "Transforme um processo manual em um plano com entradas, regras, saídas e controle humano.", cor: "cyan", inicio: "Descreva o processo repetitivo, quem executa hoje e onde o tempo é perdido." },
  { id: "analista-conteudo", codigo: "AC", nome: "Analista de conteúdo", descricao: "Conecte pauta, formato, distribuição e métrica aos objetivos comerciais do negócio.", cor: "rust", inicio: "Informe sua oferta, público e o objetivo comercial do conteúdo neste momento." },
  { id: "revisor-agentes", codigo: "RA", nome: "Revisor de agentes", descricao: "Revise instruções, conhecimento, ferramentas, limites, testes e escalonamento humano.", cor: "gold", inicio: "Cole o comportamento esperado do agente e diga quais ferramentas ele pode utilizar." },
];

type Mensagem = { id: string; papel: "user" | "assistant"; conteudo: string; criadoEm: number };

export function AgentesInterativos() {
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const fim = useRef<HTMLDivElement>(null);
  const agente = agentes.find((item) => item.id === agenteId) ?? null;

  useEffect(() => {
    if (!agenteId) return;
    setCarregando(true);
    fetch(`/api/comunidade/agentes?agente=${agenteId}`, { cache: "no-store" }).then(async (resposta) => {
      if (resposta.ok) setMensagens(((await resposta.json()) as { mensagens: Mensagem[] }).mensagens);
      setCarregando(false);
    });
  }, [agenteId]);
  useEffect(() => { fim.current?.scrollIntoView({ behavior: "smooth" }); }, [mensagens, carregando]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const mensagem = texto.trim();
    if (!agente || !mensagem || carregando) return;
    setTexto("");
    setErro("");
    setMensagens((atuais) => [...atuais, { id: `local-${Date.now()}`, papel: "user", conteudo: mensagem, criadoEm: Date.now() }]);
    setCarregando(true);
    const resposta = await fetch("/api/comunidade/agentes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agente: agente.id, mensagem }) });
    const dados = await resposta.json() as { resposta?: string; erro?: string };
    setCarregando(false);
    if (!resposta.ok || !dados.resposta) {
      setErro(dados.erro === "ia_nao_configurada" ? "O laboratório de IA está sendo ativado. Tente novamente em alguns minutos." : "Não foi possível concluir esta análise agora.");
      return;
    }
    setMensagens((atuais) => [...atuais, { id: crypto.randomUUID(), papel: "assistant", conteudo: dados.resposta!, criadoEm: Date.now() }]);
  }

  async function limpar() {
    if (!agente || !window.confirm("Limpar esta conversa?")) return;
    const resposta = await fetch(`/api/comunidade/agentes?agente=${agente.id}`, { method: "DELETE" });
    if (resposta.ok) setMensagens([]);
  }

  return <>
    <div className="agent-grid agent-grid--premium">{agentes.map((item) => <button className="agent-card agent-card--interactive" onClick={() => setAgenteId(item.id)} key={item.id}><div className={`agent-portrait agent-portrait--${item.cor}`}><span>{item.codigo}</span><i /><b>HÁGIOS LAB</b></div><div className="agent-card-copy"><span className="status-pill"><Sparkles size={12} /> Disponível</span><h3>{item.nome}</h3><p>{item.descricao}</p><footer>Iniciar análise</footer></div></button>)}</div>
    {agente && <div className="agent-chat" role="dialog" aria-modal="true" aria-label={`Conversar com ${agente.nome}`}><button className="agent-chat__scrim" onClick={() => setAgenteId(null)} aria-label="Fechar conversa" /><section><header><div className={`agent-chat__avatar agent-portrait--${agente.cor}`}>{agente.codigo}</div><div><small>AGENTE ESPECIALISTA</small><h2>{agente.nome}</h2></div><button onClick={() => void limpar()} aria-label="Limpar conversa"><Trash2 /></button><button onClick={() => setAgenteId(null)} aria-label="Fechar conversa"><X /></button></header><div className="agent-chat__messages">{mensagens.length === 0 && <div className="agent-welcome"><Sparkles /><strong>Vamos transformar contexto em próximos passos.</strong><p>{agente.inicio}</p></div>}{mensagens.map((mensagem) => <article className={`agent-message agent-message--${mensagem.papel}`} key={mensagem.id}><span>{mensagem.papel === "assistant" ? agente.codigo : "VOCÊ"}</span><p>{mensagem.conteudo}</p></article>)}{carregando && <article className="agent-message agent-message--assistant"><span>{agente.codigo}</span><p className="agent-typing">Analisando o contexto<span>•••</span></p></article>}<div ref={fim} /></div>{erro && <div className="community-alert" role="alert">{erro}</div>}<form onSubmit={enviar}><textarea value={texto} onChange={(evento) => setTexto(evento.target.value)} placeholder="Descreva o contexto, objetivo e restrições…" rows={3} maxLength={3000} /><button disabled={carregando || texto.trim().length < 2} aria-label="Enviar mensagem"><Send /></button></form><footer>Não compartilhe senhas, chaves de API ou dados pessoais sensíveis.</footer></section></div>}
  </>;
}
