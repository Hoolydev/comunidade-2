import { Award, CheckCircle2, Flame, Target } from "lucide-react";
import { listarFormacoes, listarProgressoUsuario } from "../../lib/conteudo";
import { sessaoAtual } from "../../lib/sessao";
import { bancoComunidade } from "../../lib/membro-comunidade";

export default async function ProgressoPage() {
  const [formacoes, sessao] = await Promise.all([listarFormacoes(), sessaoAtual()]);
  const usuarioId = sessao.estado === "autenticado" ? sessao.uid : process.env.NODE_ENV === "development" ? "preview-local" : null;
  const progresso = usuarioId ? await listarProgressoUsuario(usuarioId) : [];
  const porAula = new Map(progresso.map((item) => [item.aulaId, item]));
  const totalAulas = formacoes.reduce((total, formacao) => total + formacao.aulas.length, 0);
  const concluidas = progresso.filter((item) => item.concluida).length;
  const geral = totalAulas ? Math.round((concluidas / totalAulas) * 100) : 0;
  const minutos = Math.round(progresso.reduce((total, item) => total + item.posicaoSegundos, 0) / 60);
  let projetosAplicados = 0;
  if (usuarioId) {
    try {
      const resultado = await bancoComunidade()
        .prepare("SELECT COUNT(*) AS total FROM projetos_membros WHERE usuario_id = ? AND status = 'Concluído'")
        .bind(usuarioId)
        .first<{ total: number }>();
      projetosAplicados = Number(resultado?.total ?? 0);
    } catch {
      projetosAplicados = 0;
    }
  }
  const andamento = formacoes.map((formacao) => {
    const aulasVistas = formacao.aulas.filter((aula) => porAula.has(aula.id));
    const aulasConcluidas = aulasVistas.filter((aula) => porAula.get(aula.id)?.concluida).length;
    const percentual = formacao.aulas.length ? Math.round((aulasConcluidas / formacao.aulas.length) * 100) : 0;
    return { ...formacao, progress: percentual, iniciada: aulasVistas.length > 0 };
  }).filter((formacao) => formacao.iniciada);

  return <div className="area-content"><section className="area-hero"><div className="area-hero-copy"><p className="area-eyebrow">Meu progresso</p><h1>Meça implementação, não apenas consumo.</h1><p>Acompanhe aulas, projetos e a evolução dos processos que você decidiu transformar.</p></div><div className="area-hero-aside"><strong>{geral}%</strong><span>progresso geral</span></div></section><div className="stats-grid"><div className="stat-card"><span>Aulas concluídas</span><strong>{concluidas} <em>/ {totalAulas}</em></strong></div><div className="stat-card"><span>Formações iniciadas</span><strong>{andamento.length}</strong></div><div className="stat-card"><span>Projetos aplicados</span><strong>{projetosAplicados}</strong></div><div className="stat-card"><span>Tempo assistido</span><strong>{minutos}<em>min</em></strong></div></div><div className="area-toolbar"><h2>Formações em andamento</h2><div className="area-chips"><span className="area-chip"><Target size={13} /> Meta: 3 implementações</span></div></div>{andamento.length ? <div className="progress-list">{andamento.map((item) => <article className="progress-card" key={item.slug}><div><h3>{item.title}</h3><p>Próxima etapa: continuar a implementação prática</p></div><div className="area-progress"><i style={{ width: `${item.progress}%` }} /></div><strong>{item.progress}%</strong></article>)}</div> : <div className="empty-state">Seu progresso aparecerá aqui depois que você iniciar uma aula.</div>}<div className="area-toolbar"><h2>Conquistas</h2></div><div className="agent-grid"><article className="agent-card"><header><span className="agent-symbol"><Flame /></span><span className="status-pill">Em andamento</span></header><h3>7 dias de consistência</h3><p>Mantenha uma semana de aplicação contínua.</p></article><article className="agent-card"><header><span className="agent-symbol"><CheckCircle2 /></span><span className="status-pill">{concluidas > 0 ? "Conquistada" : "Próxima"}</span></header><h3>Primeira aula concluída</h3><p>Conclua uma aula e registre seu primeiro avanço.</p></article><article className="agent-card"><header><span className="agent-symbol"><Award /></span><span className="status-pill">{projetosAplicados >= 3 ? "Conquistada" : "Próxima"}</span></header><h3>Construtor Hágios</h3><p>Conclua três projetos aplicados ao negócio.</p></article></div></div>;
}
