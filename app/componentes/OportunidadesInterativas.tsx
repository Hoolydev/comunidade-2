"use client";

import { ArrowRight, CheckCircle2, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { oportunidades } from "../dados-comunidade";

function slug(titulo: string) {
  return titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function OportunidadesInterativas() {
  const [enviadas, setEnviadas] = useState<Set<string>>(new Set());
  const [selecionada, setSelecionada] = useState<(typeof oportunidades)[number] | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { fetch("/api/comunidade/oportunidades", { cache: "no-store" }).then(async (resposta) => { if (resposta.ok) setEnviadas(new Set(((await resposta.json()) as { candidaturas: { oportunidadeId: string }[] }).candidaturas.map((item) => item.oportunidadeId))); }); }, []);

  async function enviar() {
    if (!selecionada) return;
    const id = slug(selecionada.title);
    setOcupado(true);
    const resposta = await fetch("/api/comunidade/oportunidades", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ oportunidadeId: id, mensagem }) });
    setOcupado(false);
    if (resposta.ok) { setEnviadas((atuais) => new Set([...atuais, id])); setSelecionada(null); setMensagem(""); }
  }

  return <><div className="opportunity-list">{oportunidades.map((item) => { const id = slug(item.title); const enviada = enviadas.has(id); return <article className="opportunity-card" key={item.title}><div><span className="status-pill">{item.tag}</span><p className="opportunity-company">{item.company}</p></div><div><h3>{item.title}</h3><p>{item.description}</p></div><aside><span>{item.deadline}</span><button className={enviada ? "area-action confirmed" : "area-action"} onClick={() => !enviada && setSelecionada(item)}>{enviada ? <><CheckCircle2 size={14} /> Interesse enviado</> : <>Quero participar <ArrowRight size={14} /></>}</button></aside></article>; })}</div>{selecionada && <div className="community-modal" role="dialog" aria-modal="true" aria-label="Demonstrar interesse"><button className="community-modal__scrim" onClick={() => setSelecionada(null)} aria-label="Fechar" /><form onSubmit={(evento) => { evento.preventDefault(); void enviar(); }}><button type="button" className="community-modal__close" onClick={() => setSelecionada(null)} aria-label="Fechar"><X /></button><p className="area-eyebrow">CONEXÃO HÁGIOS</p><h2>{selecionada.title}</h2><p>Apresente brevemente sua experiência e como você pode contribuir. A equipe poderá usar os dados do seu perfil para facilitar a conexão.</p><label>Mensagem<textarea value={mensagem} onChange={(evento) => setMensagem(evento.target.value)} placeholder="Tenho experiência com…" rows={5} maxLength={600} /></label><button className="area-action" disabled={ocupado}><Send size={15} /> {ocupado ? "Enviando…" : "Enviar interesse"}</button></form></div>}</>;
}
