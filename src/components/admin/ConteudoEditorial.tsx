"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import { Award, Clapperboard, Pencil, Trash2, Users } from "lucide-react";
import CabecalhoSecao from "./CabecalhoSecao";
import EstadoLista from "./EstadoLista";
import ModalAdmin from "./ModalAdmin";
import CampoAdmin from "./CampoAdmin";
import type { ChangeEvent, FormEvent } from "react";
import { slugify } from "@/utils/helpers";

type TipoEditorial = "integrantes" | "espetaculos" | "premios";
type Estado = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
type Registro = {
  id: string;
  slug: string;
  estado: Estado;
  ordem: number;
  nome?: string;
  titulo?: string;
  ano?: string;
  evento?: string;
  biografia?: string;
  fichaTecnica?: string;
  descricao?: string;
  lancamento?: string;
  estreia?: string | null;
  localEstreia?: string | null;
  corFundo?: string | null;
  fotoId?: string | null;
  fotoUrl?: string | null;
  capaId?: string | null;
  capaUrl?: string | null;
  secoes?: Secao[];
  fotosGaleria?: FotoGaleria[];
};
type Secao = { titulo: string; texto: string };
type FotoGaleria = { midiaId: string; url?: string | null; textoAlternativo: string; legenda: string; credito: string | null; dataEditorial: string | null };
type Midia = { id: string; url: string; mime: string; bytes: number; nomeOriginal: string | null };

const ROTAS: Record<TipoEditorial, string> = {
  integrantes: "/api/admin/integrantes",
  espetaculos: "/api/admin/espetaculos",
  premios: "/api/admin/premios",
};
const TITULOS: Record<TipoEditorial, { titulo: string; descricao: string; novo: string }> = {
  integrantes: { titulo: "Integrantes", descricao: "Edite perfis, fotos, ordem e publicação dos integrantes.", novo: "Novo integrante" },
  espetaculos: { titulo: "Espetáculos", descricao: "Edite capas, seções, galerias, ordem e publicação.", novo: "Novo espetáculo" },
  premios: { titulo: "Prêmios", descricao: "Edite reconhecimentos, imagens, ordem e publicação.", novo: "Novo prêmio" },
};

function novoFormulario(tipo: TipoEditorial): Record<string, string | number | null> {
  const base = { slug: "", ordem: 0, estado: "RASCUNHO" as Estado };
  if (tipo === "integrantes") return { ...base, nome: "", fichaTecnica: "", biografia: "", fotoId: null };
  if (tipo === "espetaculos") return { ...base, titulo: "", lancamento: "", estreia: "", localEstreia: "", corFundo: "#412551", capaId: null };
  return { ...base, titulo: "", ano: String(new Date().getFullYear()), evento: "", descricao: "", fotoId: null };
}

function valorTexto(formulario: Record<string, string | number | null>, campo: string): string {
  const valor = formulario[campo];
  return typeof valor === "string" || typeof valor === "number" ? String(valor) : "";
}

function tituloDo(item: Registro, tipo: TipoEditorial): string {
  return tipo === "integrantes" ? item.nome ?? item.slug : item.titulo ?? item.slug;
}

function classeCampo() {
  return "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";
}

function SeletorMidia({ midias, value, onChange, onUpload, enviando, label, imagemAtual }: {
  midias: Midia[]; value: string; onChange: (id: string | null) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void; enviando: boolean; label: string;
  imagemAtual?: string | null;
}) {
  const selecionada = midias.find((midia) => midia.id === value);
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className={imagemAtual ? "grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start" : "space-y-2"}>
        {imagemAtual && (
          <div className="flex flex-col gap-1.5 items-center justify-center p-2 rounded-lg border border-slate-200 bg-white min-w-[120px]">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Imagem atual</span>
            <div className="relative size-24 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
              <Image src={imagemAtual} alt="Imagem atual definida" fill unoptimized className="object-cover" />
            </div>
          </div>
        )}
        <div className="space-y-2 flex-1">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            {label}
            <select value={value} onChange={(event) => onChange(event.target.value || null)} className={classeCampo()}>
              <option value="">Sem imagem</option>
              {midias.map((midia) => <option key={midia.id} value={midia.id}>{midia.nomeOriginal || midia.id.slice(0, 12)} · {Math.ceil(midia.bytes / 1024)} KB</option>)}
            </select>
          </label>
          {selecionada && (
            <div className="flex items-center gap-3">
              <Image src={selecionada.url} alt="Prévia da mídia selecionada" width={72} height={72} unoptimized className="size-18 rounded-md object-cover" />
              <span className="text-xs text-slate-600">{selecionada.nomeOriginal || selecionada.id} · {selecionada.mime} · {Math.ceil(selecionada.bytes / 1024)} KB</span>
            </div>
          )}
          <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551] hover:bg-slate-100">
            {enviando ? "Enviando imagem…" : "Enviar nova imagem"}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviando} onChange={onUpload} className="sr-only" />
          </label>
          <p className="text-xs text-slate-500">A imagem será otimizada e enviada ao Storage. Limite: 5 MiB.</p>
        </div>
      </div>
    </div>
  );
}

export default function ConteudoEditorial({ tipo }: { tipo: TipoEditorial }) {
  const [modal, contextHolder] = Modal.useModal();
  const [items, setItems] = useState<Registro[]>([]);
  const [midias, setMidias] = useState<Midia[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<Record<string, string | number | null>>(() => novoFormulario(tipo));
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState("");
  const [falhaCarga, setFalhaCarga] = useState(false);
  const [aviso, setAviso] = useState("");
  const [filtro, setFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;
  const config = TITULOS[tipo];

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    setFalhaCarga(false);
    try {
      const [respostaItems, respostaMidias] = await Promise.all([
        fetch(ROTAS[tipo], { credentials: "include" }),
        fetch("/api/admin/midias", { credentials: "include" }),
      ]);
      if (!respostaItems.ok || !respostaMidias.ok) throw new Error("Não foi possível carregar o conteúdo e as mídias.");
      setItems(await respostaItems.json() as Registro[]);
      setMidias(await respostaMidias.json() as Midia[]);
    } catch (error) {
      setFalhaCarga(true);
      setErro(error instanceof Error ? error.message : "Não foi possível carregar o conteúdo.");
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => { void carregar(); }, [carregar]);

  const registrosOrdenados = useMemo(() => [...items].sort((a, b) => a.ordem - b.ordem || tituloDo(a, tipo).localeCompare(tituloDo(b, tipo), "pt-BR")), [items, tipo]);

  const registrosFiltrados = useMemo(() => {
    if (!filtro.trim()) return registrosOrdenados;
    const busca = filtro.toLowerCase().trim();
    return registrosOrdenados.filter((item) =>
      tituloDo(item, tipo).toLowerCase().includes(busca) || item.slug.toLowerCase().includes(busca)
    );
  }, [registrosOrdenados, filtro, tipo]);

  const registrosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return registrosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [registrosFiltrados, paginaAtual]);

  const IconePadrao = tipo === "integrantes" ? Users : tipo === "espetaculos" ? Clapperboard : Award;

  function iniciarNovo() {
    setSelecionado(null);
    setFormulario(novoFormulario(tipo));
    setSecoes([]);
    setFotos([]);
    setErro("");
    setAviso("");
    setAberto(true);
  }

  function iniciarEdicao(item: Registro) {
    const base = novoFormulario(tipo);
    const campos = Object.keys(base);
    const valores = Object.fromEntries(campos.map((campo) => [campo, (item as unknown as Record<string, string | number | null>)[campo] ?? base[campo]]));
    if (tipo === "integrantes") valores.fotoId = item.fotoId ?? null;
    if (tipo === "espetaculos") valores.capaId = item.capaId ?? null;
    if (tipo === "premios") valores.fotoId = item.fotoId ?? null;
    setSelecionado(item.id);
    setFormulario(valores);
    setSecoes(item.secoes ?? []);
    setFotos((item.fotosGaleria ?? []).map(({ midiaId, textoAlternativo, legenda, credito, dataEditorial, url }) => ({ midiaId, textoAlternativo, legenda, credito, dataEditorial, url })));
    setErro("");
    setAviso("");
    setAberto(true);
  }

  function alterar(campo: string, valor: string | number | null) {
    setFormulario((atual) => {
      const proximo = { ...atual, [campo]: valor };
      if (!selecionado && (campo === "nome" || campo === "titulo")) proximo.slug = slugify(String(valor));
      return proximo;
    });
  }

  async function enviarImagem(event: ChangeEvent<HTMLInputElement>, aoSelecionar: (id: string | null) => void) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;
    setEnviandoImagem(true);
    setErro("");
    try {
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
      const midia = await resposta.json() as Midia;
      setMidias((atuais) => [midia, ...atuais.filter((item) => item.id !== midia.id)]);
      aoSelecionar(midia.id);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  function atualizarFoto(index: number, updates: Partial<FotoGaleria>) {
    setFotos((atuais) => atuais.map((foto, i) => i === index ? { ...foto, ...updates } : foto));
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setAviso("");
    const body: Record<string, unknown> = { ...formulario };
    if (selecionado) body.id = selecionado;
    if (tipo === "espetaculos") {
      body.secoes = secoes;
      body.fotosGaleria = fotos.filter((foto) => foto.midiaId);
    }
    try {
      const resposta = await fetch(ROTAS[tipo], {
        method: selecionado ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(dados?.error || "Não foi possível salvar.");
      }
      setAberto(false);
      setAviso(selecionado ? "Alterações salvas." : "Conteúdo criado.");
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function arquivar(item: Registro) {
    modal.confirm({
      title: "Confirmar arquivamento",
      content: `Deseja realmente arquivar “${tituloDo(item, tipo)}”? O conteúdo deixará de aparecer publicamente e poderá ser restaurado depois.`,
      okText: "Sim, arquivar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        setErro("");
        try {
          const resposta = await fetch(`${ROTAS[tipo]}?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
          if (!resposta.ok) throw new Error("Não foi possível arquivar o conteúdo.");
          setAviso("Conteúdo arquivado.");
          await carregar();
        } catch (error) {
          setErro(error instanceof Error ? error.message : "Não foi possível arquivar o conteúdo.");
        }
      },
    });
  }

  function confirmarRemoverFoto(index: number) {
    const foto = fotos[index];
    const legenda = foto?.legenda || `Foto ${index + 1}`;
    modal.confirm({
      title: "Confirmar remoção",
      content: `Deseja remover "${legenda}" da galeria deste espetáculo?`,
      okText: "Sim, remover",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: () => {
        setFotos((atuais) => atuais.filter((_, i) => i !== index));
      },
    });
  }

  const itemEmEdicao = useMemo(() => items.find((i) => i.id === selecionado), [items, selecionado]);

  function seletorMidia(campo: string, label: string) {
    const valor = valorTexto(formulario, campo);
    const imagemAtual = campo === "fotoId" ? itemEmEdicao?.fotoUrl : campo === "capaId" ? itemEmEdicao?.capaUrl : null;
    return (
      <SeletorMidia
        midias={midias}
        value={valor}
        onChange={(id) => alterar(campo, id)}
        onUpload={(event) => void enviarImagem(event, (id) => alterar(campo, id))}
        enviando={enviandoImagem}
        label={label}
        imagemAtual={imagemAtual}
      />
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="admin-secao-titulo">
      <CabecalhoSecao titulo={config.titulo} descricao={config.descricao} acao={config.novo} aberto={false} desabilitado={falhaCarga} aoAlternar={() => iniciarNovo()} />

      <ModalAdmin
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo={selecionado ? "Editar conteúdo" : config.novo}
        descricao={selecionado ? "Atualize as informações e confirme para salvar as alterações." : "Preencha os campos abaixo para cadastrar um novo item."}
        larguraMaxima="max-w-3xl"
      >
        <form onSubmit={salvar} className="space-y-5">
          {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            {tipo === "integrantes" && (
              <>
                <CampoAdmin label="Nome" required value={valorTexto(formulario, "nome")} onChange={(value) => alterar("nome", value)} maxLen={200} />
                <CampoAdmin label="Identificador da página" required value={valorTexto(formulario, "slug")} onChange={(value) => alterar("slug", slugify(value))} maxLen={120} />
                <div className="md:col-span-2">{seletorMidia("fotoId", "Foto do perfil")}</div>
                <div className="md:col-span-2"><CampoAdmin label="Ficha técnica" required tipo="textarea" linhas={4} value={valorTexto(formulario, "fichaTecnica")} onChange={(value) => alterar("fichaTecnica", value)} maxLen={5000} /></div>
                <div className="md:col-span-2"><CampoAdmin label="Biografia" required tipo="textarea" linhas={5} value={valorTexto(formulario, "biografia")} onChange={(value) => alterar("biografia", value)} maxLen={20000} /></div>
              </>
            )}
            {tipo === "premios" && (
              <>
                <CampoAdmin label="Título" required value={valorTexto(formulario, "titulo")} onChange={(value) => alterar("titulo", value)} maxLen={300} />
                <CampoAdmin label="Identificador da página" required value={valorTexto(formulario, "slug")} onChange={(value) => alterar("slug", slugify(value))} maxLen={120} />
                <CampoAdmin label="Ano" required tipo="year" value={valorTexto(formulario, "ano")} onChange={(value) => alterar("ano", value)} />
                <CampoAdmin label="Evento" required value={valorTexto(formulario, "evento")} onChange={(value) => alterar("evento", value)} maxLen={300} />
                <div className="md:col-span-2">{seletorMidia("fotoId", "Imagem do prêmio")}</div>
                <div className="md:col-span-2"><CampoAdmin label="Descrição" required tipo="textarea" linhas={5} value={valorTexto(formulario, "descricao")} onChange={(value) => alterar("descricao", value)} maxLen={20000} /></div>
              </>
            )}
            {tipo === "espetaculos" && (
              <>
                <CampoAdmin label="Título" required value={valorTexto(formulario, "titulo")} onChange={(value) => alterar("titulo", value)} maxLen={300} />
                <CampoAdmin label="Identificador da página" required value={valorTexto(formulario, "slug")} onChange={(value) => alterar("slug", slugify(value))} maxLen={120} />
                <CampoAdmin label="Ano de lançamento" required value={valorTexto(formulario, "lancamento")} onChange={(value) => alterar("lancamento", value)} maxLen={30} />
                <CampoAdmin label="Data de estreia (opcional)" value={valorTexto(formulario, "estreia")} onChange={(value) => alterar("estreia", value)} maxLen={50} />
                <CampoAdmin label="Local de estreia" value={valorTexto(formulario, "localEstreia")} onChange={(value) => alterar("localEstreia", value)} maxLen={500} />
                <CampoAdmin label="Cor de fundo (hexadecimal)" value={valorTexto(formulario, "corFundo")} onChange={(value) => alterar("corFundo", value)} maxLen={7} />
                <div className="md:col-span-2">{seletorMidia("capaId", "Capa do espetáculo")}</div>
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">Seções da página</h3>
                    <button type="button" onClick={() => setSecoes((atuais) => [...atuais, { titulo: "", texto: "" }])} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Adicionar seção</button>
                  </div>
                  {secoes.map((secao, index) => (
                    <div key={`secao-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <CampoAdmin label={`Título da seção ${index + 1}`} required value={secao.titulo} onChange={(titulo) => setSecoes((atuais) => atuais.map((item, i) => i === index ? { ...item, titulo } : item))} maxLen={200} />
                      <CampoAdmin label="Texto" required tipo="textarea" linhas={4} value={secao.texto} onChange={(texto) => setSecoes((atuais) => atuais.map((item, i) => i === index ? { ...item, texto } : item))} maxLen={20000} />
                      <button type="button" onClick={() => setSecoes((atuais) => atuais.filter((_, i) => i !== index))} className="min-h-9 justify-self-start px-2 text-sm font-semibold text-red-700 hover:underline">Remover seção</button>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">Galeria</h3>
                    <button type="button" onClick={() => setFotos((atuais) => [...atuais, { midiaId: "", textoAlternativo: "", legenda: "", credito: null, dataEditorial: null }])} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Adicionar foto</button>
                  </div>
                  {fotos.map((foto, index) => (
                    <div key={`foto-${index}`} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <SeletorMidia
                        midias={midias}
                        value={foto.midiaId}
                        onChange={(midiaId) => atualizarFoto(index, { midiaId: midiaId ?? "" })}
                        onUpload={(event) => void enviarImagem(event, (midiaId) => atualizarFoto(index, { midiaId: midiaId ?? "" }))}
                        enviando={enviandoImagem}
                        label={`Foto ${index + 1}`}
                        imagemAtual={foto.url}
                      />
                      <CampoAdmin label="Texto alternativo" value={foto.textoAlternativo} onChange={(textoAlternativo) => atualizarFoto(index, { textoAlternativo })} maxLen={300} />
                      <CampoAdmin label="Legenda" tipo="textarea" linhas={2} value={foto.legenda} onChange={(legenda) => atualizarFoto(index, { legenda })} maxLen={2000} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <CampoAdmin label="Crédito" value={foto.credito ?? ""} onChange={(credito) => atualizarFoto(index, { credito: credito || null })} maxLen={300} />
                        <CampoAdmin label="Data editorial" value={foto.dataEditorial ?? ""} onChange={(dataEditorial) => atualizarFoto(index, { dataEditorial: dataEditorial || null })} maxLen={50} />
                      </div>
                      <button type="button" onClick={() => confirmarRemoverFoto(index)} className="min-h-9 px-2 text-sm font-semibold text-red-700 hover:underline">Remover foto</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <CampoAdmin label="Ordem" tipo="number" min={0} max={9999} value={valorTexto(formulario, "ordem")} onChange={(value) => alterar("ordem", Number(value))} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Publicação
              <select value={valorTexto(formulario, "estado")} onChange={(event) => alterar("estado", event.target.value)} className={classeCampo()}>
                <option value="RASCUNHO">Rascunho</option>
                <option value="PUBLICADO">Publicado</option>
                <option value="ARQUIVADO">Arquivado</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
            <Button onClick={() => setAberto(false)} disabled={salvando} className="min-h-11">
              Cancelar
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={salvando || enviandoImagem}
              className="min-h-11 px-5"
            >
              {salvando ? "Salvando…" : selecionado ? "Salvar alterações" : "Cadastrar"}
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
          {!aberto && erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
          {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

          {/* Cabeçalho de busca */}
          {!carregando && !falhaCarga && registrosOrdenados.length > 0 && (
            <div className="my-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#19121d]">{config.titulo} cadastrados</h3>
                {filtro && (
                  <Button size="small" onClick={() => { setFiltro(""); setPaginaAtual(1); }} className="text-xs">
                    Limpar filtro
                  </Button>
                )}
              </div>
              <Input.Search
                aria-label={`Buscar ${config.titulo.toLowerCase()} por nome ou identificador`}
                placeholder={`Filtrar por ${tipo === "integrantes" ? "nome" : "título"} ou identificador...`}
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
          ) : falhaCarga ? (
            <div className="py-6 text-center">
              <button type="button" onClick={() => void carregar()} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]">Tentar novamente</button>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <EstadoLista
              carregando={false}
              buscando={Boolean(filtro)}
              mensagemVazia="Nenhum conteúdo cadastrado."
              textoAcao={config.novo}
              aoCriar={iniciarNovo}
            />
          ) : (
            <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300 border-t border-slate-300">
              {registrosPaginados.map((item) => (
                <li key={item.id} className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
                  <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {item.fotoUrl || item.capaUrl ? (
                        <Image
                          src={item.fotoUrl || item.capaUrl || "/padrao2.webp"}
                          alt=""
                          width={64}
                          height={64}
                          unoptimized
                          className="size-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-10">
                          <IconePadrao className="size-5 2xl:size-[18px]" />
                        </span>
                      )}
                      <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-[#19121d]">{tituloDo(item, tipo)}</h3>
                        <p className="mt-1 break-words text-sm text-slate-600">
                          /{tipo === "integrantes" ? "coletivo/integrante" : tipo}/{item.slug}{tipo === "premios" ? `/${item.ano}` : ""} · ordem {item.ordem} · {item.estado.toLowerCase()}
                        </p>
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
          )}

          {registrosFiltrados.length > itensPorPagina && (
            <div className="flex mt-6 mb-4 w-full justify-center">
              <Pagination
                aria-label={`Navegação de páginas de ${config.titulo.toLowerCase()}`}
                current={paginaAtual}
                pageSize={itensPorPagina}
                total={registrosFiltrados.length}
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
