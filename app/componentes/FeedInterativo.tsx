"use client";

/* eslint-disable @next/next/no-img-element, react-hooks/set-state-in-effect */

import { Bookmark, MessageCircle, Send, ThumbsUp, Trash2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Comentario = { id: string; autorId: string; autorNome: string; conteudo: string; criadoEm: number };
type Publicacao = {
  id: string;
  autorId: string;
  autorNome: string;
  autorCargo: string;
  autorFoto: string | null;
  categoria: string;
  titulo: string;
  conteudo: string;
  criadoEm: number;
  curtidas: number;
  comentarios: Comentario[];
  totalComentarios: number;
  curtiu: boolean;
  salvou: boolean;
};

function iniciais(nome: string) {
  return nome.split(" ").map((parte) => parte[0]).join("").slice(0, 2).toUpperCase();
}

function tempo(data: number) {
  const minutos = Math.max(0, Math.round((Date.now() - data) / 60000));
  if (minutos < 1) return "Agora";
  if (minutos < 60) return `${minutos} min`;
  if (minutos < 1440) return `${Math.floor(minutos / 60)} h`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(data);
}

export function FeedInterativo() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [categoria, setCategoria] = useState("Implementação");
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/comunidade/feed", { cache: "no-store" });
      if (!resposta.ok) throw new Error("Não foi possível carregar o feed.");
      const dados = await resposta.json() as { usuarioId: string; publicacoes: Publicacao[] };
      setPublicacoes(dados.publicacoes);
      setUsuarioId(dados.usuarioId);
      setErro("");
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : "Não foi possível carregar o feed.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function publicar(evento: FormEvent) {
    evento.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    const resposta = await fetch("/api/comunidade/feed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ titulo, conteudo, categoria }),
    });
    setOcupado(false);
    if (!resposta.ok) return setErro("Preencha um título e compartilhe o que você implementou.");
    setTitulo("");
    setConteudo("");
    await carregar();
  }

  async function interagir(publicacaoId: string, acao: "curtir" | "salvar") {
    setPublicacoes((atuais) => atuais.map((item) => item.id === publicacaoId ? {
      ...item,
      ...(acao === "curtir" ? { curtiu: !item.curtiu, curtidas: item.curtidas + (item.curtiu ? -1 : 1) } : { salvou: !item.salvou }),
    } : item));
    const resposta = await fetch("/api/comunidade/feed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicacaoId, acao }),
    });
    if (!resposta.ok) await carregar();
  }

  async function comentar(evento: FormEvent, publicacaoId: string) {
    evento.preventDefault();
    const texto = comentarios[publicacaoId]?.trim();
    if (!texto) return;
    const resposta = await fetch("/api/comunidade/feed", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ publicacaoId, conteudo: texto }),
    });
    if (!resposta.ok) return setErro("Não foi possível publicar o comentário.");
    setComentarios((atuais) => ({ ...atuais, [publicacaoId]: "" }));
    await carregar();
  }

  async function remover(id: string) {
    const resposta = await fetch(`/api/comunidade/feed?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (resposta.ok) setPublicacoes((atuais) => atuais.filter((item) => item.id !== id));
  }

  return (
    <div className="community-feed-layout">
      <div className="community-feed-main">
        <form className="composer-card" onSubmit={publicar}>
          <div className="composer-head"><strong>Compartilhe uma implementação</strong><select value={categoria} onChange={(evento) => setCategoria(evento.target.value)} aria-label="Categoria"><option>Implementação</option><option>Dúvida</option><option>Case</option><option>Oportunidade</option></select></div>
          <input value={titulo} onChange={(evento) => setTitulo(evento.target.value)} placeholder="Qual avanço ou dúvida você quer compartilhar?" maxLength={140} />
          <textarea value={conteudo} onChange={(evento) => setConteudo(evento.target.value)} placeholder="Conte o contexto, o que foi feito e qual resultado você observou." maxLength={3000} rows={4} />
          <footer><span>{conteudo.length}/3000</span><button className="area-action" disabled={ocupado}>{ocupado ? "Publicando…" : <><Send size={15} /> Publicar no feed</>}</button></footer>
        </form>

        {erro && <div className="community-alert" role="alert">{erro}</div>}
        {carregando ? <div className="empty-state">Carregando conversas…</div> : publicacoes.length === 0 ? <div className="empty-state">O feed está pronto. Compartilhe a primeira implementação.</div> : (
          <div className="feed-list">
            {publicacoes.map((post) => (
              <article className="feed-card feed-card--interactive" key={post.id}>
                <header>
                  <div className="feed-author"><i>{post.autorFoto ? <img src={post.autorFoto} alt="" /> : iniciais(post.autorNome)}</i><div><strong>{post.autorNome}</strong><span>{post.autorCargo} · {tempo(post.criadoEm)}</span></div></div>
                  <div className="feed-card-actions"><span className="status-pill">{post.categoria}</span>{post.autorId === usuarioId && <button type="button" onClick={() => void remover(post.id)} aria-label="Excluir publicação"><Trash2 size={14} /></button>}</div>
                </header>
                <h2>{post.titulo}</h2><p>{post.conteudo}</p>
                <footer className="feed-actions">
                  <button type="button" className={post.curtiu ? "active" : ""} onClick={() => void interagir(post.id, "curtir")}><ThumbsUp size={15} /> {post.curtidas} apoios</button>
                  <span><MessageCircle size={15} /> {post.totalComentarios} respostas</span>
                  <button type="button" className={post.salvou ? "active" : ""} onClick={() => void interagir(post.id, "salvar")}><Bookmark size={15} /> {post.salvou ? "Salvo" : "Salvar"}</button>
                </footer>
                {post.comentarios.length > 0 && <div className="comments-list">{post.comentarios.map((comentario) => <div key={comentario.id}><strong>{comentario.autorNome}</strong><p>{comentario.conteudo}</p><span>{tempo(comentario.criadoEm)}</span></div>)}</div>}
                <form className="comment-form" onSubmit={(evento) => void comentar(evento, post.id)}><input value={comentarios[post.id] ?? ""} onChange={(evento) => setComentarios((atuais) => ({ ...atuais, [post.id]: evento.target.value }))} placeholder="Escreva uma resposta útil…" maxLength={800} /><button aria-label="Publicar resposta"><Send size={15} /></button></form>
              </article>
            ))}
          </div>
        )}
      </div>
      <aside className="feed-side"><h3>Direção da semana</h3><p>Escolha uma tarefa repetitiva que consome mais de duas horas por semana. Mapeie entradas, decisão e saída antes de escolher a ferramenta.</p><span className="status-pill">Semana de implementação</span></aside>
    </div>
  );
}
