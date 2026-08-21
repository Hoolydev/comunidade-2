"use client";

import { SignIn, SignUp } from "@clerk/react";
import { MarcaHagios } from "./MarcaHagios";

export function TelaAutenticacao({ modo, destino }: { modo: "entrar" | "cadastro"; destino: string }) {
  const cadastroUrl = `/cadastro?destino=${encodeURIComponent(destino)}`;
  const entrarUrl = `/entrar?destino=${encodeURIComponent(destino)}`;
  const plano = destino.includes("plano=anual") ? "anual" : destino.includes("plano=mensal") ? "mensal" : null;
  const appearance = {
    options: {
      elevation: "flush" as const,
      privacyPageUrl: "/privacidade",
      termsPageUrl: "/termos",
    },
    elements: {
      rootBox: { width: "100%" },
      cardBox: { width: "100%", maxWidth: "none" },
      card: { width: "100%", padding: "0", boxShadow: "none" },
      header: { alignItems: "flex-start", textAlign: "left" as const },
      headerTitle: { color: "#f8fafc", fontSize: "1.75rem", fontWeight: 720, letterSpacing: "-0.035em" },
      headerSubtitle: { color: "#c5cfdd", fontSize: "0.95rem", lineHeight: "1.55" },
      formFieldLabel: { color: "#eef2f7", fontSize: "0.82rem", fontWeight: 650 },
      formFieldInput: {
        minHeight: "3.25rem",
        border: "1px solid #dce3ec",
        backgroundColor: "#ffffff",
        color: "#172033",
        caretColor: "#172033",
        opacity: "1",
        fontSize: "1rem",
        fontWeight: 560,
        boxShadow: "none",
      },
      otpCodeFieldInputs: { gap: "0.5rem" },
      otpCodeFieldInput: {
        width: "3.25rem",
        height: "3.65rem",
        border: "2px solid #cbd5e1",
        borderRadius: "0.7rem",
        backgroundColor: "#ffffff",
        color: "#111827",
        caretColor: "#111827",
        opacity: "1",
        fontSize: "1.3rem",
        fontWeight: 760,
        boxShadow: "0 8px 20px rgba(3, 8, 20, .18)",
      },
      formFieldInputShowPasswordButton: { color: "#526178" },
      formFieldAction: { color: "#f4c64f", fontWeight: 650 },
      formButtonPrimary: { minHeight: "3.3rem", color: "#111827", fontSize: "0.98rem", fontWeight: 760, boxShadow: "0 10px 28px rgba(244, 189, 59, .2)" },
      footer: { background: "transparent", borderTop: "1px solid #34425a", paddingTop: "1.15rem" },
      footerActionText: { color: "#c5cfdd" },
      footerActionLink: { color: "#f4c64f", fontWeight: 720 },
      footerPagesLink: { color: "#c5cfdd" },
      formFieldErrorText: { color: "#ff9b9b", fontWeight: 600 },
      formFieldSuccessText: { color: "#8fe3c3", fontWeight: 650 },
      formResendCodeLink: { color: "#f4c64f", fontWeight: 720 },
      alertText: { color: "#f8fafc" },
      alternativeMethodsBlockButton: {
        border: "1px solid #526178",
        backgroundColor: "#253249",
        color: "#f8fafc",
      },
      backLink: { color: "#f4c64f", fontWeight: 700 },
      identityPreviewText: { color: "#f8fafc" },
      identityPreviewEditButton: { color: "#f4c64f" },
    },
  };

  return (
    <main className="mh-auth">
      <div className="mh-auth__brand"><MarcaHagios /></div>
      <section className="mh-auth__copy">
        <p className="mh-eyebrow">MOVIMENTO HÁGIOS</p>
        <h1>{modo === "entrar" ? "Retome sua implementação." : "Sua implementação começa aqui."}</h1>
        <p>
          Acesse direção prática, automações e uma comunidade para colocar a inteligência artificial
          para trabalhar no seu negócio — sem ficar perdido entre ferramentas.
        </p>
        <div className="mh-auth__proof">
          <span>Aplicação no negócio</span><span>Direção passo a passo</span><span>Comunidade ativa</span>
        </div>
      </section>
      <div className="mh-auth__card">
        <div className="mh-auth__step">
          <span>{modo === "cadastro" ? "PASSO 1 DE 2" : "ACESSO DO MEMBRO"}</span>
          {modo === "cadastro" ? (
            <p>
              Crie seu acesso agora. Depois você seguirá para o checkout seguro
              {plano ? <> do plano <strong>{plano}</strong></> : null}. Nenhuma cobrança acontece nesta etapa.
            </p>
          ) : (
            <p>Entre com seu e-mail e senha para continuar de onde parou.</p>
          )}
          {modo === "cadastro" && <div className="mh-auth__progress" aria-label="Etapa 1 de 2"><i /><i /></div>}
        </div>
        {modo === "entrar" ? (
          <SignIn
            routing="hash"
            fallbackRedirectUrl={destino}
            signUpUrl={cadastroUrl}
            appearance={appearance}
          />
        ) : (
          <SignUp
            routing="hash"
            fallbackRedirectUrl={destino}
            signInUrl={entrarUrl}
            appearance={appearance}
          />
        )}
        <p className="mh-auth__security">Seus dados de acesso são protegidos. O pagamento é processado pela Stripe.</p>
      </div>
    </main>
  );
}
