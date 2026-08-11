"use client";

import { SignIn, SignUp } from "@clerk/react";
import { MarcaHagios } from "./MarcaHagios";

export function TelaAutenticacao({ modo, destino }: { modo: "entrar" | "cadastro"; destino: string }) {
  const cadastroUrl = `/cadastro?destino=${encodeURIComponent(destino)}`;
  const entrarUrl = `/entrar?destino=${encodeURIComponent(destino)}`;

  return (
    <main className="mh-auth">
      <div className="mh-auth__brand"><MarcaHagios /></div>
      <section className="mh-auth__copy">
        <p className="mh-eyebrow">MOVIMENTO HÁGIOS</p>
        <h1>{modo === "entrar" ? "Continue sua evolução." : "Entre para a vanguarda da IA."}</h1>
        <p>
          Formações práticas, automações e uma comunidade para transformar inteligência artificial
          em resultado real no seu negócio e na sua carreira.
        </p>
        <div className="mh-auth__proof">
          <span>Trilhas aplicáveis</span><span>Comunidade ativa</span><span>Projetos reais</span>
        </div>
      </section>
      <div className="mh-auth__card">
        {modo === "entrar" ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl={destino}
            signUpUrl={cadastroUrl}
          />
        ) : (
          <SignUp
            routing="hash"
            fallbackRedirectUrl={destino}
            signInUrl={entrarUrl}
          />
        )}
      </div>
    </main>
  );
}
