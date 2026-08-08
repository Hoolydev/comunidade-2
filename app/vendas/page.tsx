"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
} from "lucide-react";

const modules = [
  ["/module-covers/01-vendedor-whatsapp.png", "Atendimento", "Vendedor virtual 24h no WhatsApp"],
  ["/module-covers/02-suporte-pos-venda.png", "Atendimento", "Suporte e pós-venda automatizados"],
  ["/module-covers/03-crm-automatico.png", "Atendimento", "Sistema antiesquecimento e CRM"],
  ["/module-covers/04-clone-video.png", "Marketing", "Seu clone produzindo vídeos"],
  ["/module-covers/05-posts-minutos.png", "Marketing", "Posts profissionais em minutos"],
  ["/module-covers/06-video-produto.png", "Marketing", "Vídeos profissionais de produto"],
  ["/module-covers/07-prospeccao.png", "Comercial", "Prospecção automática de clientes"],
  ["/module-covers/08-funil-vendas.png", "Comercial", "Funil de vendas automatizado"],
  ["/module-covers/09-precificacao.png", "Comercial", "Precificação e ofertas com IA"],
] as const;

export default function SalesPage() {
  return (
    <main className="sales-page">
      <header className="sales-nav">
        <Link href="/vendas" className="sales-brand"><img src="/logo-hagios.png" alt="" /><span><small>MOVIMENTO</small><strong>HÁGIOS</strong></span></Link>
        <nav><a href="#formacao">Formação</a><a href="#para-quem">Para quem</a><a href="#oferta">Acesso</a></nav>
        <div className="sales-nav-actions">
          <Show when="signed-out"><SignInButton mode="modal"><button className="sales-login">Já sou membro</button></SignInButton></Show>
          <Show when="signed-in"><Link href="/" className="sales-login">Acessar comunidade</Link></Show>
        </div>
      </header>

      <section className="sales-hero">
        <div className="sales-hero-copy">
          <span className="sales-kicker">COMUNIDADE + FORMAÇÃO APLICADA</span>
          <h1>Transforme a IA em <em>resultado real</em> para o seu negócio.</h1>
          <p>Aprenda a construir agentes e automações que atendem, vendem e produzem — sem depender de um time técnico.</p>
          <div className="sales-hero-actions">
            <Show when="signed-out"><SignUpButton mode="modal" forceRedirectUrl="/assinar"><button className="sales-primary">Quero entrar no Movimento <ArrowRight /></button></SignUpButton></Show>
            <Show when="signed-in"><Link href="/assinar" className="sales-primary">Quero entrar no Movimento <ArrowRight /></Link></Show>
            <a href="#formacao" className="sales-secondary">Conhecer os módulos</a>
          </div>
          <div className="sales-proof"><span><Check /> Aplicação prática</span><span><Check /> Sem precisar programar</span><span><Check /> Comunidade ativa</span></div>
        </div>
        <div className="sales-hero-visual">
          <div className="sales-cover-stack">
            <img src="/module-covers/07-prospeccao.png" alt="Prospecção automática com IA" />
            <img src="/module-covers/01-vendedor-whatsapp.png" alt="Vendedor virtual no WhatsApp" />
            <img src="/module-covers/04-clone-video.png" alt="Clone para produção de vídeos" />
          </div>
          <div className="sales-stat sales-stat--one"><strong>9 módulos</strong><span>problemas reais, soluções aplicáveis</span></div>
        </div>
      </section>

      <section className="sales-modules" id="formacao">
        <div className="sales-section-heading"><span>O QUE VOCÊ VAI CONSTRUIR</span><h2>Nove módulos. Uma empresa mais inteligente.</h2><p>Cada módulo parte de um problema real e termina com uma automação pronta para aplicar.</p></div>
        <div className="sales-module-grid">
          {modules.map(([cover, category, title], index) => (
            <article key={title}><div className="sales-module-cover"><img src={cover} alt="" /><span>{String(index + 1).padStart(2, "0")}</span></div><div className="sales-module-copy"><small>{category}</small><h3>{title}</h3></div></article>
          ))}
        </div>
      </section>

      <section className="sales-audience" id="para-quem">
        <div><span>PARA QUEM É</span><h2>Para quem não quer assistir a transformação de fora.</h2></div>
        <div className="sales-audience-list">
          {[
            "Empresários que querem aumentar faturamento e margem com IA",
            "Profissionais que querem escalar a carreira criando tecnologia",
            "Gestores de agentes e automações que querem prestar serviços",
            "Builders que querem tirar um SaaS ou aplicativo do papel",
          ].map((item) => <p key={item}><Check /> {item}</p>)}
        </div>
      </section>

      <section className="sales-offer" id="oferta">
        <div className="sales-offer-copy"><span>ACESSO FUNDADOR</span><h2>Entre na comunidade que está construindo a nova economia.</h2><p>Formação completa, atualizações, encontros e apoio para aplicar IA no mundo real.</p><div className="secure-note"><span>CHECKOUT SEGURO</span><p>Pagamento processado pela Stripe</p></div></div>
        <div className="sales-offer-card">
          <small>MOVIMENTO HÁGIOS</small><h3>Acesso completo</h3>
          <ul><li><Check /> 9 módulos práticos iniciais</li><li><Check /> Comunidade e networking</li><li><Check /> Lives e novos conteúdos</li><li><Check /> Agentes especialistas</li></ul>
          <p>Condição de lançamento definida no checkout</p>
          <Show when="signed-out"><SignUpButton mode="modal" forceRedirectUrl="/assinar"><button>Garantir meu acesso <ArrowRight /></button></SignUpButton></Show>
          <Show when="signed-in"><Link href="/assinar">Garantir meu acesso <ArrowRight /></Link></Show>
        </div>
      </section>

      <footer className="sales-footer"><span>© 2026 Movimento Hágios</span><Link href="/entrar">Área de membros</Link></footer>
    </main>
  );
}
