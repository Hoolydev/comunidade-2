"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { Bell, CheckCheck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Notificacao = { id: string; titulo: string; mensagem: string; href: string; criadoEm: number; lida: boolean };

function dataCurta(data: number) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(data);
}

export function NotificacoesMenu() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);

  const carregar = useCallback(async () => {
    const resposta = await fetch("/api/comunidade/notificacoes", { cache: "no-store" });
    if (!resposta.ok) return;
    const dados = await resposta.json() as { notificacoes: Notificacao[]; naoLidas: number };
    setNotificacoes(dados.notificacoes);
    setNaoLidas(dados.naoLidas);
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  async function marcar(id?: string) {
    await fetch("/api/comunidade/notificacoes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(id ? { id } : {}) });
    if (id) setNotificacoes((atuais) => atuais.map((item) => item.id === id ? { ...item, lida: true } : item));
    else setNotificacoes((atuais) => atuais.map((item) => ({ ...item, lida: true })));
    setNaoLidas(id ? Math.max(0, naoLidas - 1) : 0);
  }

  return <div className="notifications"><button className="icon-button" aria-label={`Notificações${naoLidas ? `, ${naoLidas} não lidas` : ""}`} onClick={() => setAberto(!aberto)}><Bell size={19} />{naoLidas > 0 && <i />}</button>{aberto && <div className="notifications-panel"><header><div><small>CENTRAL HÁGIOS</small><h3>Notificações</h3></div><button onClick={() => setAberto(false)} aria-label="Fechar notificações"><X /></button></header>{naoLidas > 0 && <button className="notifications-read-all" onClick={() => void marcar()}><CheckCheck size={14} /> Marcar todas como lidas</button>}<div>{notificacoes.length === 0 ? <p className="notifications-empty">Você está em dia.</p> : notificacoes.map((item) => <Link href={item.href} className={item.lida ? "notification-item" : "notification-item unread"} key={item.id} onClick={() => { void marcar(item.id); setAberto(false); }}><span>{item.lida ? "" : "●"}</span><div><strong>{item.titulo}</strong><p>{item.mensagem}</p><small>{dataCurta(item.criadoEm)}</small></div></Link>)}</div></div>}</div>;
}
