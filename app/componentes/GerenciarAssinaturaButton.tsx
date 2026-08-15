"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

const mensagens: Record<string, string> = {
  nao_autenticado: "Entre novamente para gerenciar sua assinatura.",
  sem_cliente_stripe: "A assinatura ainda está sendo vinculada à sua conta.",
  nao_configurado: "O portal de assinatura está temporariamente indisponível.",
  erro_interno: "Não foi possível abrir o portal da assinatura.",
};

export function GerenciarAssinaturaButton() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function abrirPortal() {
    if (carregando) return;
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/portal", { method: "POST" });
      const dados = await resposta.json() as { url?: string; erro?: string };
      if (!resposta.ok || !dados.url) {
        throw new Error(dados.erro ?? "erro_interno");
      }
      window.location.assign(dados.url);
    } catch (causa) {
      const codigo = causa instanceof Error ? causa.message : "erro_interno";
      setErro(mensagens[codigo] ?? mensagens.erro_interno);
      setCarregando(false);
    }
  }

  return (
    <div className="subscription-management">
      <button type="button" onClick={abrirPortal} disabled={carregando}>
        <CreditCard aria-hidden="true" />
        {carregando ? "Abrindo portal…" : "Gerenciar assinatura"}
      </button>
      {erro && <span role="alert">{erro}</span>}
    </div>
  );
}
