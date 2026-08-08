"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { SignIn } from "@clerk/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ehPlanoValido } from "../../lib/planos";
import type { PlanoSlug } from "../../lib/tipos";
import { mensagemDeErro } from "../../lib/erros-auth";
import "../../estilos/auth.css";

const ROTA_BASE = "/entrar";
const CHAVE_PLANO = "hagios:auth:plano";
const CHAVE_DESTINO = "hagios:auth:destino";

/**
 * Caminho interno: começa com uma barra, não começa com duas (`//host` é URL
 * absoluta protocolo-relativa), sem contrabarra (o navegador normaliza `\` para
 * `/`, então `/\evil.com` viraria `//evil.com`) e sem espaço ou caractere de
 * controle.
 *
 * `?destino=` vem da URL, ou seja, de qualquer pessoa. Sem esta validação um
 * `?destino=https://site-malicioso` seguido pelo Clerk é um open redirect
 * hospedado na nossa tela de login.
 */
const CAMINHO_INTERNO = /^\/(?![/\\])[^\s\\\u0000-\u001f\u007f]*$/;

function destinoSeguro(valor: string | null): string | null {
  if (!valor) return null;
  const cru = valor.trim();
  return CAMINHO_INTERNO.test(cru) ? cru : null;
}

// O sessionStorage é um sistema externo ao React: `useSyncExternalStore` é a
// forma de lê-lo sem `setState` dentro de efeito e sem divergir na hidratação —
// no servidor o snapshot é null e o valor real chega no primeiro render do
// cliente. Ninguém mais escreve nessas chaves durante a vida da página, então a
// inscrição é vazia de propósito.
const SEM_INSCRICAO = () => () => {};
const SNAPSHOT_DO_SERVIDOR = () => null;

function useValorDaSessao(chave: string): string | null {
  return useSyncExternalStore(
    SEM_INSCRICAO,
    () => {
      try {
        return sessionStorage.getItem(chave);
      } catch {
        // Navegação privada ou storage bloqueado. Seguir sem memória é aceitável.
        return null;
      }
    },
    SNAPSHOT_DO_SERVIDOR,
  );
}

function gravarNaSessao(chave: string, valor: string | null): void {
  try {
    if (valor) sessionStorage.setItem(chave, valor);
    else sessionStorage.removeItem(chave);
  } catch {
    /* idem */
  }
}

/**
 * O Clerk navega por conta própria para sub-rotas do fluxo
 * (`/entrar/factor-one`, `/entrar/reset-password`, `/entrar/sso-callback`) e não
 * garante que a query sobreviva. Guarda o que foi escolhido na rota base e
 * recupera **apenas** nas sub-rotas: na rota base, ausência de `?plano=`
 * significa mesmo ausência de plano, e ressuscitar uma escolha velha mandaria
 * para o checkout quem só queria entrar.
 */
function useParametrosDoFluxo(): { plano: PlanoSlug | null; destino: string | null } {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const naRotaBase = pathname === ROTA_BASE || pathname === `${ROTA_BASE}/`;

  const planoDaUrl = searchParams.get("plano");
  const planoValidoDaUrl = ehPlanoValido(planoDaUrl) ? planoDaUrl : null;
  const destinoDaUrl = destinoSeguro(searchParams.get("destino"));

  const planoGuardado = useValorDaSessao(CHAVE_PLANO);
  const destinoGuardado = useValorDaSessao(CHAVE_DESTINO);

  // A rota base é a única que define o estado do fluxo — inclusive quando o
  // define como "nenhum".
  useEffect(() => {
    if (!naRotaBase) return;
    gravarNaSessao(CHAVE_PLANO, planoValidoDaUrl);
    gravarNaSessao(CHAVE_DESTINO, destinoDaUrl);
  }, [naRotaBase, planoValidoDaUrl, destinoDaUrl]);

  if (naRotaBase) return { plano: planoValidoDaUrl, destino: destinoDaUrl };

  return {
    plano: planoValidoDaUrl ?? (ehPlanoValido(planoGuardado) ? planoGuardado : null),
    // Revalida o que veio do storage: é barato, e storage não é entrada confiável.
    destino: destinoDaUrl ?? destinoSeguro(destinoGuardado),
  };
}

/**
 * Precedência, nesta ordem exata:
 *   1. plano válido  -> /assinar?plano=<slug>
 *   2. destino válido -> o destino
 *   3.                -> /
 */
function paraOndeIrDepoisDeEntrar(plano: PlanoSlug | null, destino: string | null): string {
  if (plano) return `/assinar?plano=${encodeURIComponent(plano)}`;
  if (destino) return destino;
  return "/";
}

function Apresentacao({ aviso }: { aviso: string | null }) {
  return (
    <div className="auth-copy">
      <span>ÁREA DE MEMBROS</span>
      <h1>Bom ter você de volta.</h1>
      <p>Entre para continuar seus módulos, projetos e conexões na comunidade.</p>
      {aviso ? (
        <p className="auth-aviso" role="alert" aria-live="assertive">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

function ConteudoDeEntrada() {
  const searchParams = useSearchParams();
  const { plano, destino } = useParametrosDoFluxo();

  const codigoDeErro = searchParams.get("erro");
  const aviso = codigoDeErro ? mensagemDeErro(codigoDeErro) : null;

  const depoisDeEntrar = paraOndeIrDepoisDeEntrar(plano, destino);
  // O link "criar conta" leva o plano junto: quem escolheu um plano e descobre
  // que ainda não tem conta não pode perder a escolha no caminho.
  const urlDeCadastro = plano ? `/cadastro?plano=${encodeURIComponent(plano)}` : "/cadastro";

  return (
    <>
      <Apresentacao aviso={aviso} />
      <SignIn
        routing="path"
        path={ROTA_BASE}
        signUpUrl={urlDeCadastro}
        forceRedirectUrl={depoisDeEntrar}
      />
    </>
  );
}

export default function PaginaDeEntrada() {
  return (
    <main className="auth-page">
      <Link href="/" className="auth-brand" aria-label="Voltar para o Movimento Hágios">
        <img src="/logo-hagios.png" alt="" />
        <span><small>MOVIMENTO</small><strong>HÁGIOS</strong></span>
      </Link>
      <Suspense fallback={<Apresentacao aviso={null} />}>
        <ConteudoDeEntrada />
      </Suspense>
    </main>
  );
}
