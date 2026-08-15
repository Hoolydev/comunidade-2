"use client";

import { ptBR } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/react";

// A publishable key identifica o frontend do Clerk e, por definição, é pública.
// Mantê-la no bundle evita que o runtime do Worker a serialize como [SENSITIVE]
// ao atravessar a fronteira entre Server e Client Components.
const CLERK_PUBLISHABLE_KEY = "pk_live_Y2xlcmsuY29tdW5pZGFkZWhhZ2lvcy5jb20uYnIk";

export function ClerkClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInUrl="/entrar"
      signUpUrl="/cadastro"
      localization={ptBR}
      appearance={{
        variables: {
          colorPrimary: "#f2b731",
          colorBackground: "#202a3e",
          borderRadius: "0.5rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
