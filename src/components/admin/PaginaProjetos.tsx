"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, ConfigProvider, Modal } from "antd";
import { ArrowDown, ArrowUp, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import EstadoLista from "./EstadoLista";
import ModalAdmin from "./ModalAdmin";
import CampoAdmin from "./CampoAdmin";

type Midia = { id: string; url: string; mime: string; bytes: number; nomeOriginal: string | null };
type Foto = { id?: string; midiaId: string; url?: string; textoAlternativo: string; legenda: string; credito: string | null; dataEditorial: string | null; ordem?: number };
type Pagina = { introducao: string; tituloTrajetoria: string; fundo: { midiaId: string | null; origem: string | null; url: string | null; alt: string } };
type Resposta = { pagina: Pagina; fotos: Foto[]; midias: Midia[] };

const fotoVazia: Foto = { midiaId: "", textoAlternativo: "", legenda: "", credito: null, dataEditorial: null };
const campo = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";

function moverItem<T>(lista: T[], indice: number, deslocamento: -1 | 1): T[] {
  const destino = indice + deslocamento;
  if (destino < 0 || destino >= lista.length) return lista;
  const nova = [...lista];
  [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
  return nova;
}

async function enviarMidia(arquivo: File): Promise<Midia> {
  const formData = new FormData();
  formData.append("file", arquivo);
  const otimizada = await fetch("/api/upload", { method: "POST", body: formData });
  if (!otimizada.ok) throw new Error("A imagem foi recusada. Use JPEG, PNG ou WebP de até 5 MiB.");
  const dados = await otimizada.json() as { imageData: string; imagemTipo: string };
  const resposta = await fetch("/api/admin/midias", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...dados, nomeOriginal: arquivo.name }),
  });
  if (!resposta.ok) throw new Error("Não foi possível salvar a imagem no Storage.");
  return await resposta.json() as Midia;
}

export default function PaginaProjetos() {
  const [modal, contextHolder] = Modal.useModal();
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  // Modal para adicionar / editar foto da galeria
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [indiceFotoEditando, setIndiceFotoEditando] = useState<number | null>(null);
  const [rascunhoFoto, setRascunhoFoto] = useState<Foto>(fotoVazia);
  const fotoAtualEmEdicao = indiceFotoEditando !== null ? dados?.fotos[indiceFotoEditando]?.url : null;

  // Modal para configurações da página de apresentação
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [rascunhoPagina, setRascunhoPagina] = useState<Pagina | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/admin/projetos-pagina", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar a página de projetos.");
      setDados(await resposta.json() as Resposta);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os projetos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>, aoSalvar: (midia: Midia) => void) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo || !dados) return;
    setEnviandoImagem(true);
    setErro("");
    try {
      const midia = await enviarMidia(arquivo);
      setDados((atual) => atual ? { ...atual, midias: [midia, ...atual.midias.filter((item) => item.id !== midia.id)] } : atual);
      aoSalvar(midia);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  function abrirModalNovaFoto() {
    setIndiceFotoEditando(null);
    setRascunhoFoto(fotoVazia);
    setModalFotoAberto(true);
  }

  function abrirModalEditarFoto(index: number) {
    if (!dados) return;
    setIndiceFotoEditando(index);
    setRascunhoFoto({ ...dados.fotos[index] });
    setModalFotoAberto(true);
  }

  function abrirModalConfig() {
    if (!dados) return;
    setRascunhoPagina({
      introducao: dados.pagina.introducao,
      tituloTrajetoria: dados.pagina.tituloTrajetoria,
      fundo: { ...dados.pagina.fundo },
    });
    setModalConfigAberto(true);
  }

  async function salvarFotoModal(e: FormEvent) {
    e.preventDefault();
    if (!dados || !rascunhoFoto.midiaId) return;
    setSalvando(true);
    setErro("");
    setAviso("");

    const novasFotos = indiceFotoEditando !== null
      ? dados.fotos.map((f, i) => i === indiceFotoEditando ? rascunhoFoto : f)
      : [...dados.fotos, rascunhoFoto];

    try {
      const resposta = await fetch("/api/admin/projetos-pagina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina: dados.pagina, fotos: novasFotos }),
      });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar a foto na galeria.");
      }
      setModalFotoAberto(false);
      setAviso(indiceFotoEditando !== null ? "Foto atualizada com sucesso." : "Foto adicionada à galeria com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a foto na galeria.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarConfigModal(e: FormEvent) {
    e.preventDefault();
    if (!dados || !rascunhoPagina) return;
    setSalvando(true);
    setErro("");
    setAviso("");

    try {
      const resposta = await fetch("/api/admin/projetos-pagina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina: rascunhoPagina, fotos: dados.fotos }),
      });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar as configurações da página.");
      }
      setModalConfigAberto(false);
      setAviso("Configurações da apresentação salvas com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar as configurações da página.");
    } finally {
      setSalvando(false);
    }
  }

  function confirmarRemoverFoto(index: number) {
    const foto = dados?.fotos[index];
    const nome = foto?.legenda || foto?.textoAlternativo || `Foto ${index + 1}`;
    modal.confirm({
      title: "Confirmar remoção",
      content: `Deseja realmente remover "${nome}" da galeria de projetos?`,
      okText: "Sim, remover",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!dados) return;
        setSalvando(true);
        setErro("");
        setAviso("");
        const novasFotos = dados.fotos.filter((_, i) => i !== index);
        try {
          const resposta = await fetch("/api/admin/projetos-pagina", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pagina: dados.pagina, fotos: novasFotos }),
          });
          if (!resposta.ok) {
            const payload = await resposta.json().catch(() => null) as { error?: string } | null;
            throw new Error(payload?.error ?? "Não foi possível remover a foto.");
          }
          setAviso("Foto removida da galeria com sucesso.");
          await carregar();
        } catch (error) {
          setErro(error instanceof Error ? error.message : "Não foi possível remover a foto.");
        } finally {
          setSalvando(false);
        }
      },
    });
  }

  async function reordenarFoto(index: number, deslocamento: -1 | 1) {
    if (!dados) return;
    const novasFotos = moverItem(dados.fotos, index, deslocamento);
    setDados({ ...dados, fotos: novasFotos });
    try {
      const resposta = await fetch("/api/admin/projetos-pagina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina: dados.pagina, fotos: novasFotos }),
      });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar a nova ordem.");
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a nova ordem.");
      await carregar();
    }
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            defaultBg: "#ffffff",
            defaultBorderColor: "#cbd5e1",
            defaultHoverBg: "#f8fafc",
            defaultHoverBorderColor: "#94a3b8",
            defaultHoverColor: "#0f172a",
            defaultColor: "#334155",
            colorPrimary: "#F38901",
            colorPrimaryHover: "#FECA55",
            colorTextLightSolid: "#241c26",
          },
          Input: {
            colorText: '#0f172a',
            colorTextPlaceholder: '#64748b',
          },
        },
      }}
    >
      {contextHolder}
      <section className="space-y-4" aria-labelledby="admin-secao-titulo">
        <header className="flex w-full min-w-0 max-w-full flex-col gap-4 rounded-xl border border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 2xl:p-4">
          <div className="min-w-0 flex-1 border-l-4 border-[#F38901] pl-4">
            <h1 id="admin-secao-titulo" className="break-words text-lg font-bold text-[#19121d] sm:text-xl">
              Galeria de projetos
            </h1>
            <p className="mt-1 break-words text-sm text-slate-600">
              Gerencie a galeria visual e os textos de apresentação da página pública de projetos.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              onClick={abrirModalConfig}
              disabled={carregando || !dados}
              icon={<Settings size={16} aria-hidden="true" />}
              className="min-h-11 font-medium 2xl:min-h-10"
            >
              Configurações da página
            </Button>
            <Button
              type="primary"
              onClick={abrirModalNovaFoto}
              disabled={carregando || !dados}
              icon={<Plus size={16} aria-hidden="true" />}
              className="min-h-11 font-semibold 2xl:min-h-10"
            >
              Nova foto na galeria
            </Button>
          </div>
        </header>

        {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
        {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

        {/* Modal de Configurações da Página (Apresentação, Introdução, Fundo) */}
        <ModalAdmin
          aberto={modalConfigAberto}
          aoFechar={() => setModalConfigAberto(false)}
          titulo="Configurações da página de projetos"
          descricao="Edite os textos de apresentação, o título da seção de trajetória e a imagem de fundo."
          larguraMaxima="max-w-2xl"
        >
          {rascunhoPagina && (
            <form onSubmit={salvarConfigModal} className="space-y-4">
              <CampoAdmin
                label="Introdução"
                tipo="textarea"
                required
                linhas={5}
                maxLen={10000}
                minLen={5}
                proibirHtml
                value={rascunhoPagina.introducao}
                onChange={(valor) => setRascunhoPagina({ ...rascunhoPagina, introducao: valor })}
                placeholder="Texto de introdução da página pública de projetos..."
              />

              <CampoAdmin
                label="Título da trajetória"
                required
                maxLen={200}
                minLen={2}
                proibirHtml
                value={rascunhoPagina.tituloTrajetoria}
                onChange={(valor) => setRascunhoPagina({ ...rascunhoPagina, tituloTrajetoria: valor })}
                placeholder="Ex: Nossa Trajetória"
              />

              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className={dados?.pagina.fundo.url ? "grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start" : "space-y-2"}>
                  {dados?.pagina.fundo.url && (
                    <div className="flex flex-col gap-1.5 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white min-w-[120px]">
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Fundo atual</span>
                      <div className="relative h-20 w-32 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                        <Image src={dados.pagina.fundo.url} alt="Imagem de fundo atual" fill unoptimized className="object-cover" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 flex-1">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                      Imagem de fundo
                      <select
                        value={rascunhoPagina.fundo.midiaId ?? ""}
                        onChange={(event) => {
                          const midia = dados?.midias.find((item) => item.id === event.target.value);
                          setRascunhoPagina({
                            ...rascunhoPagina,
                            fundo: { ...rascunhoPagina.fundo, midiaId: midia?.id ?? null, origem: null, url: midia?.url ?? null },
                          });
                        }}
                        className={campo}
                      >
                        <option value="">Usar imagem padrão</option>
                        {dados?.midias.map((midia) => (
                          <option key={midia.id} value={midia.id}>
                            {midia.nomeOriginal || midia.id.slice(0, 12)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {rascunhoPagina.fundo.midiaId && (
                      <div className="flex items-center gap-3">
                        <Image src={rascunhoPagina.fundo.url ?? "/padrao2.webp"} alt="Prévia do novo fundo" width={180} height={100} unoptimized className="h-20 w-32 rounded-md object-cover" />
                        <span className="text-xs text-slate-600">Novo fundo selecionado</span>
                      </div>
                    )}
                    <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551] hover:bg-slate-100">
                      {enviandoImagem ? "Enviando imagem…" : "Enviar imagem de fundo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={enviandoImagem}
                        onChange={(event) => void selecionarArquivo(event, (midia) => setRascunhoPagina((atual) => atual ? { ...atual, fundo: { ...atual.fundo, midiaId: midia.id, origem: null, url: midia.url } } : atual))}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                <Button onClick={() => setModalConfigAberto(false)} disabled={salvando} className="min-h-11">
                  Cancelar
                </Button>
                <Button type="primary" htmlType="submit" loading={salvando || enviandoImagem} className="min-h-11 px-5 font-semibold">
                  Salvar configurações
                </Button>
              </div>
            </form>
          )}
        </ModalAdmin>

        {/* Modal de Adicionar / Editar Foto da Galeria */}
        <ModalAdmin
          aberto={modalFotoAberto}
          aoFechar={() => setModalFotoAberto(false)}
          titulo={indiceFotoEditando !== null ? "Editar foto da galeria" : "Nova foto da galeria"}
          descricao="Selecione a imagem do Storage e defina os textos editoriais correspondentes."
          larguraMaxima="max-w-2xl"
        >
          <form onSubmit={salvarFotoModal} className="space-y-4">
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className={fotoAtualEmEdicao ? "grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start" : "space-y-2"}>
                {fotoAtualEmEdicao && (
                  <div className="flex flex-col gap-1.5 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white min-w-[120px]">
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Foto atual</span>
                    <div className="relative size-24 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                      <Image src={fotoAtualEmEdicao} alt="Foto atual da galeria" fill unoptimized className="object-cover" />
                    </div>
                  </div>
                )}
                <div className="space-y-2 flex-1">
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                    Imagem
                    <select
                      required
                      value={rascunhoFoto.midiaId}
                      onChange={(event) => {
                        const midia = dados?.midias.find((item) => item.id === event.target.value);
                        setRascunhoFoto({ ...rascunhoFoto, midiaId: midia?.id ?? "", url: midia?.url });
                      }}
                      className={campo}
                    >
                      <option value="">Selecione uma imagem</option>
                      {dados?.midias.map((midia) => (
                        <option key={midia.id} value={midia.id}>
                          {midia.nomeOriginal || midia.id.slice(0, 12)} · {Math.ceil(midia.bytes / 1024)} KB
                        </option>
                      ))}
                    </select>
                  </label>
                  {rascunhoFoto.url && (
                    <div className="flex items-center gap-3">
                      <Image src={rascunhoFoto.url} alt="Prévia" width={80} height={80} unoptimized className="size-20 rounded-md object-cover" />
                      <span className="text-xs text-slate-600">Nova foto selecionada</span>
                    </div>
                  )}
                  <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551] hover:bg-slate-100">
                    {enviandoImagem ? "Enviando imagem…" : "Enviar nova imagem"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={enviandoImagem}
                      onChange={(event) => void selecionarArquivo(event, (midia) => setRascunhoFoto({ ...rascunhoFoto, midiaId: midia.id, url: midia.url }))}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>

            <CampoAdmin
              label="Texto alternativo"
              maxLen={300}
              proibirHtml
              value={rascunhoFoto.textoAlternativo}
              onChange={(valor) => setRascunhoFoto({ ...rascunhoFoto, textoAlternativo: valor })}
              placeholder="Descrição acessível da imagem"
            />

            <CampoAdmin
              label="Legenda"
              tipo="textarea"
              linhas={3}
              maxLen={2000}
              proibirHtml
              value={rascunhoFoto.legenda}
              onChange={(valor) => setRascunhoFoto({ ...rascunhoFoto, legenda: valor })}
              placeholder="Legenda informativa exibida na galeria"
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <CampoAdmin
                label="Crédito"
                maxLen={300}
                proibirHtml
                value={rascunhoFoto.credito ?? ""}
                onChange={(valor) => setRascunhoFoto({ ...rascunhoFoto, credito: valor || null })}
                placeholder="Fotógrafo ou autor"
              />
              <CampoAdmin
                label="Data editorial"
                tipo="date"
                value={rascunhoFoto.dataEditorial ? rascunhoFoto.dataEditorial.slice(0, 10) : ""}
                onChange={(valor) => setRascunhoFoto({ ...rascunhoFoto, dataEditorial: valor || null })}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
              <Button onClick={() => setModalFotoAberto(false)} disabled={salvando} className="min-h-11">
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={salvando} disabled={!rascunhoFoto.midiaId} className="min-h-11 px-5 font-semibold">
                {indiceFotoEditando !== null ? "Salvar alterações" : "Adicionar à galeria"}
              </Button>
            </div>
          </form>
        </ModalAdmin>

        {carregando ? (
          <div className="rounded-xl border border-slate-300 bg-white p-6 text-slate-600">Carregando galeria de projetos…</div>
        ) : !dados ? (
          <div className="space-y-4 rounded-xl border border-slate-300 bg-white p-6">
            <p role="alert" className="text-red-700">{erro || "Página de projetos indisponível."}</p>
            <button type="button" onClick={() => void carregar()} className="min-h-10 rounded-lg border px-3 font-semibold text-[#412551]">Tentar novamente</button>
          </div>
        ) : (
          /* Galeria de Fotos - Foco Principal da Tela */
          <div className="w-full min-w-0 max-w-full overflow-hidden space-y-4 rounded-xl border border-slate-300 bg-white p-4 sm:p-6 2xl:p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-[#19121d]">Fotos cadastradas</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {dados.fotos.length} {dados.fotos.length === 1 ? "foto" : "fotos"}
                </span>
              </div>
            </div>

            {dados.fotos.length === 0 ? (
              <EstadoLista
                carregando={false}
                buscando={false}
                mensagemVazia="Nenhuma foto cadastrada na galeria de projetos."
                textoAcao="Adicionar primeira foto"
                aoCriar={abrirModalNovaFoto}
              />
            ) : (
              <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300">
                {dados.fotos.map((foto, index) => (
                  <li key={foto.id ?? `foto-${index}`} className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-1 last:pb-0 2xl:py-3">
                    <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {foto.url ? (
                          <Image src={foto.url} alt={foto.textoAlternativo || "Foto"} width={64} height={64} unoptimized className="size-16 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="size-16 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">Sem foto</div>
                        )}
                        <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-sm font-bold text-[#19121d]">
                            {foto.legenda || foto.textoAlternativo || `Foto ${index + 1}`}
                          </h3>
                          <p className="mt-0.5 break-words text-xs text-slate-500">
                            {foto.credito ? `Crédito: ${foto.credito}` : ""}{foto.dataEditorial ? ` · ${foto.dataEditorial.slice(0, 10)}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => void reordenarFoto(index, -1)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          aria-label={`Mover foto ${index + 1} para cima`}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={index === dados.fotos.length - 1}
                          onClick={() => void reordenarFoto(index, 1)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          aria-label={`Mover foto ${index + 1} para baixo`}
                        >
                          <ArrowDown size={15} />
                        </button>
                        <Button
                          onClick={() => abrirModalEditarFoto(index)}
                          icon={<Pencil size={15} aria-hidden="true" />}
                          className="min-h-11 2xl:min-h-10"
                        >
                          Editar
                        </Button>
                        <Button
                          danger
                          onClick={() => confirmarRemoverFoto(index)}
                          icon={<Trash2 size={15} aria-hidden="true" />}
                          className="min-h-11 2xl:min-h-10"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </ConfigProvider>
  );
}
