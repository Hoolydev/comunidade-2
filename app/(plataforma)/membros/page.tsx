import { MapPin } from "lucide-react";
import { membros } from "../../dados-comunidade";

export default function MembrosPage() {
  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Membros</p><h1>Encontre quem está construindo na mesma direção.</h1><p>Conecte-se por área de atuação, experiência e objetivo de implementação.</p></div><div className="area-hero-aside"><strong>248</strong><span>membros no movimento</span></div></section><div className="area-toolbar"><h2>Membros em destaque</h2><div className="area-chips"><span className="area-chip active">Todos</span><span className="area-chip">Empresários</span><span className="area-chip">Gestores de IA</span><span className="area-chip">Builders</span></div></div><div className="member-grid">{membros.map((membro) => <article className="member-card" key={membro.name}><header><span className="member-avatar">{membro.initials}</span><div><h3>{membro.name}</h3><p>{membro.role}</p></div></header><p>Foco atual: <strong>{membro.focus}</strong></p><footer><span><MapPin size={12} /> {membro.city}</span><span>Ver perfil</span></footer></article>)}</div></div>;
}
