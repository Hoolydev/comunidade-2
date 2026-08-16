"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Projeto = { id: string; titulo: string; area: string; status: string; progresso: number; proximaAcao: string; atualizadoEm: number };

const novoProjeto = { titulo: "", area: "Atendimento" };

export function ProjetosInterativos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [novo, setNovo] = useState(novoProjeto);
  const [editando, setEditando] = useState<Projeto | null>(null);
  const [modalNovo, setModalNovo] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    const resposta = await fetch("/api/comunidade/projetos", { cache: "no-store" });
    if (resposta.ok) setProjetos(((await resposta.json()) as { projetos: Projeto[] }).projetos);
    setCarregando(false);
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  const stats = useMemo(() => ({
    ativos: projetos.filter((item) => item.status !== "Concluído").length,
    concluidos: projetos.filter((item) => item.status === "Concluído").length,
    media: projetos.length ? Math.round(projetos.reduce((soma, item) => soma + item.progresso, 0) / projetos.length) : 0,
  }), [projetos]);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    const resposta = await fetch("/api/comunidade/projetos", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(novo) });
    setOcupado(false);
    if (resposta.ok) { setNovo(novoProjeto); setModalNovo(false); await carregar(); }
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!editando) return;
    setOcupado(true);
    const resposta = await fetch("/api/comunidade/projetos", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(editando) });
    setOcupado(false);
    if (resposta.ok) { setEditando(null); await carregar(); }
  }

  async function remover(id: string) {
    if (!window.confirm("Remover este projeto da sua área?")) return;
    const resposta = await fetch(`/api/comunidade/projetos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (resposta.ok) setProjetos((atuais) => atuais.filter((item) => item.id !== id));
  }

  return <>
    <div className="stats-grid"><div className="stat-card"><span>Projetos ativos</span><strong>{stats.ativos}</strong></div><div className="stat-card"><span>Concluídos</span><strong>{stats.concluidos}</strong></div><div className="stat-card"><span>Progresso médio</span><strong>{stats.media}<em>%</em></strong></div><div className="stat-card"><span>Total de projetos</span><strong>{projetos.length}</strong></div></div>
    <div className="area-toolbar"><h2>Projetos em andamento</h2><button className="area-action" onClick={() => setModalNovo(true)}><Plus size={16} /> Criar projeto</button></div>
    {carregando ? <div className="empty-state">Carregando projetos…</div> : projetos.length === 0 ? <div className="empty-state empty-state--action"><strong>Transforme uma formação em entrega real.</strong><span>Crie um projeto, defina o resultado e acompanhe o avanço semanalmente.</span><button className="area-action" onClick={() => setModalNovo(true)}><Plus size={16} /> Criar primeiro projeto</button></div> : <div className="project-list">{projetos.map((projeto) => <article className="project-card project-card--interactive" key={projeto.id}><div><span className="status-pill">{projeto.area}</span><h3>{projeto.titulo}</h3><p>{projeto.status}</p></div><div className="project-progress"><strong>{projeto.progresso}% concluído</strong><div className="area-progress"><i style={{ width: `${projeto.progresso}%` }} /></div></div><div className="project-next">Próxima ação<strong>{projeto.proximaAcao}</strong></div><div className="project-actions"><button onClick={() => setEditando({ ...projeto })} aria-label="Editar projeto"><Edit3 size={16} /></button><button onClick={() => void remover(projeto.id)} aria-label="Remover projeto"><Trash2 size={16} /></button></div></article>)}</div>}

    {modalNovo && <div className="community-modal" role="dialog" aria-modal="true" aria-label="Criar projeto"><button className="community-modal__scrim" onClick={() => setModalNovo(false)} aria-label="Fechar" /><form onSubmit={criar}><button type="button" className="community-modal__close" onClick={() => setModalNovo(false)} aria-label="Fechar"><X /></button><p className="area-eyebrow">NOVA IMPLEMENTAÇÃO</p><h2>Qual processo você vai transformar?</h2><label>Nome do projeto<input value={novo.titulo} onChange={(evento) => setNovo({ ...novo, titulo: evento.target.value })} placeholder="Ex.: Atendimento automático no WhatsApp" required minLength={3} /></label><label>Área<select value={novo.area} onChange={(evento) => setNovo({ ...novo, area: evento.target.value })}><option>Atendimento</option><option>Marketing</option><option>Comercial</option><option>Operação</option><option>Produto</option><option>Financeiro</option></select></label><button className="area-action" disabled={ocupado}><Plus size={15} /> {ocupado ? "Criando…" : "Criar projeto"}</button></form></div>}

    {editando && <div className="community-modal" role="dialog" aria-modal="true" aria-label="Editar projeto"><button className="community-modal__scrim" onClick={() => setEditando(null)} aria-label="Fechar" /><form onSubmit={salvar}><button type="button" className="community-modal__close" onClick={() => setEditando(null)} aria-label="Fechar"><X /></button><p className="area-eyebrow">ATUALIZAR PROJETO</p><h2>Registre o avanço observável.</h2><label>Projeto<input value={editando.titulo} onChange={(evento) => setEditando({ ...editando, titulo: evento.target.value })} required /></label><label>Área<input value={editando.area} onChange={(evento) => setEditando({ ...editando, area: evento.target.value })} required /></label><label>Status<select value={editando.status} onChange={(evento) => setEditando({ ...editando, status: evento.target.value })}><option>Planejamento</option><option>Em implementação</option><option>Em teste</option><option>Em validação</option><option>Concluído</option></select></label><label>Progresso: {editando.progresso}%<input type="range" min="0" max="100" step="5" value={editando.progresso} onChange={(evento) => setEditando({ ...editando, progresso: Number(evento.target.value) })} /></label><label>Próxima ação<textarea value={editando.proximaAcao} onChange={(evento) => setEditando({ ...editando, proximaAcao: evento.target.value })} rows={3} required /></label><button className="area-action" disabled={ocupado}><Save size={15} /> {ocupado ? "Salvando…" : "Salvar avanço"}</button></form></div>}
  </>;
}
