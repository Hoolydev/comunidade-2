"use client";

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */

import { Edit3, MapPin, Search, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Perfil = {
  usuarioId: string;
  nome: string;
  email: string | null;
  cargo: string;
  foco: string;
  cidade: string;
  bio: string;
  fotoUrl: string | null;
  visivel: boolean;
  proprio: boolean;
};

function iniciais(nome: string) {
  return nome.split(" ").map((parte) => parte[0]).join("").slice(0, 2).toUpperCase();
}

export function MembrosInterativos() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Perfil | null>(null);
  const [editando, setEditando] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async (termo = "") => {
    setCarregando(true);
    const resposta = await fetch(`/api/comunidade/perfis?busca=${encodeURIComponent(termo)}`, { cache: "no-store" });
    if (resposta.ok) {
      const dados = await resposta.json() as { perfis: Perfil[] };
      setPerfis(dados.perfis);
    }
    setCarregando(false);
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  function pesquisar(evento: FormEvent) {
    evento.preventDefault();
    void carregar(busca);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!editando || salvando) return;
    setSalvando(true);
    const resposta = await fetch("/api/comunidade/perfis", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editando),
    });
    setSalvando(false);
    if (resposta.ok) {
      setEditando(null);
      await carregar(busca);
    }
  }

  const proprio = perfis.find((perfil) => perfil.proprio);

  return (
    <>
      <div className="area-toolbar members-toolbar"><form className="members-search" onSubmit={pesquisar}><Search size={16} /><input value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar por nome, cidade, cargo ou foco" /><button>Buscar</button></form>{proprio && <button className="area-action" onClick={() => setEditando({ ...proprio })}><Edit3 size={15} /> Editar meu perfil</button>}</div>
      {carregando ? <div className="empty-state">Carregando membros…</div> : perfis.length === 0 ? <div className="empty-state">Nenhum membro encontrado para essa busca.</div> : <div className="member-grid">{perfis.map((membro) => <button type="button" className="member-card member-card--button" key={membro.usuarioId} onClick={() => setSelecionado(membro)}><header><span className="member-avatar">{membro.fotoUrl ? <img src={membro.fotoUrl} alt="" /> : iniciais(membro.nome)}</span><div><h3>{membro.nome}{membro.proprio ? " · você" : ""}</h3><p>{membro.cargo}</p></div></header><p>Foco atual: <strong>{membro.foco}</strong></p><footer><span><MapPin size={12} /> {membro.cidade}</span><span>Ver perfil</span></footer></button>)}</div>}

      {selecionado && <div className="community-modal" role="dialog" aria-modal="true" aria-label={`Perfil de ${selecionado.nome}`}><button className="community-modal__scrim" onClick={() => setSelecionado(null)} aria-label="Fechar perfil" /><article><button className="community-modal__close" onClick={() => setSelecionado(null)} aria-label="Fechar"><X /></button><span className="member-avatar member-avatar--large">{selecionado.fotoUrl ? <img src={selecionado.fotoUrl} alt="" /> : iniciais(selecionado.nome)}</span><p className="area-eyebrow">MEMBRO HÁGIOS</p><h2>{selecionado.nome}</h2><strong>{selecionado.cargo}</strong><p>{selecionado.bio || "Construindo e implementando soluções de IA com a comunidade."}</p><dl><div><dt>Foco atual</dt><dd>{selecionado.foco}</dd></div><div><dt>Localização</dt><dd>{selecionado.cidade}</dd></div></dl>{selecionado.proprio && <button className="area-action" onClick={() => { setSelecionado(null); setEditando({ ...selecionado }); }}><Edit3 size={15} /> Editar perfil</button>}</article></div>}

      {editando && <div className="community-modal" role="dialog" aria-modal="true" aria-label="Editar meu perfil"><button className="community-modal__scrim" onClick={() => setEditando(null)} aria-label="Fechar edição" /><form onSubmit={salvar}><button type="button" className="community-modal__close" onClick={() => setEditando(null)} aria-label="Fechar"><X /></button><p className="area-eyebrow">SEU PERFIL</p><h2>Como você quer aparecer na comunidade?</h2><label>Nome<input value={editando.nome} onChange={(evento) => setEditando({ ...editando, nome: evento.target.value })} maxLength={80} required /></label><label>Cargo ou atuação<input value={editando.cargo} onChange={(evento) => setEditando({ ...editando, cargo: evento.target.value })} maxLength={100} required /></label><label>Foco atual<input value={editando.foco} onChange={(evento) => setEditando({ ...editando, foco: evento.target.value })} maxLength={120} required /></label><label>Cidade<input value={editando.cidade} onChange={(evento) => setEditando({ ...editando, cidade: evento.target.value })} maxLength={80} required /></label><label>Apresentação<textarea value={editando.bio} onChange={(evento) => setEditando({ ...editando, bio: evento.target.value })} maxLength={500} rows={4} /></label><label className="community-check"><input type="checkbox" checked={editando.visivel} onChange={(evento) => setEditando({ ...editando, visivel: evento.target.checked })} /> Mostrar meu perfil para outros membros</label><button className="area-action" disabled={salvando}>{salvando ? "Salvando…" : "Salvar perfil"}</button></form></div>}
    </>
  );
}
