"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Resultado = { tipo: string; titulo: string; descricao: string; href: string };

export function BuscaComunidade({ termoInicial }: { termoInicial: string }) {
  const [termo, setTermo] = useState(termoInicial);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [carregando, setCarregando] = useState(Boolean(termoInicial));

  const buscar = useCallback(async (valor: string) => {
    if (valor.trim().length < 2) { setResultados([]); setCarregando(false); return; }
    setCarregando(true);
    const resposta = await fetch(`/api/comunidade/busca?termo=${encodeURIComponent(valor.trim())}`, { cache: "no-store" });
    if (resposta.ok) setResultados(((await resposta.json()) as { resultados: Resultado[] }).resultados);
    setCarregando(false);
  }, []);
  useEffect(() => { void buscar(termoInicial); }, [buscar, termoInicial]);

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    window.history.replaceState(null, "", `/buscar?termo=${encodeURIComponent(termo.trim())}`);
    void buscar(termo);
  }

  const grupos = [...new Set(resultados.map((item) => item.tipo))];
  return <><form className="global-search" onSubmit={enviar}><Search /><input value={termo} onChange={(evento) => setTermo(evento.target.value)} placeholder="Busque formações, aulas, materiais, membros e conversas" autoFocus /><button>Buscar</button></form>{carregando ? <div className="empty-state">Buscando em toda a comunidade…</div> : termoInicial && resultados.length === 0 ? <div className="empty-state">Nenhum resultado encontrado. Tente outro termo.</div> : grupos.map((grupo) => <section className="search-group" key={grupo}><div className="area-toolbar"><h2>{grupo}</h2><span className="area-chip">{resultados.filter((item) => item.tipo === grupo).length} resultados</span></div><div className="search-results">{resultados.filter((item) => item.tipo === grupo).map((item) => <Link href={item.href} key={`${item.tipo}-${item.href}`}><span>{item.tipo}</span><div><h3>{item.titulo}</h3><p>{item.descricao}</p></div><ArrowUpRight /></Link>)}</div></section>)}</>;
}
