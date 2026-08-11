export type Formacao = {
  slug: string;
  category: string;
  title: string;
  description: string;
  outcome: string;
  lessons: number;
  duration: string;
  progress: number;
  cover: string;
  level: string;
  lessonTitles: string[];
};

export const formacoes: Formacao[] = [
  {
    slug: "vendedor-virtual-whatsapp",
    category: "Atendimento",
    title: "O Vendedor Virtual 24h no WhatsApp",
    description: "Pare de perder clientes por demora no atendimento e transforme conversas em oportunidades qualificadas.",
    outcome: "Qualificação e agendamento",
    lessons: 8,
    duration: "2h 40min",
    progress: 35,
    cover: "/module-covers/01-vendedor-whatsapp.png",
    level: "Essencial",
    lessonTitles: ["Visão geral do vendedor virtual", "Mapeando perguntas e objeções", "Configurando o fluxo no WhatsApp", "Qualificação automática de leads", "Agendamento sem atrito", "Integração com o comercial", "Indicadores de atendimento", "Projeto final"],
  },
  {
    slug: "suporte-pos-venda",
    category: "Atendimento",
    title: "Não Perca Mais Tempo no Suporte",
    description: "Reduza o volume de chamados repetitivos com uma base de conhecimento e respostas inteligentes.",
    outcome: "Suporte e pós-venda",
    lessons: 7,
    duration: "2h 10min",
    progress: 0,
    cover: "/module-covers/02-suporte-pos-venda.png",
    level: "Essencial",
    lessonTitles: ["Diagnóstico do suporte", "Base de conhecimento", "Triagem automática", "Respostas com contexto", "Escalonamento humano", "Pós-venda inteligente", "Projeto final"],
  },
  {
    slug: "crm-antiesquecimento",
    category: "Atendimento",
    title: "O Sistema Antiesquecimento de Clientes",
    description: "Recupere vendas perdidas com lembretes, cobranças e ofertas acionadas no momento certo.",
    outcome: "CRM automático",
    lessons: 9,
    duration: "3h 05min",
    progress: 0,
    cover: "/module-covers/03-crm-automatico.png",
    level: "Intermediário",
    lessonTitles: ["O CRM que trabalha sozinho", "Etapas do relacionamento", "Captura de contatos", "Follow-up automático", "Cobranças e lembretes", "Ofertas de reativação", "Alertas para vendedores", "Painel de oportunidades", "Projeto final"],
  },
  {
    slug: "clone-em-video",
    category: "Marketing",
    title: "Faça Seu Clone Trabalhar por Você",
    description: "Crie vídeos com seu clone e mantenha constância sem depender de gravações diárias.",
    outcome: "Clone em vídeo",
    lessons: 6,
    duration: "1h 50min",
    progress: 0,
    cover: "/module-covers/04-clone-video.png",
    level: "Intermediário",
    lessonTitles: ["Estratégia do clone", "Preparação da imagem", "Preparação da voz", "Roteiros naturais", "Produção em escala", "Projeto final"],
  },
  {
    slug: "posts-em-minutos",
    category: "Marketing",
    title: "Seus Posts Feitos em Minutos",
    description: "Produza peças profissionais com direção visual, consistência e agilidade.",
    outcome: "Prompt + ferramenta",
    lessons: 5,
    duration: "1h 35min",
    progress: 0,
    cover: "/module-covers/05-posts-minutos.png",
    level: "Essencial",
    lessonTitles: ["Sistema visual da marca", "Prompts para conteúdo", "Produção de carrosséis", "Calendário editorial", "Projeto final"],
  },
  {
    slug: "video-de-produto",
    category: "Marketing",
    title: "Seu Produto em um Vídeo Profissional",
    description: "Transforme imagens de produto em campanhas audiovisuais de alto impacto.",
    outcome: "Prompt + ferramenta",
    lessons: 6,
    duration: "1h 45min",
    progress: 0,
    cover: "/module-covers/06-video-produto.png",
    level: "Intermediário",
    lessonTitles: ["Direção criativa", "Preparação do produto", "Cenas e movimentos", "Roteiro comercial", "Finalização", "Projeto final"],
  },
  {
    slug: "prospeccao-automatica",
    category: "Comercial",
    title: "Prospecção que Busca Clientes por Você",
    description: "Encontre, filtre e aborde leads qualificados sem montar um grande time de SDR.",
    outcome: "Automação de prospecção",
    lessons: 10,
    duration: "3h 20min",
    progress: 0,
    cover: "/module-covers/07-prospeccao.png",
    level: "Avançado",
    lessonTitles: ["Estratégia de prospecção", "Perfil de cliente ideal", "Fontes de dados", "Enriquecimento de leads", "Score de oportunidade", "Personalização com IA", "Cadência multicanal", "Respostas e objeções", "Métricas comerciais", "Projeto final"],
  },
  {
    slug: "funil-de-vendas",
    category: "Comercial",
    title: "O Funil que Não Deixa Vendas Sumirem",
    description: "Conduza cada cliente do primeiro contato até o fechamento com automações claras.",
    outcome: "Automação do funil de vendas",
    lessons: 9,
    duration: "3h 10min",
    progress: 0,
    cover: "/module-covers/08-funil-vendas.png",
    level: "Intermediário",
    lessonTitles: ["Desenho do funil", "Entrada de oportunidades", "Qualificação", "Nutrição", "Propostas", "Follow-up", "Recuperação", "Painel comercial", "Projeto final"],
  },
  {
    slug: "precificacao-inteligente",
    category: "Comercial",
    title: "O Preço Certo para Cada Oferta",
    description: "Use dados e IA para precificar com confiança e construir ofertas mais rentáveis.",
    outcome: "Precificação e ofertas",
    lessons: 8,
    duration: "2h 50min",
    progress: 0,
    cover: "/module-covers/09-precificacao.png",
    level: "Avançado",
    lessonTitles: ["Fundamentos de preço", "Custos e margem", "Valor percebido", "Pesquisa competitiva", "Segmentação", "Ofertas dinâmicas", "Painel de decisão", "Projeto final"],
  },
];

export const materiais = [
  { slug: "mapa-de-automacoes", type: "Planilha", title: "Mapa de automações da empresa", description: "Priorize processos por impacto, esforço e retorno esperado.", meta: "15 min" },
  { slug: "checklist-agente-whatsapp", type: "Checklist", title: "Checklist do agente de WhatsApp", description: "Valide contexto, tom de voz, limites e transferência humana.", meta: "12 etapas" },
  { slug: "prompts-conteudo-premium", type: "Playbook", title: "Prompts para conteúdo premium", description: "Estruturas testadas para posts, vídeos, e-mails e campanhas.", meta: "24 prompts" },
  { slug: "roteiro-diagnostico-ia", type: "Roteiro", title: "Diagnóstico de IA para negócios", description: "Conduza uma reunião de diagnóstico com clareza e foco em resultado.", meta: "45 min" },
  { slug: "calculadora-roi", type: "Planilha", title: "Calculadora de ROI de automações", description: "Compare custo atual, economia potencial e prazo de retorno.", meta: "10 min" },
  { slug: "modelo-proposta", type: "Template", title: "Proposta comercial para projetos de IA", description: "Apresente escopo, entregáveis, investimento e próximos passos.", meta: "Editável" },
  { slug: "canvas-produto-ia", type: "Canvas", title: "Canvas de produto com IA", description: "Organize público, problema, diferencial, dados e modelo de receita.", meta: "1 página" },
  { slug: "go-live-automacao", type: "Checklist", title: "Go-live seguro de uma automação", description: "Revise testes, acessos, monitoramento e plano de contingência.", meta: "18 etapas" },
];

export const encontros = [
  { date: "14 AGO", time: "19:30", title: "Clínica de automações comerciais", host: "Silfarney Oliveira", type: "Mentoria ao vivo" },
  { date: "21 AGO", time: "19:30", title: "Construindo agentes que usam ferramentas", host: "Convidado Hágios", type: "Aula especial" },
  { date: "28 AGO", time: "18:00", title: "Mesa de implementação: cases dos membros", host: "Comunidade Hágios", type: "Encontro da comunidade" },
];

export const membros = [
  { initials: "AM", name: "Ana Martins", role: "Gestora de marketing", focus: "Conteúdo com IA", city: "São Paulo" },
  { initials: "RC", name: "Rafael Costa", role: "Fundador de SaaS", focus: "Produtos digitais", city: "Belo Horizonte" },
  { initials: "LS", name: "Larissa Souza", role: "Consultora comercial", focus: "Automações de vendas", city: "Curitiba" },
  { initials: "GM", name: "Gabriel Mendes", role: "Gestor de operações", focus: "Agentes e processos", city: "Florianópolis" },
  { initials: "TP", name: "Thiago Prado", role: "Empresário", focus: "Atendimento inteligente", city: "Goiânia" },
  { initials: "CB", name: "Carolina Barros", role: "Product builder", focus: "Micro-SaaS", city: "Recife" },
];

export const oportunidades = [
  { tag: "Projeto", title: "Automação de atendimento para clínica", company: "Empresa membro", description: "Busca gestor de IA para mapear e implementar triagem no WhatsApp.", deadline: "Inscrições até 18 ago" },
  { tag: "Parceria", title: "Especialista em tráfego para lançamento", company: "Comunidade Hágios", description: "Parceria para operação de lançamento de produto com IA.", deadline: "Conexões abertas" },
  { tag: "Serviço", title: "Construção de painel comercial", company: "Empresa de serviços B2B", description: "Projeto curto de CRM, indicadores e follow-up automatizado.", deadline: "Início imediato" },
];

export const agentes = [
  { name: "Estrategista de ofertas", description: "Estrutura posicionamento, promessa, entregáveis e objeções de uma nova oferta.", status: "Disponível" },
  { name: "Arquiteto de automações", description: "Transforma processos manuais em um plano técnico organizado por etapas.", status: "Disponível" },
  { name: "Analista de conteúdo", description: "Cria pautas e formatos conectados aos objetivos comerciais do negócio.", status: "Disponível" },
  { name: "Revisor de agentes", description: "Analisa prompts, contexto, ferramentas e limites antes do go-live.", status: "Laboratório" },
];

export const automacoes = [
  { category: "Atendimento", title: "Qualificação e agendamento no WhatsApp", description: "Recebe, entende a necessidade, qualifica e agenda sem perder o contexto." },
  { category: "Comercial", title: "Follow-up inteligente de propostas", description: "Aciona a próxima mensagem conforme etapa, interesse e tempo sem resposta." },
  { category: "Marketing", title: "Esteira de conteúdo multicanal", description: "Transforma uma ideia central em posts, e-mail, roteiro e sequência de stories." },
  { category: "Operação", title: "Triagem de solicitações internas", description: "Classifica pedidos, coleta informações e encaminha para o responsável certo." },
  { category: "Gestão", title: "Resumo executivo semanal", description: "Consolida indicadores e destaca riscos, avanços e decisões pendentes." },
  { category: "Financeiro", title: "Cobrança preventiva e recuperação", description: "Envia lembretes e cria tarefas antes que uma inadimplência se prolongue." },
];

export const posts = [
  { author: "Equipe Hágios", time: "Hoje, 09:20", tag: "Atualização", title: "Nova formação de prospecção disponível", text: "A trilha foi organizada do perfil de cliente ideal até a cadência multicanal. Compartilhe sua implementação no feed." },
  { author: "Ana Martins", time: "Ontem, 18:45", tag: "Case de membro", title: "Como reduzimos o tempo de criação de conteúdo", text: "Estruturamos uma pauta-mãe por semana e usamos IA para adaptar os formatos. O time recuperou quase dois dias por ciclo." },
  { author: "Silfarney Oliveira", time: "10 ago, 14:10", tag: "Direção", title: "A próxima etapa é medir implementação", text: "Escolha um processo, defina o indicador atual e implemente uma melhoria observável. Conhecimento sem aplicação não conta como avanço." },
];

export const projetos = [
  { title: "Vendedor virtual Hágios", area: "Atendimento", status: "Em implementação", progress: 65, next: "Validar objeções comerciais" },
  { title: "Esteira de conteúdo semanal", area: "Marketing", status: "Em teste", progress: 82, next: "Revisar padrão visual" },
  { title: "Painel de oportunidades", area: "Comercial", status: "Planejamento", progress: 30, next: "Conectar fonte de leads" },
];
