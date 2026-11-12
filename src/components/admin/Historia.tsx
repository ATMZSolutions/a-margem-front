"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import { History, Pencil, Trash2 } from "lucide-react";
import CabecalhoSecao from "./CabecalhoSecao";
import EstadoLista from "./EstadoLista";
import ModalAdmin from "./ModalAdmin";
import CampoAdmin from "./CampoAdmin";

type Estado = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
type Marco = { id: string; ano: number; descricao: string; ordem: number; estado: Estado; midiaId: string | null; imageUrl: string | null };
type Midia = { id: string; url: string; mime: string; bytes: number; nomeOriginal: string | null };
type Formulario = { ano: string; descricao: string; ordem: number; estado: Estado; midiaId: string | null; imageUrl: string | null };
type Resposta = { itens: Marco[]; midias: Midia[] };

const vazio: Formulario = { ano: String(new Date().getFullYear()), descricao: "", ordem: 0, estado: "RASCUNHO", midiaId: null, imageUrl: null };
const campo = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";

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

export default function Historia() {
  const [modal, contextHolder] = Modal.useModal();
  const [dados, setDados] = useState<Resposta | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(vazio);
  const [editando, setEditando] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [filtro, setFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const itemEmEdicao = useMemo(() => dados?.itens.find((i) => i.id === editando), [dados, editando]);
  const imagemOriginal = itemEmEdicao?.imageUrl;

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/admin/historia", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar os marcos históricos.");
      setDados(await resposta.json() as Resposta);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar a história.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  function iniciarNovo() {
    setEditando(null);
    setFormulario({ ...vazio, ano: String(new Date().getFullYear()), ordem: dados?.itens.length ?? 0 });
    setAberto(true);
    setErro("");
    setAviso("");
  }

  function iniciarEdicao(item: Marco) {
    setEditando(item.id);
    setFormulario({
      ano: String(item.ano),
      descricao: item.descricao,
      ordem: item.ordem,
      estado: item.estado,
      midiaId: item.midiaId,
      imageUrl: item.imageUrl,
    });
    setAberto(true);
    setErro("");
    setAviso("");
  }

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    setEnviandoImagem(true);
    setErro("");
    try {
      const midia = await enviarMidia(arquivo);
      setDados((atual) => atual ? { ...atual, midias: [midia, ...atual.midias.filter((item) => item.id !== midia.id)] } : atual);
      setFormulario((atual) => ({ ...atual, midiaId: midia.id, imageUrl: midia.url }));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const resposta = await fetch("/api/admin/historia", {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formulario, ano: Number(formulario.ano), ...(editando ? { id: editando } : {}) }),
      });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar o marco histórico.");
      }
      setAberto(false);
      setAviso(editando ? "Marco histórico atualizado com sucesso." : "Marco histórico criado com sucesso.");
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar o marco histórico.");
    } finally {
      setSalvando(false);
    }
  }

  function arquivar(item: Marco) {
    modal.confirm({
      title: "Confirmar arquivamento",
      content: `Deseja realmente arquivar o marco de ${item.ano}? O conteúdo deixará de aparecer publicamente e poderá ser restaurado depois.`,
      okText: "Sim, arquivar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        setErro("");
        try {
          const resposta = await fetch(`/api/admin/historia?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
          if (!resposta.ok) throw new Error("Não foi possível arquivar o marco.");
          setAviso("Marco arquivado com sucesso.");
          await carregar();
        } catch (error) {
          setErro(error instanceof Error ? error.message : "Não foi possível arquivar o marco.");
        }
      },
    });
  }

  const itensOrdenados = useMemo(() => {
    if (!dados?.itens) return [];
    return [...dados.itens].sort((a, b) => a.ordem - b.ordem || a.ano - b.ano);
  }, [dados?.itens]);

  const itensFiltrados = useMemo(() => {
    if (!filtro.trim()) return itensOrdenados;
    const busca = filtro.toLowerCase().trim();
    return itensOrdenados.filter((item) =>
      String(item.ano).includes(busca) || item.descricao.toLowerCase().includes(busca)
    );
  }, [itensOrdenados, filtro]);

  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itensFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [itensFiltrados, paginaAtual]);

  return (
    <section className="space-y-4" aria-labelledby="admin-secao-titulo">
      <CabecalhoSecao
        titulo="História e trajetória"
        descricao="Edite marcos históricos, imagens, ordem e publicação."
        acao="Novo marco"
        aberto={false}
        aoAlternar={iniciarNovo}
      />

      <ModalAdmin
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={editando ? "Editar marco histórico" : "Novo marco histórico"}
        descricao={editando ? "Atualize os dados e confirme para salvar as alterações." : "Preencha os campos abaixo para cadastrar um novo marco na trajetória."}
        larguraMaxima="max-w-2xl"
      >
        <form onSubmit={(event) => void salvar(event)} className="space-y-4">
          {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <CampoAdmin
              label="Ano"
              tipo="year"
              required
              value={formulario.ano}
              onChange={(valor) => setFormulario({ ...formulario, ano: valor })}
            />
            <CampoAdmin
              label="Ordem"
              tipo="number"
              min={0}
              max={10000}
              required
              value={formulario.ordem}
              onChange={(valor) => setFormulario({ ...formulario, ordem: Number(valor) || 0 })}
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Publicação
              <select
                value={formulario.estado}
                onChange={(event) => setFormulario({ ...formulario, estado: event.target.value as Estado })}
                className={campo}
              >
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADO">Publicado</option>
                <option value="ARQUIVADO">Arquivado</option>
              </select>
            </label>
          </div>

          <CampoAdmin
            label="Descrição"
            tipo="textarea"
            required
            linhas={5}
            maxLen={20000}
            minLen={5}
            proibirHtml
            value={formulario.descricao}
            onChange={(valor) => setFormulario({ ...formulario, descricao: valor })}
            placeholder="Descreva o marco histórico ocorrido neste período..."
          />

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className={imagemOriginal ? "grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start" : "space-y-2"}>
              {imagemOriginal && (
                <div className="flex flex-col gap-1.5 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white min-w-[120px]">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Imagem atual</span>
                  <div className="relative size-24 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                    <Image src={imagemOriginal} alt="Imagem atual do marco" fill unoptimized className="object-cover" />
                  </div>
                </div>
              )}
              <div className="space-y-2 flex-1">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                  Imagem do marco
                  <select
                    value={formulario.midiaId ?? ""}
                    onChange={(event) => {
                      const midia = dados?.midias.find((item) => item.id === event.target.value);
                      setFormulario({ ...formulario, midiaId: midia?.id ?? null, imageUrl: midia?.url ?? null });
                    }}
                    className={campo}
                  >
                    <option value="">Sem imagem</option>
                    {dados?.midias.map((midia) => (
                      <option key={midia.id} value={midia.id}>
                        {midia.nomeOriginal || midia.id.slice(0, 12)} · {Math.ceil(midia.bytes / 1024)} KB
                      </option>
                    ))}
                  </select>
                </label>
                {formulario.imageUrl && (
                  <div className="flex items-center gap-3">
                    <Image src={formulario.imageUrl} alt="Prévia da imagem" width={80} height={80} unoptimized className="size-20 rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormulario({ ...formulario, midiaId: null, imageUrl: null })}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}
                <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551] hover:bg-slate-100">
                  {enviandoImagem ? "Enviando imagem…" : "Enviar nova imagem"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event)} className="sr-only" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              onClick={() => setAberto(false)}
              disabled={salvando}
              className="min-h-11"
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={salvando || enviandoImagem}
              className="min-h-11 px-5"
            >
              {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar marco"}
            </Button>
          </div>
        </form>
      </ModalAdmin>

      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-4 sm:p-6 2xl:p-5">
        <ConfigProvider
          theme={{
            components: {
              Pagination: {
                itemBg: "#ffffff",
                itemActiveBg: "#fff1df",
                colorPrimary: "#412551",
                colorText: "#334155",
                colorPrimaryHover: "#681A01",
                colorTextDisabled: "#94a3b8",
                itemLinkBg: "#ffffff",
              },
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
          {erro && !aberto && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
          {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

          {/* Cabeçalho de busca */}
          {!carregando && itensOrdenados.length > 0 && (
            <div className="my-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#19121d]">Marcos cadastrados</h3>
                {filtro && (
                  <Button size="small" onClick={() => { setFiltro(""); setPaginaAtual(1); }} className="text-xs">
                    Limpar filtro
                  </Button>
                )}
              </div>
              <Input.Search
                aria-label="Buscar marcos por ano ou descrição"
                placeholder="Filtrar por ano ou palavra-chave..."
                value={filtro}
                onChange={(e) => { setFiltro(e.target.value); setPaginaAtual(1); }}
                className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                variant="borderless"
                allowClear
              />
            </div>
          )}

          {carregando ? (
            <EstadoLista carregando buscando={false} mensagemVazia="" />
          ) : !dados ? (
            <div className="py-8 text-center space-y-3">
              <p role="alert" className="text-sm font-medium text-red-700">{erro || "Não foi possível carregar a história."}</p>
              <button
                type="button"
                onClick={() => void carregar()}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] hover:bg-slate-50"
              >
                Tentar novamente
              </button>
            </div>
          ) : itensFiltrados.length > 0 ? (
            <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300 border-t border-slate-300">
              {itensPaginados.map((item) => (
                <li key={item.id} className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
                  <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={`Marco de ${item.ano}`}
                          width={64}
                          height={64}
                          unoptimized
                          className="size-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-10">
                          <History className="size-5 2xl:size-[18px]" />
                        </span>
                      )}
                      <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-[#19121d]">Ano {item.ano}</h3>
                        <div className="mt-1 line-clamp-3 break-words text-sm text-slate-600">{item.descricao}</div>
                        <p className="mt-1 text-xs text-slate-500">Ordem {item.ordem} · {item.estado.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 sm:pl-4">
                      <Button
                        onClick={() => iniciarEdicao(item)}
                        icon={<Pencil size={15} aria-hidden="true" />}
                        className="min-h-11 2xl:min-h-10"
                      >
                        Editar
                      </Button>
                      {item.estado !== "ARQUIVADO" && (
                        <Button
                          danger
                          onClick={() => void arquivar(item)}
                          icon={<Trash2 size={15} aria-hidden="true" />}
                          className="min-h-11 2xl:min-h-10"
                        >
                          Arquivar
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EstadoLista
              carregando={false}
              buscando={Boolean(filtro)}
              mensagemVazia="Ainda não há marcos históricos cadastrados."
              textoAcao="Cadastrar primeiro marco"
              aoCriar={iniciarNovo}
            />
          )}

          {itensFiltrados.length > itensPorPagina && (
            <div className="flex mt-6 mb-4 w-full justify-center">
              <Pagination
                aria-label="Navegação de páginas de marcos históricos"
                current={paginaAtual}
                pageSize={itensPorPagina}
                total={itensFiltrados.length}
                responsive
                onChange={(page) => setPaginaAtual(page)}
                showSizeChanger={false}
                className="custom-pagination"
              />
            </div>
          )}
        </ConfigProvider>
      </div>
    </section>
  );
}
