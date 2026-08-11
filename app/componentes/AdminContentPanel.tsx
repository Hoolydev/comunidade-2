"use client";

import { useEffect, useState } from "react";

import type { FormacaoConteudo, MaterialConteudo } from "../lib/conteudo";

type DadosAdmin = { formacoes: FormacaoConteudo[]; materiais: MaterialConteudo[] };

const mensagens: Record<string, string> = {
  nao_autorizado: "Seu usuário não está autorizado a administrar conteúdos.",
  youtube_invalido: "Informe um link válido do YouTube.",
  armazenamento_nao_configurado: "O armazenamento de arquivos ainda não está conectado.",
  tipo_nao_permitido: "Esse formato de arquivo não é permitido.",
  tamanho_invalido: "O arquivo precisa ter até 25 MB.",
};

function mensagemDeErro(codigo?: string) {
  return mensagens[codigo ?? ""] ?? "Não foi possível concluir esta operação.";
}

function urlDoVideo(videoId: string | null) {
  return videoId ? `https://youtu.be/${videoId}` : "";
}

function tamanho(bytes: number | null) {
  if (!bytes) return "Sem arquivo";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function buscarDadosAdmin(): Promise<DadosAdmin> {
  const resposta = await fetch("/api/admin/conteudo", { cache: "no-store" });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(mensagemDeErro(corpo.erro));
  return corpo as DadosAdmin;
}

export function AdminContentPanel() {
  const [dados, setDados] = useState<DadosAdmin | null>(null);
  const [videos, setVideos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const aplicarDados = (recebidos: DadosAdmin) => {
    setDados(recebidos);
    setVideos(
      Object.fromEntries(
        recebidos.formacoes.flatMap((formacao) =>
          formacao.aulas.map((aula) => [aula.id, urlDoVideo(aula.youtubeVideoId)]),
        ),
      ),
    );
  };

  const carregar = async () => aplicarDados(await buscarDadosAdmin());

  useEffect(() => {
    let ativo = true;
    buscarDadosAdmin()
      .then((recebidos) => { if (ativo) aplicarDados(recebidos); })
      .catch((erro) => { if (ativo) setAviso({ tipo: "erro", texto: erro.message }); });
    return () => { ativo = false; };
  }, []);

  const aulas = dados?.formacoes.flatMap((formacao) => formacao.aulas) ?? [];
  const totais = {
    videos: aulas.filter((aula) => aula.youtubeVideoId).length,
    aulas: aulas.length,
    arquivos: dados?.materiais.filter((material) => material.objetoR2).length ?? 0,
    materiais: dados?.materiais.length ?? 0,
  };

  const salvarVideo = async (aulaId: string) => {
    setOcupado(aulaId);
    setAviso(null);
    const resposta = await fetch("/api/admin/conteudo", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ acao: "video", aulaId, youtubeUrl: videos[aulaId] ?? "" }),
    });
    const corpo = await resposta.json().catch(() => ({}));
    setOcupado(null);
    if (!resposta.ok) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(corpo.erro) });
      return;
    }
    setAviso({ tipo: "ok", texto: "Vídeo atualizado na aula." });
    await carregar();
  };

  const enviarArquivo = async (material: MaterialConteudo, arquivo: File | null) => {
    if (!arquivo) return;
    setOcupado(material.slug);
    setAviso(null);
    const formulario = new FormData();
    formulario.set("slug", material.slug);
    formulario.set("arquivo", arquivo);
    const resposta = await fetch("/api/admin/arquivos", { method: "POST", body: formulario });
    const corpo = await resposta.json().catch(() => ({}));
    setOcupado(null);
    if (!resposta.ok) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(corpo.erro) });
      return;
    }
    setAviso({ tipo: "ok", texto: "Arquivo publicado na biblioteca." });
    await carregar();
  };

  const removerArquivo = async (material: MaterialConteudo) => {
    if (!window.confirm(`Remover o arquivo de “${material.title}”?`)) return;
    setOcupado(material.slug);
    setAviso(null);
    const resposta = await fetch("/api/admin/arquivos", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: material.slug }),
    });
    const corpo = await resposta.json().catch(() => ({}));
    setOcupado(null);
    if (!resposta.ok) {
      setAviso({ tipo: "erro", texto: mensagemDeErro(corpo.erro) });
      return;
    }
    setAviso({ tipo: "ok", texto: "Arquivo removido da biblioteca." });
    await carregar();
  };

  if (!dados && !aviso) {
    return <div className="admin-loading">Preparando a gestão de conteúdos…</div>;
  }

  if (!dados) {
    return <div className="admin-blocked"><span>Acesso restrito</span><h2>Gestão de conteúdo indisponível</h2><p>{aviso?.texto}</p></div>;
  }

  return (
    <>
      <div className="admin-summary">
        <article><span>Vídeos publicados</span><strong>{totais.videos}<small>/{totais.aulas}</small></strong></article>
        <article><span>Arquivos publicados</span><strong>{totais.arquivos}<small>/{totais.materiais}</small></strong></article>
        <article><span>Armazenamento</span><strong>R2<small> privado</small></strong></article>
      </div>

      {aviso && <div className={`admin-notice admin-notice--${aviso.tipo}`}>{aviso.texto}</div>}

      <section className="admin-section">
        <header><div><span>01 · Vídeos</span><h2>Aulas no YouTube</h2></div><p>Cole o link do vídeo não listado. A plataforma salva somente o identificador seguro.</p></header>
        <div className="admin-formation-list">
          {dados.formacoes.map((formacao, indice) => (
            <details key={formacao.slug} open={indice === 0}>
              <summary><span>{String(indice + 1).padStart(2, "0")}</span><div><strong>{formacao.title}</strong><small>{formacao.aulas.filter((aula) => aula.youtubeVideoId).length} de {formacao.aulas.length} vídeos</small></div><i /></summary>
              <div className="admin-lessons">
                {formacao.aulas.map((aula) => (
                  <div className="admin-lesson-row" key={aula.id}>
                    <span>{String(aula.numero).padStart(2, "0")}</span>
                    <label><strong>{aula.titulo}</strong><input value={videos[aula.id] ?? ""} onChange={(event) => setVideos((atual) => ({ ...atual, [aula.id]: event.target.value }))} placeholder="https://youtu.be/…" aria-label={`Link do YouTube para ${aula.titulo}`} /></label>
                    <button type="button" disabled={ocupado === aula.id} onClick={() => void salvarVideo(aula.id)}>{ocupado === aula.id ? "Salvando…" : "Salvar vídeo"}</button>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <header><div><span>02 · Biblioteca</span><h2>Arquivos para membros</h2></div><p>PDF, planilha, documento, apresentação ou ZIP de até 25 MB.</p></header>
        <div className="admin-file-list">
          {dados.materiais.map((material, indice) => (
            <article key={material.slug}>
              <span>{String(indice + 1).padStart(2, "0")}</span>
              <div><small>{material.type}</small><strong>{material.title}</strong><p>{material.nomeArquivo ?? "Nenhum arquivo publicado"} · {tamanho(material.tamanhoBytes)}</p></div>
              <div className="admin-file-actions"><label className="admin-file-button">{ocupado === material.slug ? "Enviando…" : material.objetoR2 ? "Substituir arquivo" : "Enviar arquivo"}<input type="file" disabled={ocupado === material.slug} accept=".pdf,.zip,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.txt" onChange={(event) => void enviarArquivo(material, event.target.files?.[0] ?? null)} /></label>{material.objetoR2 && <button type="button" disabled={ocupado === material.slug} onClick={() => void removerArquivo(material)}>Remover</button>}</div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
