"use client";

import { ClerkProvider } from "@clerk/react";
import { ptBR } from "@clerk/localizations";
import { ERROS_DO_CLERK_EM_PT_BR } from "./lib/erros-auth";

// A tradução oficial do Clerk resolve o grosso da interface. Duas categorias de
// mensagem ficam por nossa conta:
//
// 1. Segurança — o texto padrão de `form_identifier_not_found` é "Não foi
//    possível encontrar o usuário", que transforma a tela de login em um
//    verificador de quais e-mails existem na base. Aqui todas as variantes de
//    credencial inválida viram a mesma frase neutra.
// 2. Tom — nossas strings são sentenças capitalizadas, sem pedido de desculpas.
//
// O mapa vem de app/lib/erros-auth.ts para que a mesma frase apareça no
// formulário do Clerk e nas mensagens que as outras telas montam a partir de um
// código de erro.
const localizacao = {
  ...ptBR,
  unstable__errors: {
    ...ptBR.unstable__errors,
    ...ERROS_DO_CLERK_EM_PT_BR,
  },
};

export function ClerkClientProvider({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      localization={localizacao}
      signInUrl="/entrar"
      signUpUrl="/cadastro"
      appearance={{
        variables: {
          colorPrimary: "#f2b731",
          colorBackground: "#202a3e",
          colorForeground: "#f7f8fb",
          colorInput: "#252f45",
          colorInputForeground: "#f7f8fb",
          colorMutedForeground: "#8e98aa",
          borderRadius: "0.5rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
