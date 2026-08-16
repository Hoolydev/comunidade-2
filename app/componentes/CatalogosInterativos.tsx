"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Formacao } from "../dados-comunidade";
import type { MaterialConteudo } from "../lib/conteudo";

export function CatalogoFormacoes({ formacoes }: { formacoes: Formacao[] }) {
  const [categoria, setCategoria] = useState("Todas");
  const categorias = ["Todas", ...new Set(formacoes.map((item) => item.category))];
  const visiveis = categoria === "Todas" ? formacoes : formacoes.filter((item) => item.category === categoria);
  return <><div className="area-toolbar"><h2>{categoria === "Todas" ? "Todas as formações" : `Formações de ${categoria}`}</h2><div className="area-chips">{categorias.map((item) => <button type="button" className={item === categoria ? "area-chip active" : "area-chip"} onClick={() => setCategoria(item)} key={item}>{item}</button>)}</div></div><div className="formation-grid">{visiveis.map((formacao) => <Link className="formation-card" href={`/formacoes/${formacao.slug}`} key={formacao.slug}><div className="formation-card-cover"><img src={formacao.cover} alt={`Capa de ${formacao.title}`} /><span>{formacao.category}</span></div><div className="formation-card-body"><h3>{formacao.title}</h3><p>{formacao.description}</p><div className="formation-card-meta"><span><BookOpen /> {formacao.lessons} aulas</span><span><Clock3 /> {formacao.duration}</span><span>{formacao.level}</span></div></div></Link>)}</div></>;
}

const codigos: Record<string, string> = { Planilha: "XLS", Checklist: "CHK", Playbook: "PLAY", Roteiro: "GUIA", Template: "DOC", Canvas: "MAPA" };

export function CatalogoBiblioteca({ materiais }: { materiais: MaterialConteudo[] }) {
  const [tipo, setTipo] = useState("Todos");
  const tipos = useMemo(() => ["Todos", ...new Set(materiais.map((item) => item.type))], [materiais]);
  const visiveis = tipo === "Todos" ? materiais : materiais.filter((item) => item.type === tipo);
  return <><div className="area-toolbar"><h2>Recursos da biblioteca</h2><div className="area-chips">{tipos.map((item) => <button type="button" className={item === tipo ? "area-chip active" : "area-chip"} onClick={() => setTipo(item)} key={item}>{item}</button>)}</div></div><div className="resource-grid">{visiveis.map((material, index) => <Link className={`resource-card resource-card--${(index % 4) + 1}`} href={`/biblioteca/${material.slug}`} key={material.slug}><div className="resource-art"><span className="resource-art-index">{String(index + 1).padStart(2, "0")}</span><span className="resource-art-code">{codigos[material.type] ?? "ARQ"}</span><i /><b>Movimento Hágios</b></div><div className="resource-card-copy"><div className="resource-card-top"><small>{material.type}</small>{material.nomeArquivo && <span>Disponível</span>}</div><h3>{material.title}</h3><p>{material.description}</p><footer><span>{material.meta}</span><strong>Abrir material <ArrowUpRight size={13} /></strong></footer></div></Link>)}</div></>;
}
