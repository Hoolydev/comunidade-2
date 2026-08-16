import { AdminContentPanel } from "../../../componentes/AdminContentPanel";
import { RedirecionarAcesso } from "../../../componentes/RedirecionarAcesso";
import { sessaoAtual } from "../../../lib/sessao";

export default async function ConteudosAdminPage() {
  const sessao = await sessaoAtual();
  const permitidos = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const autorizado = process.env.NODE_ENV === "development" || (sessao.estado === "autenticado" && Boolean(sessao.email && permitidos.includes(sessao.email.toLowerCase())));
  if (!autorizado) return <RedirecionarAcesso destino="/inicio" />;
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
