"use client";

import { ptBR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/react";

// A chave pública precisa pertencer à mesma instância da chave secreta usada
// pelo servidor. No desenvolvimento ela é injetada pelo `.env.local`; em
// produção mantemos a chave pública no bundle para o Worker não serializá-la
// como `[SENSITIVE]` na fronteira Server/Client.
const CLERK_PUBLISHABLE_KEY =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    : "pk_live_Y2xlcmsuY29tdW5pZGFkZWhhZ2lvcy5jb20uYnIk";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY não configurada no desenvolvimento.");
}

export function ClerkClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl="/entrar"
      signUpUrl="/cadastro"
      localization={{
        ...ptBR,
        formFieldInputPlaceholder__signUpPassword: "Crie uma senha segura",
      }}
      appearance={{
        options: {
          privacyPageUrl: "/privacidade",
          termsPageUrl: "/termos",
        },
        variables: {
          colorPrimary: "#f4bd3b",
          colorPrimaryForeground: "#111827",
          colorBackground: "#182236",
          colorForeground: "#f8fafc",
          colorMuted: "#27344b",
          colorMutedForeground: "#bcc7d8",
          colorInput: "#ffffff",
          colorInputForeground: "#172033",
          colorNeutral: "#dbe3ef",
          colorBorder: "#3b4963",
          colorRing: "#f4bd3b",
          colorDanger: "#ff7b7b",
          colorShadow: "#050b16",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist), Arial, sans-serif",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
