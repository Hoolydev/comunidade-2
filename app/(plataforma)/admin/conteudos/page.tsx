import { AdminContentPanel } from "../../../componentes/AdminContentPanel";

export default function ConteudosAdminPage() {
  return (
    <div className="area-content admin-content">
      <section className="area-hero">
        <div className="area-hero-copy">
          <p className="area-eyebrow">Gestão de conteúdo</p>
          <h1>Publique aulas e materiais em um só lugar.</h1>
          <p>Conecte os vídeos do YouTube e mantenha os arquivos da biblioteca disponíveis para os membros.</p>
        </div>
        <div className="area-hero-aside"><strong>Admin</strong><span>ambiente restrito</span></div>
      </section>
      <AdminContentPanel />
    </div>
  );
}
