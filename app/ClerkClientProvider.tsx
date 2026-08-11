"use client";

import { ClerkProvider } from "@clerk/react";

export function ClerkClientProvider({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/entrar"
      signUpUrl="/cadastro"
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
