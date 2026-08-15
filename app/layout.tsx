import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClerkClientProvider } from "./ClerkClientProvider";
import "./estilos/fontes.css";
import "./globals.css";
import "./estilos/area-interna.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;
  const title = "Movimento Hágios — Comunidade de Inteligência Artificial";
  const description = "Formações, comunidade e ferramentas para liderar e prosperar na era da inteligência artificial.";

  return {
    title,
    description,
    icons: { icon: "/logo-hagios.png", shortcut: "/logo-hagios.png" },
    openGraph: { title, description, type: "website", images: [{ url: `${base}/og.png`, width: 1672, height: 941 }] },
    twitter: { card: "summary_large_image", title, description, images: [`${base}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ClerkClientProvider>
          {children}
        </ClerkClientProvider>
      </body>
    </html>
  );
}
