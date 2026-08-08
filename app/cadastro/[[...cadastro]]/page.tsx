"use client";

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { SignUp } from "@clerk/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ehPlanoValido } from "../../lib/planos";
import type { PlanoSlug } from "../../lib/tipos";
import { mensagemDeErro } from "../../lib/erros-auth";
import "../../estilos/auth.css";

const ROTA_BASE = "/cadastro";
const CHAVE_PLANO = "hagios:auth:plano";

// O sessionStorage é um sistema externo ao React: `useSyncExternalStore` é a
// forma de lê-lo sem `setState` dentro de efeito e sem divergir na hidratação —
// no servidor o snapshot é null e o valor real chega no primeiro render do
// cliente. Ninguém mais escreve nessa chave durante a vida da página, então a
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
 * (`/cadastro/verify-email-address`, `/cadastro/continue`,
 * `/cadastro/sso-callback`) e não garante que a query sobreviva. Guarda o plano
 * escolhido na rota base e recupera **apenas** nas sub-rotas: na rota base,
 * ausência de `?plano=` significa mesmo ausência de plano.
 *
 * Slug inválido na URL é tratado como ausência de plano — nunca propagado
 * adiante, para que `/assinar` não receba um plano que não existe.
 */
function usePlanoDoFluxo(): PlanoSlug | null {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const naRotaBase = pathname === ROTA_BASE || pathname === `${ROTA_BASE}/`;

  const planoDaUrl = searchParams.get("plano");
  const planoValidoDaUrl = ehPlanoValido(planoDaUrl) ? planoDaUrl : null;

  const planoGuardado = useValorDaSessao(CHAVE_PLANO);

  // A rota base é a única que define o estado do fluxo — inclusive quando o
  // define como "nenhum".
  useEffect(() => {
    if (!naRotaBase) return;
    gravarNaSessao(CHAVE_PLANO, planoValidoDaUrl);
  }, [naRotaBase, planoValidoDaUrl]);

  if (naRotaBase) return planoValidoDaUrl;
  return planoValidoDaUrl ?? (ehPlanoValido(planoGuardado) ? planoGuardado : null);
}

/**
 * Precedência, nesta ordem exata:
 *   1. plano válido -> /assinar?plano=<slug>
 *   2.              -> /planos
 */
function paraOndeIrDepoisDeCriarConta(plano: PlanoSlug | null): string {
  if (plano) return `/assinar?plano=${encodeURIComponent(plano)}`;
  return "/planos";
}

function Apresentacao({ aviso }: { aviso: string | null }) {
  return (
    <div className="auth-copy">
      <span>NOVO MEMBRO</span>
      <h1>Comece sua transformação.</h1>
      <p>Crie sua conta para garantir o acesso e acompanhar sua evolução.</p>
      {aviso ? (
        <p className="auth-aviso" role="alert" aria-live="assertive">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}

function ConteudoDeCadastro() {
  const searchParams = useSearchParams();
  const plano = usePlanoDoFluxo();

  const codigoDeErro = searchParams.get("erro");
  const aviso = codigoDeErro ? mensagemDeErro(codigoDeErro) : null;

  const depoisDeCriarConta = paraOndeIrDepoisDeCriarConta(plano);
  // O link "já tem conta?" leva o plano junto: quem escolheu um plano e descobre
  // que já tem conta não pode perder a escolha no caminho.
  const urlDeEntrada = plano ? `/entrar?plano=${encodeURIComponent(plano)}` : "/entrar";

  return (
    <>
      <Apresentacao aviso={aviso} />
      <SignUp
        routing="path"
        path={ROTA_BASE}
        signInUrl={urlDeEntrada}
        forceRedirectUrl={depoisDeCriarConta}
      />
    </>
  );
}

export default function PaginaDeCadastro() {
  return (
    <main className="auth-page">
      <Link href="/vendas" className="auth-brand" aria-label="Voltar para o Movimento Hágios">
        <img src="/logo-hagios.png" alt="" />
        <span><small>MOVIMENTO</small><strong>HÁGIOS</strong></span>
      </Link>
      <Suspense fallback={<Apresentacao aviso={null} />}>
        <ConteudoDeCadastro />
      </Suspense>
    </main>
  );
}
