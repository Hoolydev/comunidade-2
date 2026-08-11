"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flame,
  GraduationCap,
  House,
  LibraryBig,
  Menu,
  MessageSquareText,
  MoreHorizontal,
  Play,
  Search,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

type Track = {
  slug: string;
  category: string;
  title: string;
  description: string;
  outcome: string;
  lessons: number;
  duration: string;
  progress: number;
  cover: string;
};

const tracks: Track[] = [
  {
    slug: "vendedor-virtual-whatsapp",
    category: "ATENDIMENTO",
    title: "O Vendedor Virtual 24h no WhatsApp",
    description: "Pare de perder clientes para o concorrente porque você demorou para responder no WhatsApp.",
    outcome: "Qualificação e agendamento",
    lessons: 8,
    duration: "2h 40min",
    progress: 35,
    cover: "/module-covers/01-vendedor-whatsapp.png",
  },
  {
    slug: "suporte-pos-venda",
    category: "ATENDIMENTO",
    title: "Não Perca Mais Tempo no Suporte",
    description: "Reduza em até 70% o volume de chamados sem precisar contratar mais atendentes.",
    outcome: "Suporte e pós-venda",
    lessons: 7,
    duration: "2h 10min",
    progress: 0,
    cover: "/module-covers/02-suporte-pos-venda.png",
  },
  {
    slug: "crm-antiesquecimento",
    category: "ATENDIMENTO",
    title: "O Sistema Antiesquecimento de Clientes",
    description: "Recupere vendas perdidas no seu funil com cobranças, lembretes e ofertas automáticas.",
    outcome: "CRM automático",
    lessons: 9,
    duration: "3h 05min",
    progress: 0,
    cover: "/module-covers/03-crm-automatico.png",
  },
  {
    slug: "clone-em-video",
    category: "MARKETING",
    title: "Faça Seu Clone Trabalhar por Você",
    description: "Crie vídeos com seu clone e mantenha a constância na criação de conteúdo.",
    outcome: "Clone em vídeo",
    lessons: 6,
    duration: "1h 50min",
    progress: 0,
    cover: "/module-covers/04-clone-video.png",
  },
  {
    slug: "posts-em-minutos",
    category: "MARKETING",
    title: "Seus Posts Feitos em Minutos",
    description: "Produza artes profissionais sem passar horas no Canva ou depender de terceiros.",
    outcome: "Prompt + ferramenta",
    lessons: 5,
    duration: "1h 35min",
    progress: 0,
    cover: "/module-covers/05-posts-minutos.png",
  },
  {
    slug: "video-de-produto",
    category: "MARKETING",
    title: "Seu Produto em um Vídeo Profissional",
    description: "Crie vídeos profissionais do seu produto com menos tempo e recursos.",
    outcome: "Prompt + ferramenta",
    lessons: 6,
    duration: "1h 45min",
    progress: 0,
    cover: "/module-covers/06-video-produto.png",
  },
  {
    slug: "prospeccao-automatica",
    category: "COMERCIAL",
    title: "Prospecção que Busca Clientes por Você",
    description: "Encontre, filtre e aborde leads qualificados sem montar um time de SDR.",
    outcome: "Automação de prospecção",
    lessons: 10,
    duration: "3h 20min",
    progress: 0,
    cover: "/module-covers/07-prospeccao.png",
  },
  {
    slug: "funil-de-vendas",
    category: "COMERCIAL",
    title: "O Funil que Não Deixa Vendas Sumirem",
    description: "Conduza o cliente do primeiro contato ao fechamento com automações.",
    outcome: "Automação do funil de vendas",
    lessons: 9,
    duration: "3h 10min",
    progress: 0,
    cover: "/module-covers/08-funil-vendas.png",
  },
  {
    slug: "precificacao-inteligente",
    category: "COMERCIAL",
    title: "O Preço Certo para Cada Oferta",
    description: "Use dados e IA para precificar com confiança e identificar quem tem maior chance de comprar.",
    outcome: "Precificação e ofertas",
    lessons: 8,
    duration: "2h 50min",
    progress: 0,
    cover: "/module-covers/09-precificacao.png",
  },
];

type NavItem = { label: string; icon: LucideIcon; href: string; badge?: string };
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Aprender",
    items: [
      { label: "Início", icon: House, href: "/" },
      { label: "Formações", icon: GraduationCap, href: "/formacoes" },
      { label: "Biblioteca", icon: LibraryBig, href: "/biblioteca" },
      { label: "Meu progresso", icon: ChartNoAxesColumnIncreasing, href: "/progresso" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { label: "Feed", icon: MessageSquareText, href: "/feed", badge: "12" },
      { label: "Membros", icon: Users, href: "/membros" },
      { label: "Lives & encontros", icon: CalendarDays, href: "/encontros" },
      { label: "Oportunidades", icon: BriefcaseBusiness, href: "/oportunidades" },
    ],
  },
  {
    label: "Laboratório",
    items: [
      { label: "Agentes especialistas", icon: Bot, href: "/agentes" },
      { label: "Automações", icon: Workflow, href: "/automacoes" },
      { label: "Meus projetos", icon: Boxes, href: "/projetos" },
    ],
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const visibleTracks = tracks.filter((track) =>
    `${track.category} ${track.title} ${track.description} ${track.outcome}`.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => setActiveSlide(0), [query]);

  useEffect(() => {
    const card = carouselRef.current?.children[activeSlide] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, [activeSlide]);

  useEffect(() => {
    if (visibleTracks.length < 2) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % visibleTracks.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, [visibleTracks.length]);

  const moveSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + visibleTracks.length) % visibleTracks.length);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <img src="/logo-hagios.png" alt="Emblema Movimento Hágios" />
          <div className="brand-copy"><span>MOVIMENTO</span><strong>HÁGIOS</strong></div>
          <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>

        <nav aria-label="Navegação principal">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(({ icon: Icon, label, badge, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={href === "/" ? "active" : ""}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="nav-icon" strokeWidth={1.8} />
                  <span>{label}</span>
                  {badge && <i>{badge}</i>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: "clerk-avatar" } }} />
            <div><strong>Minha conta</strong><span>Membro Hágios</span></div>
            <button aria-label="Opções da conta"><MoreHorizontal size={20} /></button>
          </Show>
          <Show when="signed-out">
            <div className="profile-avatar">MH</div>
            <div><strong>Acesso de membro</strong><span>Entre para continuar</span></div>
            <SignInButton mode="modal"><button className="footer-login">Entrar</button></SignInButton>
          </Show>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="mobile-brand">HÁGIOS</div>
          <label className="search">
            <Search size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar formações, aulas e conteúdos" aria-label="Buscar na plataforma" />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notificações"><Bell size={19} /><i /></button>
            <button className="help-button"><CircleHelp size={17} /> Central de ajuda</button>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div><p className="kicker">ÁREA DE MEMBROS</p><h1>Continue evoluindo, Marcos.</h1><p>Conhecimento aplicado para liderar na nova economia.</p></div>
            <div className="streak"><span><Flame size={22} /></span><div><strong>7 dias</strong><small>sequência atual</small></div></div>
          </section>

          <section className="continue-card">
            <div className="continue-art" aria-hidden="true">
              <img src="/module-covers/01-vendedor-whatsapp.png" alt="" />
              <div className="continue-art-shade" />
              <span className="art-label">ATENDIMENTO · MÓDULO 01</span>
              <span className="play-medallion"><Play size={24} fill="currentColor" /></span>
            </div>
            <div className="continue-info">
              <div><span className="status-label">CONTINUE DE ONDE PAROU</span><h2>Configurando seu vendedor virtual no WhatsApp</h2><p>Qualificação e Agendamento · Aula 3 de 8</p></div>
              <div className="continue-bottom">
                <div className="progress-wrap"><div className="progress-copy"><span>Seu progresso</span><strong>35%</strong></div><div className="progress"><i style={{ width: "35%" }} /></div></div>
                <button>Continuar aula <ArrowRight size={18} /></button>
              </div>
            </div>
          </section>

          <section className="tracks-section">
            <div className="section-heading">
              <div><p className="kicker">MÓDULOS INICIAIS</p><h2>Automações para aplicar no negócio</h2></div>
              {visibleTracks.length > 1 && (
                <div className="carousel-controls">
                  <span>{String(activeSlide + 1).padStart(2, "0")} <i>/</i> {String(visibleTracks.length).padStart(2, "0")}</span>
                  <button onClick={() => moveSlide(-1)} aria-label="Formação anterior"><ChevronLeft /></button>
                  <button onClick={() => moveSlide(1)} aria-label="Próxima formação"><ChevronRight /></button>
                </div>
              )}
            </div>

            <div className="carousel-window">
              <div className="track-carousel" ref={carouselRef}>
                {visibleTracks.map((track, index) => {
                  return (
                  <article className="track-card" key={track.title}>
                    <Link className="track-art" href={`/formacoes/${track.slug}`}>
                      <img src={track.cover} alt={`Capa da formação ${track.title}`} />
                      <div className="track-overlay" />
                      <span className="track-eyebrow">{track.category}</span>
                      <span className="track-number">{String(index + 1).padStart(2, "0")}</span>
                    </Link>
                    <div className="track-body">
                      <h3>{track.title}</h3>
                      <p>{track.description}</p>
                      <span className="track-outcome">{track.outcome}</span>
                      <div className="track-meta"><span><BookOpen /> {track.lessons} aulas</span><span><Clock3 /> {track.duration}</span></div>
                      {track.progress > 0 ? (
                        <div className="mini-progress"><div><span>Em andamento</span><strong>{track.progress}%</strong></div><div className="progress"><i style={{ width: `${track.progress}%` }} /></div></div>
                      ) : (
                        <Link className="start-track" href={`/formacoes/${track.slug}`}>Conhecer formação <ArrowUpRight /></Link>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>
            <div className="carousel-dots" aria-label="Selecionar formação">
              {visibleTracks.map((track, index) => <button key={track.title} className={activeSlide === index ? "active" : ""} onClick={() => setActiveSlide(index)} aria-label={`Ir para ${track.title}`} />)}
            </div>
            {visibleTracks.length === 0 && <div className="empty-state">Nenhuma formação encontrada para “{query}”.</div>}
          </section>

          <section className="audience-section audience-editorial">
            <div className="audience-intro"><p className="kicker">QUEM CONSTRÓI COM A GENTE</p><h2>Quatro ambições.<br />Um mesmo movimento.</h2><p>Aprendizado aplicado para quem quer usar inteligência artificial como vantagem concreta — no negócio, na carreira ou em um novo produto.</p></div>
            <div className="audience-cards">
              {[
                ["01", "Empresários", "Mais faturamento, margem e vantagem competitiva com IA."],
                ["02", "Profissionais", "Escala de carreira criando tecnologia dentro de empresas."],
                ["03", "Gestores de IA", "Serviços de agentes, automações e produtos inteligentes."],
                ["04", "Builders", "SaaS, aplicativos e plataformas do zero — sem precisar programar."],
              ].map(([number, title, text]) => (
                <article key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
