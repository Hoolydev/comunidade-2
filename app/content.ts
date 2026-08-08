// ---------------------------------------------------------------------------
// Conteúdo da comunidade (módulos + aulas).
//
// Este é o ÚNICO lugar para adicionar/editar formações e aulas. Cada aula tem
// um `youtubeId` — o trecho final da URL do YouTube.
//
//   URL:  https://www.youtube.com/watch?v=jNQXAC9IVRw
//   URL:  https://youtu.be/jNQXAC9IVRw
//                                     ^^^^^^^^^^^  <- este é o youtubeId
//
// Regras:
//   - youtubeId: ""      -> aula aparece como "Em breve" (sem player).
//   - free: true         -> aula liberada como prévia, mesmo sem assinatura.
//   - Todo o resto exige assinatura ativa (publicMetadata.assinatura no Clerk).
//
// O youtubeId só é entregue ao navegador via /api/lesson depois de checar a
// assinatura no servidor, então links de vídeo pagos não vazam no bundle.
// ---------------------------------------------------------------------------

export type Lesson = {
  id: string; // slug único dentro do módulo
  title: string;
  duration: string; // ex.: "18min"
  youtubeId: string; // "" = em breve
  free?: boolean; // prévia liberada sem assinatura
};

export type Category = "ATENDIMENTO" | "MARKETING" | "COMERCIAL";

export type Module = {
  slug: string; // usado na URL: /formacoes/<slug>
  category: Category;
  title: string;
  description: string;
  outcome: string;
  cover: string;
  lessons: Lesson[];
};

// Vídeo de demonstração (primeiro vídeo público do YouTube). Troque pelo seu.
const DEMO = "jNQXAC9IVRw";

export const modules: Module[] = [
  {
    slug: "vendedor-whatsapp",
    category: "ATENDIMENTO",
    title: "O Vendedor Virtual 24h no WhatsApp",
    description:
      "Pare de perder clientes para o concorrente porque você demorou para responder no WhatsApp.",
    outcome: "Qualificação e agendamento",
    cover: "/module-covers/01-vendedor-whatsapp.png",
    lessons: [
      { id: "boas-vindas", title: "Boas-vindas e visão geral do módulo", duration: "8min", youtubeId: DEMO, free: true },
      { id: "mapa-atendimento", title: "Mapeando seu atendimento atual", duration: "14min", youtubeId: "" },
      { id: "ferramentas", title: "As ferramentas que vamos usar", duration: "17min", youtubeId: "" },
      { id: "conectando-whatsapp", title: "Conectando o WhatsApp ao agente", duration: "22min", youtubeId: "" },
      { id: "qualificacao", title: "Qualificando o lead automaticamente", duration: "26min", youtubeId: "" },
      { id: "agendamento", title: "Agendando reuniões sem intervenção humana", duration: "24min", youtubeId: "" },
      { id: "handoff", title: "Passando a conversa para um humano", duration: "16min", youtubeId: "" },
      { id: "publicando", title: "Publicando e monitorando resultados", duration: "19min", youtubeId: "" },
    ],
  },
  {
    slug: "suporte-pos-venda",
    category: "ATENDIMENTO",
    title: "Não Perca Mais Tempo no Suporte",
    description:
      "Reduza em até 70% o volume de chamados sem precisar contratar mais atendentes.",
    outcome: "Suporte e pós-venda",
    cover: "/module-covers/02-suporte-pos-venda.png",
    lessons: [
      { id: "introducao", title: "Por que o suporte trava seu crescimento", duration: "11min", youtubeId: "" },
      { id: "base-conhecimento", title: "Montando a base de conhecimento", duration: "20min", youtubeId: "" },
      { id: "faq-automatico", title: "FAQ automático que realmente resolve", duration: "18min", youtubeId: "" },
      { id: "triagem", title: "Triagem inteligente de chamados", duration: "22min", youtubeId: "" },
      { id: "pos-venda", title: "Automação de pós-venda e satisfação", duration: "19min", youtubeId: "" },
      { id: "escalonamento", title: "Quando e como escalar para o time", duration: "15min", youtubeId: "" },
      { id: "metrica", title: "Medindo redução de chamados", duration: "13min", youtubeId: "" },
    ],
  },
  {
    slug: "crm-automatico",
    category: "ATENDIMENTO",
    title: "O Sistema Antiesquecimento de Clientes",
    description:
      "Recupere vendas perdidas no seu funil com cobranças, lembretes e ofertas automáticas.",
    outcome: "CRM automático",
    cover: "/module-covers/03-crm-automatico.png",
    lessons: [
      { id: "conceito", title: "O conceito do CRM antiesquecimento", duration: "12min", youtubeId: "" },
      { id: "estrutura", title: "Estruturando estágios e etiquetas", duration: "21min", youtubeId: "" },
      { id: "lembretes", title: "Lembretes e follow-ups automáticos", duration: "24min", youtubeId: "" },
      { id: "cobranca", title: "Cobranças que recuperam vendas", duration: "20min", youtubeId: "" },
      { id: "ofertas", title: "Ofertas automáticas por comportamento", duration: "23min", youtubeId: "" },
      { id: "reativacao", title: "Reativando clientes inativos", duration: "18min", youtubeId: "" },
      { id: "integracoes", title: "Integrando com WhatsApp e e-mail", duration: "22min", youtubeId: "" },
      { id: "painel", title: "Painel de acompanhamento", duration: "16min", youtubeId: "" },
      { id: "escala", title: "Escalando sem perder o toque humano", duration: "17min", youtubeId: "" },
    ],
  },
  {
    slug: "clone-video",
    category: "MARKETING",
    title: "Faça Seu Clone Trabalhar por Você",
    description:
      "Crie vídeos com seu clone e mantenha a constância na criação de conteúdo.",
    outcome: "Clone em vídeo",
    cover: "/module-covers/04-clone-video.png",
    lessons: [
      { id: "introducao", title: "O que é um clone de vídeo com IA", duration: "10min", youtubeId: "" },
      { id: "gravacao", title: "Gravando o material-base do seu clone", duration: "19min", youtubeId: "" },
      { id: "treino", title: "Treinando e ajustando o clone", duration: "23min", youtubeId: "" },
      { id: "roteiro", title: "Roteiros que soam naturais", duration: "17min", youtubeId: "" },
      { id: "producao", title: "Produzindo vídeos em lote", duration: "21min", youtubeId: "" },
      { id: "constancia", title: "Mantendo constância de publicação", duration: "14min", youtubeId: "" },
    ],
  },
  {
    slug: "posts-minutos",
    category: "MARKETING",
    title: "Seus Posts Feitos em Minutos",
    description:
      "Produza artes profissionais sem passar horas no Canva ou depender de terceiros.",
    outcome: "Prompt + ferramenta",
    cover: "/module-covers/05-posts-minutos.png",
    lessons: [
      { id: "introducao", title: "Do briefing ao post em minutos", duration: "9min", youtubeId: "" },
      { id: "prompts", title: "Prompts para artes profissionais", duration: "18min", youtubeId: "" },
      { id: "identidade", title: "Mantendo a identidade visual", duration: "16min", youtubeId: "" },
      { id: "carrosseis", title: "Carrosséis que engajam", duration: "20min", youtubeId: "" },
      { id: "fluxo", title: "Fluxo de produção semanal", duration: "15min", youtubeId: "" },
    ],
  },
  {
    slug: "video-produto",
    category: "MARKETING",
    title: "Seu Produto em um Vídeo Profissional",
    description:
      "Crie vídeos profissionais do seu produto com menos tempo e recursos.",
    outcome: "Prompt + ferramenta",
    cover: "/module-covers/06-video-produto.png",
    lessons: [
      { id: "introducao", title: "Anatomia de um vídeo de produto", duration: "11min", youtubeId: "" },
      { id: "cenas", title: "Gerando cenas com IA", duration: "19min", youtubeId: "" },
      { id: "narracao", title: "Narração e trilha automáticas", duration: "17min", youtubeId: "" },
      { id: "edicao", title: "Edição rápida sem experiência", duration: "22min", youtubeId: "" },
      { id: "variacoes", title: "Variações para testar anúncios", duration: "16min", youtubeId: "" },
      { id: "publicacao", title: "Publicando e medindo conversão", duration: "14min", youtubeId: "" },
    ],
  },
  {
    slug: "prospeccao",
    category: "COMERCIAL",
    title: "Prospecção que Busca Clientes por Você",
    description:
      "Encontre, filtre e aborde leads qualificados sem montar um time de SDR.",
    outcome: "Automação de prospecção",
    cover: "/module-covers/07-prospeccao.png",
    lessons: [
      { id: "introducao", title: "O novo jogo da prospecção com IA", duration: "12min", youtubeId: "" },
      { id: "icp", title: "Definindo seu cliente ideal (ICP)", duration: "18min", youtubeId: "" },
      { id: "fontes", title: "Fontes de leads e coleta", duration: "21min", youtubeId: "" },
      { id: "enriquecimento", title: "Enriquecendo dados dos leads", duration: "19min", youtubeId: "" },
      { id: "filtragem", title: "Filtragem e priorização", duration: "17min", youtubeId: "" },
      { id: "abordagem", title: "Mensagens de abordagem que respondem", duration: "23min", youtubeId: "" },
      { id: "cadencia", title: "Cadência de follow-up automática", duration: "20min", youtubeId: "" },
      { id: "integracao-crm", title: "Integrando com seu CRM", duration: "16min", youtubeId: "" },
      { id: "escala", title: "Escalando a operação", duration: "18min", youtubeId: "" },
      { id: "metricas", title: "Métricas que importam", duration: "13min", youtubeId: "" },
    ],
  },
  {
    slug: "funil-vendas",
    category: "COMERCIAL",
    title: "O Funil que Não Deixa Vendas Sumirem",
    description:
      "Conduza o cliente do primeiro contato ao fechamento com automações.",
    outcome: "Automação do funil de vendas",
    cover: "/module-covers/08-funil-vendas.png",
    lessons: [
      { id: "introducao", title: "Desenhando o funil ideal", duration: "12min", youtubeId: "" },
      { id: "captura", title: "Captura e entrada de leads", duration: "18min", youtubeId: "" },
      { id: "nutricao", title: "Nutrição automática por etapa", duration: "22min", youtubeId: "" },
      { id: "qualificacao", title: "Qualificação e passagem de bastão", duration: "19min", youtubeId: "" },
      { id: "proposta", title: "Propostas e follow-up de fechamento", duration: "21min", youtubeId: "" },
      { id: "objecoes", title: "Tratando objeções com IA", duration: "17min", youtubeId: "" },
      { id: "fechamento", title: "Automação de fechamento", duration: "20min", youtubeId: "" },
      { id: "pos", title: "Pós-venda e recompra", duration: "15min", youtubeId: "" },
      { id: "painel", title: "Painel do funil ponta a ponta", duration: "16min", youtubeId: "" },
    ],
  },
  {
    slug: "precificacao",
    category: "COMERCIAL",
    title: "O Preço Certo para Cada Oferta",
    description:
      "Use dados e IA para precificar com confiança e identificar quem tem maior chance de comprar.",
    outcome: "Precificação e ofertas",
    cover: "/module-covers/09-precificacao.png",
    lessons: [
      { id: "introducao", title: "Precificar é estratégia, não chute", duration: "11min", youtubeId: "" },
      { id: "custos", title: "Entendendo custos e margem", duration: "17min", youtubeId: "" },
      { id: "dados", title: "Coletando dados de mercado com IA", duration: "20min", youtubeId: "" },
      { id: "modelos", title: "Modelos de precificação", duration: "22min", youtubeId: "" },
      { id: "propensao", title: "Prevendo propensão de compra", duration: "23min", youtubeId: "" },
      { id: "ofertas", title: "Montando ofertas irresistíveis", duration: "18min", youtubeId: "" },
      { id: "testes", title: "Testando preços com segurança", duration: "16min", youtubeId: "" },
      { id: "revisao", title: "Revisão contínua de preços", duration: "14min", youtubeId: "" },
    ],
  },
];

// --------------------------- Helpers de leitura ----------------------------

export function getModule(slug: string): Module | undefined {
  return modules.find((m) => m.slug === slug);
}

export function getLesson(
  moduleSlug: string,
  lessonId: string,
): { module: Module; lesson: Lesson; index: number } | undefined {
  const module = getModule(moduleSlug);
  if (!module) return undefined;
  const index = module.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return undefined;
  return { module, lesson: module.lessons[index], index };
}

export function lessonKey(moduleSlug: string, lessonId: string): string {
  return `${moduleSlug}/${lessonId}`;
}

export function totalLessons(): number {
  return modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

// Soma as durações das aulas ("22min") e formata como "2h 40min".
export function moduleDuration(module: Module): string {
  const minutes = module.lessons.reduce((sum, l) => {
    const match = l.duration.match(/(\d+)\s*min/);
    return sum + (match ? Number(match[1]) : 0);
  }, 0);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h ${String(rest).padStart(2, "0")}min`;
}
