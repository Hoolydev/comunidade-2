"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/react";
import {
  Bell,
  Bot,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CircleHelp,
  GraduationCap,
  House,
  LibraryBig,
  ListVideo,
  Menu,
  MessageSquareText,
  Search,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

type NavItem = { label: string; icon: LucideIcon; href: string; badge?: string };

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Aprender", items: [
    { label: "Início", icon: House, href: "/" },
    { label: "Formações", icon: GraduationCap, href: "/formacoes" },
    { label: "Biblioteca", icon: LibraryBig, href: "/biblioteca" },
    { label: "Meu progresso", icon: ChartNoAxesColumnIncreasing, href: "/progresso" },
  ] },
  { label: "Comunidade", items: [
    { label: "Feed", icon: MessageSquareText, href: "/feed", badge: "12" },
    { label: "Membros", icon: Users, href: "/membros" },
    { label: "Lives & encontros", icon: CalendarDays, href: "/encontros" },
    { label: "Oportunidades", icon: BriefcaseBusiness, href: "/oportunidades" },
  ] },
  { label: "Laboratório", items: [
    { label: "Agentes especialistas", icon: Bot, href: "/agentes" },
    { label: "Automações", icon: Workflow, href: "/automacoes" },
    { label: "Meus projetos", icon: Boxes, href: "/projetos" },
    { label: "Gestão de conteúdo", icon: ListVideo, href: "/admin/conteudos" },
  ] },
];

export function AreaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
        <div className="brand">
          <Link href="/" className="area-brand">
            <img src="/logo-hagios.png" alt="Emblema Movimento Hágios" />
            <div className="brand-copy"><span>Movimento</span><strong>HÁGIOS</strong></div>
          </Link>
          <button type="button" className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X /></button>
        </div>
        <nav aria-label="Navegação principal">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map(({ icon: Icon, label, href, badge }) => (
                <Link key={href} href={href} className={isActive(href) ? "active" : ""} onClick={() => setMenuOpen(false)}>
                  <Icon className="nav-icon" strokeWidth={1.8} />
                  <span>{label}</span>
                  {badge && <i>{badge}</i>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Show when="signed-in"><UserButton appearance={{ elements: { avatarBox: "clerk-avatar" } }} /><div><strong>Minha conta</strong><span>Membro Hágios</span></div></Show>
          <Show when="signed-out"><div className="profile-avatar">MH</div><div><strong>Acesso de membro</strong><span>Entre para continuar</span></div><SignInButton mode="modal"><button className="footer-login">Entrar</button></SignInButton></Show>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="mobile-brand">HÁGIOS</div>
          <form className="search" onSubmit={(event) => { event.preventDefault(); router.push(`/formacoes?busca=${encodeURIComponent(query)}`); }}>
            <Search size={19} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar formações, aulas e conteúdos" aria-label="Buscar na plataforma" />
            <kbd>↵</kbd>
          </form>
          <div className="top-actions">
            <button className="icon-button" aria-label="Notificações"><Bell size={19} /><i /></button>
            <Link className="help-button" href="/feed"><CircleHelp size={17} /> Central de ajuda</Link>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
