"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton, useUser } from "@clerk/react";
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
  CreditCard,
  Flame,
  GraduationCap,
  House,
  LibraryBig,
  Lock,
  Menu,
  MessageSquareText,
  Play,
  Search,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { modules, moduleDuration, getLesson } from "./content";
import {
  getLast,
  moduleProgress,
  overallProgress,
  touchStreak,
} from "./lib/progress";
import { PLANOS } from "./lib/planos";
import {
  AvisoCancelamentoAgendado,
  AvisoPagamentoPendente,
} from "./componentes/AvisosAssinatura";
import { MenuDaConta } from "./componentes/MenuDaConta";
import { Paywall } from "./componentes/Paywall";
import { useAssinatura } from "./componentes/useAssinatura";
import { usePortal } from "./componentes/useCobranca";
import "./estilos/assinatura.css";

type NavItem = { label: string; icon: LucideIcon; badge?: string; href?: string };
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Aprender",
    items: [
      { label: "Início", icon: House, href: "/" },
      { label: "Formações", icon: GraduationCap },
      { label: "Biblioteca", icon: LibraryBig },
      { label: "Meu progresso", icon: ChartNoAxesColumnIncreasing },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { label: "Feed", icon: MessageSquareText, badge: "12" },
      { label: "Membros", icon: Users },
      { label: "Lives & encontros", icon: CalendarDays },
      { label: "Oportunidades", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Laboratório",
    items: [
      { label: "Agentes especialistas", icon: Bot },
      { label: "Automações", icon: Workflow },
      { label: "Meus projetos", icon: Boxes },
    ],
  },
];

export default function Home() {
  const { user, isSignedIn } = useUser();
  const [activeNav, setActiveNav] = useState("Início");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Progresso real (localStorage) — só após montar para evitar mismatch de hidratação.
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [overall, setOverall] = useState(0);
  const [progressBySlug, setProgressBySlug] = useState<Record<string, number>>({});
  const [last, setLastState] = useState<{ moduleSlug: string; lessonId: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    setStreak(touchStreak());
    setOverall(overallProgress());
    setLastState(getLast());
    const map: Record<string, number> = {};
    for (const m of modules) map[m.slug] = moduleProgress(m.slug);
    setProgressBySlug(map);
  }, []);

  // Estado real da assinatura (GET /api/assinatura, com o metadata do Clerk
  // como rede de segurança). Ver docs/contrato.md.
  const conta = useAssinatura();
  const portal = usePortal();
  // `temAcesso` já inclui `past_due` — o acesso só cai em `canceled`, e o tom
  // ali é de aviso, não de bloqueio (ver docs/contrato.md, regra de acesso).
  const acessoLiberado = conta.assinatura.temAcesso;
  const mostrarPaywall = !conta.carregando && !acessoLiberado;

  const rotuloDaConta =
    conta.assinatura.status === "past_due"
      ? "Pagamento pendente"
      : acessoLiberado
        ? conta.assinatura.plano
          ? `Membro · plano ${PLANOS[conta.assinatura.plano].nome.toLowerCase()}`
          : "Membro Hágios"
        : "Acesso limitado";

  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "membro";

  const visibleModules = modules.filter((m) =>
    `${m.category} ${m.title} ${m.description} ${m.outcome}`.toLowerCase().includes(query.toLowerCase()),
  );

  // "Continue de onde parou": última aula acessada ou a primeira aula do curso.
  const continueLesson = useMemo(() => {
    const target = last ?? { moduleSlug: modules[0].slug, lessonId: modules[0].lessons[0].id };
    return getLesson(target.moduleSlug, target.lessonId) ?? getLesson(modules[0].slug, modules[0].lessons[0].id)!;
  }, [last]);
  const continueProgress = mounted ? (progressBySlug[continueLesson.module.slug] ?? 0) : 0;

  useEffect(() => setActiveSlide(0), [query]);

  useEffect(() => {
    const card = carouselRef.current?.children[activeSlide] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, [activeSlide]);

  useEffect(() => {
    if (visibleModules.length < 2) return;
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % visibleModules.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, [visibleModules.length]);

  const moveSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + visibleModules.length) % visibleModules.length);
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
              {group.items.map(({ icon: Icon, label, badge }) => (
                <button
                  key={label}
                  className={activeNav === label ? "active" : ""}
                  onClick={() => { setActiveNav(label); setMenuOpen(false); }}
                >
                  <Icon className="nav-icon" strokeWidth={1.8} />
                  <span>{label}</span>
                  {badge && <i>{badge}</i>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Show when="signed-in">
            <UserButton appearance={{ elements: { avatarBox: "clerk-avatar" } }}>
              <UserButton.MenuItems>
                <UserButton.Action
                  label="Gerenciar assinatura"
                  labelIcon={<CreditCard size={15} aria-hidden="true" />}
                  onClick={() => void portal.abrir()}
                />
              </UserButton.MenuItems>
            </UserButton>
            <div><strong>Minha conta</strong><span>{rotuloDaConta}</span></div>
            <MenuDaConta />
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
            <div>
              <p className="kicker">ÁREA DE MEMBROS</p>
              <h1>{isSignedIn ? `Continue evoluindo, ${firstName}.` : "Bem-vindo ao Movimento Hágios."}</h1>
              <p>Conhecimento aplicado para liderar na nova economia.</p>
            </div>
            <div className="streak"><span><Flame size={22} /></span><div><strong>{mounted ? streak : 0} {mounted && streak === 1 ? "dia" : "dias"}</strong><small>sequência atual</small></div></div>
          </section>

          <AvisoPagamentoPendente estado={conta} />
          <AvisoCancelamentoAgendado estado={conta} />

          {mostrarPaywall && <Paywall estado={conta} />}

          {acessoLiberado && (
          <section className="continue-card">
            <Link href={`/formacoes/${continueLesson.module.slug}/${continueLesson.lesson.id}`} className="continue-art" aria-label={`Abrir aula ${continueLesson.lesson.title}`}>
              <img src={continueLesson.module.cover} alt="" />
              <div className="continue-art-shade" />
              <span className="art-label">{continueLesson.module.category} · AULA {String(continueLesson.index + 1).padStart(2, "0")}</span>
              <span className="play-medallion"><Play size={24} fill="currentColor" /></span>
            </Link>
            <div className="continue-info">
              <div><span className="status-label">CONTINUE DE ONDE PAROU</span><h2>{continueLesson.lesson.title}</h2><p>{continueLesson.module.title} · Aula {continueLesson.index + 1} de {continueLesson.module.lessons.length}</p></div>
              <div className="continue-bottom">
                <div className="progress-wrap"><div className="progress-copy"><span>Seu progresso no módulo</span><strong>{continueProgress}%</strong></div><div className="progress"><i style={{ width: `${continueProgress}%` }} /></div></div>
                <Link href={`/formacoes/${continueLesson.module.slug}/${continueLesson.lesson.id}`} className="continue-cta">{continueProgress > 0 ? "Continuar aula" : "Começar agora"} <ArrowRight size={18} /></Link>
              </div>
            </div>
          </section>
          )}

          <section className="tracks-section">
            <div className="section-heading">
              <div><p className="kicker">FORMAÇÕES</p><h2>Automações para aplicar no negócio</h2></div>
              {visibleModules.length > 1 && (
                <div className="carousel-controls">
                  <span>{String(activeSlide + 1).padStart(2, "0")} <i>/</i> {String(visibleModules.length).padStart(2, "0")}</span>
                  <button onClick={() => moveSlide(-1)} aria-label="Formação anterior"><ChevronLeft /></button>
                  <button onClick={() => moveSlide(1)} aria-label="Próxima formação"><ChevronRight /></button>
                </div>
              )}
            </div>

            <div className="carousel-window">
              <div className="track-carousel" ref={carouselRef}>
                {visibleModules.map((module, index) => {
                  const progress = mounted ? (progressBySlug[module.slug] ?? 0) : 0;
                  return (
                  <article className="track-card" key={module.slug}>
                    <Link href={`/formacoes/${module.slug}`} className="track-art">
                      <img src={module.cover} alt={`Capa do módulo ${module.title}`} />
                      <div className="track-overlay" />
                      <span className="track-eyebrow">{module.category}</span>
                      <span className="track-number">{String(index + 1).padStart(2, "0")}</span>
                      {!acessoLiberado && <span className="track-lock" title="Conteúdo de membro"><Lock size={14} aria-hidden="true" /><span className="visualmente-oculto">Conteúdo de membro</span></span>}
                    </Link>
                    <div className="track-body">
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                      <span className="track-outcome">{module.outcome}</span>
                      <div className="track-meta"><span><BookOpen /> {module.lessons.length} aulas</span><span><Clock3 /> {moduleDuration(module)}</span></div>
                      {progress > 0 ? (
                        <Link href={`/formacoes/${module.slug}`} className="mini-progress mini-progress--link"><div><span>Em andamento</span><strong>{progress}%</strong></div><div className="progress"><i style={{ width: `${progress}%` }} /></div></Link>
                      ) : (
                        <Link href={`/formacoes/${module.slug}`} className="start-track">Conhecer formação <ArrowUpRight /></Link>
                      )}
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>
            <div className="carousel-dots" aria-label="Selecionar formação">
              {visibleModules.map((module, index) => <button key={module.slug} className={activeSlide === index ? "active" : ""} onClick={() => setActiveSlide(index)} aria-label={`Ir para ${module.title}`} />)}
            </div>
            {visibleModules.length === 0 && <div className="empty-state">Nenhuma formação encontrada para “{query}”.</div>}
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
