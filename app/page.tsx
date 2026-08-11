"use client";

import { useState } from "react";

type Track = {
  eyebrow: string;
  title: string;
  description: string;
  lessons: number;
  duration: string;
  progress: number;
  tone: string;
  symbol: string;
};

const tracks: Track[] = [
  {
    eyebrow: "FORMAÇÃO ESSENCIAL",
    title: "Fundamentos da Inteligência Artificial",
    description: "Construa uma base sólida para liderar, criar e tomar decisões na era da IA.",
    lessons: 12,
    duration: "4h 30min",
    progress: 68,
    tone: "gold",
    symbol: "IA",
  },
  {
    eyebrow: "FORMAÇÃO PROFISSIONAL",
    title: "Gestor de Agentes & Automações",
    description: "Desenhe operações inteligentes que trabalham, atendem e vendem em escala.",
    lessons: 18,
    duration: "7h 20min",
    progress: 22,
    tone: "violet",
    symbol: "AG",
  },
  {
    eyebrow: "FORMAÇÃO BUILDER",
    title: "Produtos com IA sem Programar",
    description: "Tire sua ideia do papel e publique aplicativos, SaaS e plataformas reais.",
    lessons: 21,
    duration: "9h 10min",
    progress: 0,
    tone: "cyan",
    symbol: "01",
  },
  {
    eyebrow: "FORMAÇÃO EXECUTIVA",
    title: "IA para Negócios & Crescimento",
    description: "Aumente faturamento e margem com uma estratégia de IA aplicada à empresa.",
    lessons: 14,
    duration: "5h 45min",
    progress: 0,
    tone: "rust",
    symbol: "↑",
  },
];

const navGroups = [
  {
    label: "Aprender",
    items: [
      ["⌂", "Início"],
      ["▰", "Formações"],
      ["◇", "Biblioteca"],
      ["✓", "Meu progresso"],
    ],
  },
  {
    label: "Comunidade",
    items: [
      ["◎", "Feed"],
      ["♧", "Membros"],
      ["◉", "Lives & encontros"],
      ["◌", "Oportunidades"],
    ],
  },
  {
    label: "Laboratório",
    items: [
      ["✦", "Agentes especialistas"],
      ["⌁", "Automações"],
      ["□", "Meus projetos"],
    ],
  },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState("Início");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visibleTracks = tracks.filter((track) =>
    `${track.title} ${track.description}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <img src="/logo-hagios.png" alt="Emblema Movimento Hágios" />
          <div>
            <span>movimento</span>
            <strong>HÁGIOS</strong>
          </div>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            ×
          </button>
        </div>

        <nav aria-label="Navegação principal">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(([icon, label]) => (
                <button
                  key={label}
                  className={activeNav === label ? "active" : ""}
                  onClick={() => {
                    setActiveNav(label);
                    setMenuOpen(false);
                  }}
                >
                  <span className="nav-icon">{icon}</span>
                  {label}
                  {label === "Feed" && <i>12</i>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-avatar">MR</div>
          <div>
            <strong>Marcos Ribeiro</strong>
            <span>Membro fundador</span>
          </div>
          <button aria-label="Opções da conta">•••</button>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            ☰
          </button>
          <div className="mobile-brand">HÁGIOS</div>
          <label className="search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar formações, aulas e conteúdos"
              aria-label="Buscar na plataforma"
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notificações">
              ♢<i />
            </button>
            <button className="help-button">Central de ajuda</button>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <p className="kicker">ÁREA DE MEMBROS</p>
              <h1>Continue evoluindo, Marcos.</h1>
              <p>Conhecimento aplicado para liderar na nova economia.</p>
            </div>
            <div className="streak">
              <span>✦</span>
              <div><strong>7 dias</strong><small>sequência atual</small></div>
            </div>
          </section>

          <section className="continue-card">
            <div className="continue-art" aria-hidden="true">
              <div className="orb orb-one" />
              <div className="orb orb-two" />
              <div className="network-lines" />
              <span className="art-label">MÓDULO 03</span>
              <strong>AI</strong>
            </div>
            <div className="continue-info">
              <div>
                <span className="status-label">CONTINUE DE ONDE PAROU</span>
                <h2>Engenharia de contexto: como a IA realmente pensa</h2>
                <p>Fundamentos da Inteligência Artificial · Aula 8 de 12</p>
              </div>
              <div className="continue-bottom">
                <div className="progress-wrap">
                  <div className="progress-copy"><span>Seu progresso</span><strong>68%</strong></div>
                  <div className="progress"><i style={{ width: "68%" }} /></div>
                </div>
                <button>Continuar aula <span>→</span></button>
              </div>
            </div>
          </section>

          <section className="tracks-section">
            <div className="section-heading">
              <div>
                <p className="kicker">FORMAÇÕES HÁGIOS</p>
                <h2>Escolha sua próxima transformação</h2>
              </div>
              <button>Ver todas <span>→</span></button>
            </div>

            <div className="track-grid">
              {visibleTracks.map((track) => (
                <article className="track-card" key={track.title}>
                  <div className={`track-art ${track.tone}`}>
                    <span className="track-eyebrow">{track.eyebrow}</span>
                    <div className="track-mark">{track.symbol}</div>
                    <span className="track-number">0{tracks.indexOf(track) + 1}</span>
                  </div>
                  <div className="track-body">
                    <h3>{track.title}</h3>
                    <p>{track.description}</p>
                    <div className="track-meta">
                      <span>▤ {track.lessons} aulas</span>
                      <span>◷ {track.duration}</span>
                    </div>
                    {track.progress > 0 ? (
                      <div className="mini-progress">
                        <div><span>Em andamento</span><strong>{track.progress}%</strong></div>
                        <div className="progress"><i style={{ width: `${track.progress}%` }} /></div>
                      </div>
                    ) : (
                      <button className="start-track">Conhecer formação <span>↗</span></button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {visibleTracks.length === 0 && <div className="empty-state">Nenhuma formação encontrada para “{query}”.</div>}
          </section>

          <section className="audience-section">
            <div className="audience-intro">
              <p className="kicker">SEU PRÓXIMO NÍVEL</p>
              <h2>Formações para quem decidiu construir o futuro.</h2>
              <p>Do primeiro contato com IA à criação de operações e produtos completos — com direção, comunidade e prática.</p>
            </div>
            <div className="audience-list">
              {[
                ["01", "Empresários", "Mais faturamento, margem e vantagem competitiva com IA."],
                ["02", "Profissionais", "Escala de carreira criando tecnologia dentro de empresas."],
                ["03", "Gestores de IA", "Serviços de agentes, automações e produtos inteligentes."],
                ["04", "Builders", "SaaS, aplicativos e plataformas do zero — sem precisar programar."],
              ].map(([number, title, text]) => (
                <div className="audience-item" key={number}>
                  <span>{number}</span><div><strong>{title}</strong><p>{text}</p></div><i>↗</i>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
