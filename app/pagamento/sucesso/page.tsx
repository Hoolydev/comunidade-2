"use client";

// T-B5 · /pagamento/sucesso — a success_url da Stripe.
//
// AD-05: esta tela NUNCA libera acesso. Ela é uma URL que qualquer pessoa pode
// digitar no navegador. Quem libera acesso é o webhook, e o único jeito de
// saber que ele chegou é perguntar ao servidor — daí o polling de
// GET /api/assinatura.
//
// O tempo muda o significado da espera, então o texto muda com ele:
//   0–5s    confirmando
//   5–20s   finalizando, não feche
//   >20s    o webhook provavelmente falhou: explica, tranquiliza e entrega o
//           session_id copiável para o suporte

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardCopy, LifeBuoy, RefreshCw } from "lucide-react";

import { lerAssinatura } from "../../componentes/assinaturaApi";
import { etapaPor, intervaloPor, sessaoValida } from "../../componentes/confirmacao";
import "../../estilos/assinatura.css";

export default function PaginaDePagamentoConcluido() {
  const router = useRouter();
  const [sessao, setSessao] = useState<string | null>(null);
  const [semSessao, setSemSessao] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [liberado, setLiberado] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [avisoCopia, setAvisoCopia] = useState("");
  const inicio = useRef(Date.now());
  const codigo = useRef<HTMLElement>(null);

  const emailSuporte = process.env.NEXT_PUBLIC_EMAIL_SUPORTE ?? "suporte@movimentohagios.com.br";

  // 1. Sem session_id não há o que confirmar — a pessoa não veio da Stripe.
  useEffect(() => {
    const valida = sessaoValida(new URLSearchParams(window.location.search).get("session_id"));
    if (valida) {
      setSessao(valida);
      return;
    }
    setSemSessao(true);
    router.replace("/");
  }, [router]);

  // 2. Relógio da espera. Só muda texto, não dispara rede.
  useEffect(() => {
    const relogio = window.setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicio.current) / 1000));
    }, 1000);
    return () => window.clearInterval(relogio);
  }, []);

  const consultar = useCallback(async () => {
    const dados = await lerAssinatura();
    if (dados?.temAcesso) {
      setLiberado(true);
      router.replace("/");
      return true;
    }
    return false;
  }, [router]);

  // 3. Polling com recuo, pausado quando a aba está oculta.
  useEffect(() => {
    if (!sessao || liberado) return;

    let cancelado = false;
    let timer = 0;

    const rodar = async () => {
      // Zera o agendamento antes de sair: sem isso, voltar para a aba com um
      // timer pendente dispararia duas consultas ao mesmo tempo.
      window.clearTimeout(timer);
      if (cancelado || document.hidden) return;
      const pronto = await consultar();
      if (cancelado || pronto) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void rodar(),
        intervaloPor((Date.now() - inicio.current) / 1000),
      );
    };

    const aoMudarVisibilidade = () => {
      if (document.hidden) {
        window.clearTimeout(timer);
        return;
      }
      void rodar();
    };

    void rodar();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [sessao, liberado, consultar]);

  const verificarAgora = async () => {
    if (verificando) return;
    setVerificando(true);
    const pronto = await consultar();
    if (!pronto) setVerificando(false);
  };

  const copiar = async () => {
    if (!sessao) return;
    try {
      await navigator.clipboard.writeText(sessao);
      setAvisoCopia("Código copiado.");
      return;
    } catch {
      // Sem permissão de área de transferência: seleciona para o usuário copiar.
    }
    const alvo = codigo.current;
    const selecao = window.getSelection();
    if (alvo && selecao) {
      const intervalo = document.createRange();
      intervalo.selectNodeContents(alvo);
      selecao.removeAllRanges();
      selecao.addRange(intervalo);
      setAvisoCopia("Código selecionado. Use Ctrl+C ou Command+C para copiar.");
      return;
    }
    setAvisoCopia("Copie o código manualmente.");
  };

  if (semSessao) {
    return (
      <main className="confirma">
        <div className="confirma-caixa">
          <p className="confirma-texto" role="status">
            Redirecionando para a área de membros…
          </p>
        </div>
      </main>
    );
  }

  if (liberado) {
    return (
      <main className="confirma">
        <div className="confirma-caixa">
          <span className="confirma-sinal confirma-sinal--parado" aria-hidden="true">
            <CheckCircle2 size={22} />
          </span>
          <div aria-live="polite">
            <p className="confirma-etapa">PAGAMENTO CONFIRMADO</p>
            <h1>Seu acesso está liberado.</h1>
            <p className="confirma-texto">Levando você para a área de membros…</p>
          </div>
          <div className="confirma-acoes">
            <Link href="/" className="assin-botao assin-botao--principal">
              <span>Ir para a área de membros</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const etapa = etapaPor(segundos);

  return (
    <main className="confirma">
      <div className="confirma-caixa">
        <img src="/logo-hagios.png" alt="Movimento Hágios" />

        {etapa === "demorando" ? (
          <span className="confirma-sinal confirma-sinal--parado" aria-hidden="true">
            <LifeBuoy size={22} />
          </span>
        ) : (
          <span className="confirma-sinal" aria-hidden="true" />
        )}

        {/* A mudança de estágio precisa ser anunciada: o texto é a única pista
            de que a espera mudou de significado. */}
        <div aria-live="polite">
          {etapa === "confirmando" && (
            <>
              <p className="confirma-etapa">CONFIRMAÇÃO EM ANDAMENTO</p>
              <h1>Confirmando seu pagamento…</h1>
              <p className="confirma-texto">
                Isso costuma levar poucos segundos.
              </p>
            </>
          )}

          {etapa === "finalizando" && (
            <>
              <p className="confirma-etapa">CONFIRMAÇÃO EM ANDAMENTO</p>
              <h1>Estamos finalizando. Não feche esta página.</h1>
              <p className="confirma-texto">
                A Stripe está avisando nosso servidor. Assim que a confirmação
                chegar, seu acesso abre sozinho.
              </p>
            </>
          )}

          {etapa === "demorando" && (
            <>
              <p className="confirma-etapa">PAGAMENTO RECEBIDO</p>
              <h1>Seu pagamento foi recebido.</h1>
              <p className="confirma-texto">
                A confirmação está demorando mais do que o normal. Nada foi
                perdido e não é preciso pagar de novo: o acesso é liberado
                automaticamente assim que a confirmação chegar, mesmo que você
                feche esta página.
              </p>
            </>
          )}
        </div>

        {etapa === "demorando" && sessao && (
          <section className="confirma-suporte" aria-labelledby="confirma-suporte-titulo">
            <h2 id="confirma-suporte-titulo">Quer falar com o suporte agora?</h2>
            <p>
              Envie o código da sua compra. Com ele conseguimos localizar o
              pagamento e liberar seu acesso na hora.
            </p>

            <span className="confirma-codigo-rotulo" id="confirma-codigo-rotulo">
              CÓDIGO DA COMPRA
            </span>
            <div className="confirma-codigo">
              <code ref={codigo} aria-labelledby="confirma-codigo-rotulo">
                {sessao}
              </code>
              <button type="button" className="confirma-copiar" onClick={() => void copiar()}>
                <ClipboardCopy size={16} aria-hidden="true" />
                <span>Copiar código</span>
              </button>
            </div>
            <p className="confirma-aviso-copia" role="status" aria-live="polite">
              {avisoCopia}
            </p>

            <div className="confirma-acoes">
              <a
                className="assin-botao assin-botao--principal"
                href={`mailto:${emailSuporte}?subject=${encodeURIComponent(
                  "Pagamento aguardando confirmação",
                )}&body=${encodeURIComponent(
                  `Olá, meu pagamento ainda não foi confirmado.\n\nCódigo da compra: ${sessao}\n`,
                )}`}
              >
                <span>Falar com o suporte</span>
              </a>
              <button
                type="button"
                className="assin-botao assin-botao--secundario"
                onClick={() => void verificarAgora()}
                disabled={verificando}
                aria-busy={verificando}
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span>{verificando ? "Verificando…" : "Verificar de novo"}</span>
              </button>
              <Link href="/" className="assin-botao assin-botao--fantasma">
                <span>Ir para a área de membros</span>
              </Link>
            </div>
          </section>
        )}

        {etapa !== "demorando" && (
          <p className="confirma-rodape">
            Verificando com o servidor a cada poucos segundos.
          </p>
        )}
      </div>
    </main>
  );
}
