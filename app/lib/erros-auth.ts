// Tradução de código de erro → texto em PT-BR.
//
// O servidor devolve `{ erro: <codigo> }` e nada mais (ver docs/contrato.md); o
// Clerk devolve erros com um `code` estável. Este arquivo é o único lugar do
// cliente que transforma código em frase.
//
// Regra de tom, sem exceção: PT-BR, sentença capitalizada, sem "Ops!", sem
// exclamação nervosa, sem pedido de desculpas.

import type { CodigoErro } from "./tipos";

/** Usada quando o código é desconhecido ou está ausente. */
export const MENSAGEM_GENERICA = "Não foi possível concluir. Tente de novo.";

// ---------------------------------------------------------------------------
// Códigos do nosso servidor (CodigoErro em app/lib/tipos.ts)
// ---------------------------------------------------------------------------

// O tipo Record<CodigoErro, string> é intencional: se alguém adicionar um
// código novo ao contrato, este arquivo para de compilar até ser traduzido.
const MENSAGENS_DO_SERVIDOR: Record<CodigoErro, string> = {
  nao_autenticado: "Sua sessão expirou. Entre de novo para continuar.",
  plano_invalido: "Este plano não existe. Escolha um dos planos disponíveis.",
  ja_assinante: "Sua assinatura já está ativa. Não é preciso assinar de novo.",
  sem_cliente_stripe: "Não encontramos uma assinatura ligada a esta conta.",
  nao_configurado: "O pagamento está indisponível no momento. Tente de novo em alguns minutos.",
  erro_interno: "Não foi possível concluir. Tente de novo em alguns instantes.",
};

// ---------------------------------------------------------------------------
// Códigos do Clerk
// ---------------------------------------------------------------------------

// Credencial inválida é sempre a mesma frase, venha o erro do identificador ou
// da senha. Dizer "não encontramos este usuário" transforma a tela de login em
// um verificador de quais e-mails existem na base.
const CREDENCIAL_INVALIDA = "E-mail ou senha incorretos.";
const EMAIL_JA_CADASTRADO = "Este e-mail já tem conta. Entre com ele ou recupere a senha.";

const MENSAGENS_DO_CLERK: Record<string, string> = {
  // Credencial inválida — todas as variantes caem na mesma frase neutra.
  form_identifier_not_found: CREDENCIAL_INVALIDA,
  form_password_incorrect: CREDENCIAL_INVALIDA,
  form_password_or_identifier_incorrect: CREDENCIAL_INVALIDA,
  form_password_validation_failed: CREDENCIAL_INVALIDA,
  form_param_value_invalid: CREDENCIAL_INVALIDA,

  // E-mail já cadastrado.
  form_identifier_exists: EMAIL_JA_CADASTRADO,
  form_identifier_exists__email_address: EMAIL_JA_CADASTRADO,
  identifier_already_signed_in: "Você já está conectado com esta conta.",
  form_identifier_exists__username: "Este nome de usuário já está em uso. Escolha outro.",
  form_identifier_exists__phone_number: "Este telefone já está em uso. Use outro.",
  phone_number_exists: "Este telefone já está em uso. Use outro.",
  external_account_exists: "Esta conta do Google já está ligada a outro cadastro.",

  // Senha.
  form_password_pwned: "Esta senha apareceu em vazamentos públicos. Escolha outra.",
  form_password_pwned__sign_in: "Esta senha apareceu em vazamentos públicos. Redefina sua senha para continuar.",
  form_password_compromised__sign_in: "Esta senha apareceu em vazamentos públicos. Redefina sua senha para continuar.",
  form_password_untrusted__sign_in: "Esta senha pode estar comprometida. Entre por outro método e redefina a senha.",
  form_password_length_too_short: "A senha é curta demais. Escolha uma senha mais longa.",
  form_password_size_in_bytes_exceeded: "A senha é longa demais. Use uma senha mais curta.",
  form_password_not_strong_enough: "A senha está fraca. Misture letras, números e símbolos.",
  form_new_password_matches_current: "A nova senha precisa ser diferente da atual.",
  form_password_no_match: "As duas senhas precisam ser iguais.",
  passwordComplexity: "A senha não atende aos requisitos mínimos.",

  // Verificação por código.
  form_code_incorrect: "Código incorreto. Confira e digite de novo.",
  verification_failed: "Não foi possível verificar o código. Peça um código novo.",
  verification_expired: "O código expirou. Peça um código novo.",
  form_code_expired: "O código expirou. Peça um código novo.",

  // Campos do formulário.
  form_param_nil: "Preencha este campo.",
  form_param_missing: "Preencha este campo.",
  form_param_format_invalid: "O formato está inválido.",
  form_param_format_invalid__email_address: "Digite um e-mail válido.",
  form_param_type_invalid__email_address: "Digite um e-mail válido.",
  form_email_address_blocked: "Este provedor de e-mail não é aceito. Use seu e-mail principal.",

  // Sessão e limites.
  session_exists: "Você já está conectado. Continue de onde parou.",
  too_many_requests: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
  rate_limit_exceeded: "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
  actor_token_cannot_be_revoked: "Esta sessão não pode ser encerrada agora.",

  // Acesso e login social.
  not_allowed_access: "Esta conta não tem acesso a esta área.",
  action_blocked: "Esta ação foi bloqueada por segurança. Tente de novo mais tarde.",
  oauth_access_denied: "O acesso pelo Google não foi autorizado.",
  oauth_email_domain_reserved_by_saml: "Este domínio de e-mail exige entrar pelo provedor da sua empresa.",
  strategy_for_user_invalid: "Este método de acesso não está disponível para esta conta.",
  captcha_invalid: "A verificação de segurança falhou. Recarregue a página e tente de novo.",
  captcha_unavailable: "A verificação de segurança está indisponível. Recarregue a página e tente de novo.",

  // Rede.
  network_error: "Não foi possível falar com o servidor. Confira sua conexão e tente de novo.",
};

/**
 * Mapa completo. Os códigos do servidor vêm por último de propósito: em caso de
 * colisão de nome, o contrato interno vence.
 */
export const MENSAGENS_DE_ERRO: Record<string, string> = {
  ...MENSAGENS_DO_CLERK,
  ...MENSAGENS_DO_SERVIDOR,
};

/** Só o subconjunto que o Clerk usa, no formato do prop `localization`. */
export const ERROS_DO_CLERK_EM_PT_BR = MENSAGENS_DO_CLERK;

// Um código desconhecido acaba dentro de uma frase mostrada na tela. Limita o
// tamanho e tira caracteres de controle antes de exibir.
function codigoParaExibicao(codigo: string): string {
  const limpo = codigo.replace(/[^\w.:-]+/g, "").trim();
  return limpo.length > 64 ? `${limpo.slice(0, 64)}…` : limpo;
}

/**
 * Código → mensagem. É a função que as outras trilhas importam.
 *
 * Código desconhecido cai na mensagem genérica **com o código anexado**:
 * depurar às cegas em produção custa mais caro do que a feiura do parêntese.
 */
export function mensagemDeErro(codigo: string): string {
  if (typeof codigo !== "string") return MENSAGEM_GENERICA;

  const chave = codigo.trim();
  if (!chave) return MENSAGEM_GENERICA;

  const conhecida = MENSAGENS_DE_ERRO[chave];
  if (conhecida) return conhecida;

  const exibicao = codigoParaExibicao(chave);
  if (!exibicao) return MENSAGEM_GENERICA;
  return `${MENSAGEM_GENERICA} (código: ${exibicao})`;
}

/**
 * Extrai o código de qualquer coisa que tenha chegado como erro: corpo
 * `{ erro }` das nossas rotas, erro lançado pelo Clerk (`errors[0].code`),
 * string crua. Devolve null quando não achou código nenhum.
 */
export function codigoDoErro(erro: unknown): string | null {
  if (typeof erro === "string") return erro.trim() || null;
  if (!erro || typeof erro !== "object") return null;

  const objeto = erro as Record<string, unknown>;

  // Nosso contrato: { erro: CodigoErro }
  if (typeof objeto.erro === "string") return objeto.erro;

  // Clerk: { errors: [{ code, longMessage, message }] }
  const lista = objeto.errors;
  if (Array.isArray(lista) && lista.length > 0) {
    const primeiro = lista[0] as Record<string, unknown> | null;
    if (primeiro && typeof primeiro.code === "string") return primeiro.code;
  }

  if (typeof objeto.code === "string") return objeto.code;

  return null;
}

/**
 * Atalho para `mensagemDeErro(codigoDoErro(erro))`, com a mensagem genérica
 * quando não há código algum.
 */
export function mensagemDoErro(erro: unknown): string {
  const codigo = codigoDoErro(erro);
  return codigo ? mensagemDeErro(codigo) : MENSAGEM_GENERICA;
}
