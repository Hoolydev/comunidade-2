import Link from "next/link";
import { ArrowLeft, Download, MessageCircle } from "lucide-react";
import { materiais } from "../../../dados-comunidade";
import { obterMaterial } from "../../../lib/conteudo";

export function generateStaticParams() { return materiais.map(({ slug }) => ({ slug })); }

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const material = await obterMaterial(slug);
  if (!material) return <div className="area-content"><p>Material não encontrado.</p></div>;
  return <div className="area-content material-detail"><Link className="area-chip" href="/biblioteca"><ArrowLeft size={14} /> Voltar à biblioteca</Link><section className="area-hero" style={{ marginTop: 24 }}><div className="area-hero-copy"><p className="area-eyebrow">{material.type} · {material.meta}</p><h1>{material.title}</h1><p>{material.description}</p></div></section><div className="material-detail-card"><h2>Como usar este material</h2><p>Use este recurso durante a implementação. Preencha com dados reais do negócio, revise com o responsável pelo processo e registre uma métrica antes de começar.</p><ol><li>Defina o processo ou objetivo que será trabalhado.</li><li>Complete cada campo com informações observáveis.</li><li>Escolha um responsável e um prazo de validação.</li><li>Compare o resultado depois da primeira execução.</li></ol><div className="material-actions">{material.nomeArquivo ? <a className="area-action" href={`/api/arquivos/${material.slug}`}><Download size={16} /> Baixar {material.nomeArquivo}</a> : <span className="material-awaiting">Arquivo em preparação</span>}<Link className="area-chip" href="/feed"><MessageCircle size={16} /> Pedir ajuda para adaptar</Link></div></div></div>;
}
