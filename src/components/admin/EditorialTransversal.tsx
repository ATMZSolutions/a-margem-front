"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TransversalSettings } from "@/lib/siteContent";

type Estado = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
type Tipo = "agenda" | "noticias" | "livros" | "projetos" | "sobre" | "integrantes" | "espetaculos" | "premios" | "historia" | "pagina";
type Seo = { titulo?: string; descricao?: string; imagemUrl?: string } | null;
type Registro = { tipo: Tipo; id: string; titulo: string; rota: string; estado: Estado; ordem: number; seo: Seo };

const TIPOS: { id: Tipo | "todos"; nome: string }[] = [
  { id: "todos", nome: "Todas as áreas" }, { id: "pagina", nome: "Páginas" },
  { id: "agenda", nome: "Agenda" }, { id: "noticias", nome: "Notícias" },
  { id: "livros", nome: "Indicações" }, { id: "projetos", nome: "Projetos" },
  { id: "sobre", nome: "História legada" }, { id: "historia", nome: "Marcos históricos" },
  { id: "integrantes", nome: "Integrantes" }, { id: "espetaculos", nome: "Espetáculos" }, { id: "premios", nome: "Prêmios" },
];
const CLASSE = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";
const ESTADOS: { valor: Estado; rotulo: string }[] = [
  { valor: "RASCUNHO", rotulo: "Rascunho" }, { valor: "PUBLICADO", rotulo: "Publicado" }, { valor: "ARQUIVADO", rotulo: "Arquivado" },
];
const CAMPOS_TEXTO_LONGOS = new Set<keyof TransversalSettings["textos"]>([
  "naoEncontradoMensagem", "agendaVazia", "noticiasVazias", "livrosVazios", "livrosComplementoVazio",
  "integrantesVazios", "espetaculosVazios", "premiosVazios",
]);
const CAMPOS_TEXTO: { campo: keyof TransversalSettings["textos"]; rotulo: string }[] = [
  { campo: "voltar", rotulo: "Rótulo acessível do botão voltar" },
  { campo: "fecharPainel", rotulo: "Rótulo acessível de fechar painel" },
  { campo: "saibaMais", rotulo: "Botão de notícia" },
  { campo: "mostrarMais", rotulo: "Botão mostrar mais" },
  { campo: "lerMais", rotulo: "Expandir biografia" },
  { campo: "lerMenos", rotulo: "Recolher biografia" },
  { campo: "abrirMenu", rotulo: "Rótulo acessível para abrir o menu" },
  { campo: "fecharMenu", rotulo: "Rótulo acessível para fechar o menu" },
  { campo: "voltarTopo", rotulo: "Rótulo acessível para voltar ao topo" },
  { campo: "slideAnterior", rotulo: "Rótulo acessível do slide anterior" },
  { campo: "proximoSlide", rotulo: "Rótulo acessível do próximo slide" },
  { campo: "detalhes", rotulo: "Título de detalhes" },
  { campo: "carregando", rotulo: "Mensagem de carregamento" },
  { campo: "tituloAgenda", rotulo: "Título de navegação: agenda" },
  { campo: "tituloNoticias", rotulo: "Título de navegação: notícias" },
  { campo: "tituloIndicacoes", rotulo: "Título de navegação: indicações" },
  { campo: "tituloSobre", rotulo: "Título de navegação: sobre" },
  { campo: "tituloProjetos", rotulo: "Título de navegação: projetos" },
  { campo: "tituloColetivo", rotulo: "Título de navegação: coletivo" },
  { campo: "tituloEspetaculos", rotulo: "Título de navegação: espetáculos" },
  { campo: "tituloPremios", rotulo: "Título de navegação: prêmios" },
  { campo: "naoEncontradoTitulo", rotulo: "Título da página 404" },
  { campo: "naoEncontradoMensagem", rotulo: "Mensagem da página 404" },
  { campo: "agendaVazia", rotulo: "Lista de agenda vazia" },
  { campo: "noticiasVazias", rotulo: "Lista de notícias vazia" },
  { campo: "livrosVazios", rotulo: "Lista de indicações vazia" },
  { campo: "livrosSubtitulo", rotulo: "Subtítulo das indicações" },
  { campo: "livrosComplementoVazio", rotulo: "Complemento da lista de indicações vazia" },
  { campo: "integrantesVazios", rotulo: "Lista de integrantes vazia" },
  { campo: "espetaculosVazios", rotulo: "Lista de espetáculos vazia" },
  { campo: "premiosVazios", rotulo: "Lista de prêmios vazia" },
];

export default function EditorialTransversal() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [configuracoes, setConfiguracoes] = useState<TransversalSettings | null>(null);
  const [filtro, setFiltro] = useState<Tipo | "todos">("todos");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Registro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [resposta, respostaConfiguracoes] = await Promise.all([
        fetch("/api/admin/editorial-transversal", { credentials: "include" }),
        fetch("/api/admin/editorial-transversal/configuracoes", { credentials: "include" }),
      ]);
      if (!resposta.ok || !respostaConfiguracoes.ok) throw new Error("Não foi possível carregar publicação, SEO e aparência.");
      setRegistros(await resposta.json() as Registro[]);
      setConfiguracoes(await respostaConfiguracoes.json() as TransversalSettings);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os registros.");
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const visiveis = useMemo(() => registros.filter((item) => filtro === "todos" || item.tipo === filtro), [registros, filtro]);

  function editar(item: Registro) {
    setSelecionado(`${item.tipo}:${item.id}`);
    setRascunho({ ...item, seo: item.seo ? { ...item.seo } : {} });
    setAviso("");
    setErro("");
  }

  function mudarSeo(campo: keyof NonNullable<Seo>, valor: string) {
    if (!rascunho) return;
    const seo = { ...(rascunho.seo ?? {}), [campo]: valor };
    setRascunho({ ...rascunho, seo });
  }

  async function salvar() {
    if (!rascunho) return;
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const resposta = await fetch("/api/admin/editorial-transversal", {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rascunho, seo: rascunho.seo ?? null }),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({})) as { error?: string };
        throw new Error(dados.error ?? "Não foi possível salvar as alterações.");
      }
      await carregar();
      setAviso("Publicação, ordem e SEO atualizados.");
      setSelecionado(null);
      setRascunho(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally { setSalvando(false); }
  }

  async function salvarConfiguracoes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configuracoes) return;
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const resposta = await fetch("/api/admin/editorial-transversal/configuracoes", {
        method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(configuracoes),
      });
      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({})) as { error?: string };
        throw new Error(dados.error ?? "Não foi possível salvar a aparência e os textos.");
      }
      setAviso("Aparência e textos atualizados.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a aparência e os textos.");
    } finally { setSalvando(false); }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <header className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-slate-900">Publicação, ordem e SEO</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Controle o que aparece no site, a ordem das listas e os metadados de páginas e conteúdos. Título, descrição e imagem em branco usam os padrões globais.</p>
      </header>

      {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
      {aviso && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

      {configuracoes && <form onSubmit={(event) => void salvarConfiguracoes(event)} className="space-y-5 rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <div><h2 className="text-xl font-bold text-slate-900">Aparência e textos gerais</h2><p className="mt-1 text-sm text-slate-600">Opções seguras para paleta, fundo e tipografia; os textos alimentam rótulos e estados vazios do site.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Paleta
            <select className={CLASSE} value={configuracoes.paleta} onChange={(event) => setConfiguracoes({ ...configuracoes, paleta: event.target.value as TransversalSettings["paleta"] })}><option value="margem">À Margem</option><option value="contraste">Alto contraste</option><option value="terrosa">Terrosa</option></select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Fundo geral
            <select className={CLASSE} value={configuracoes.fundo} onChange={(event) => setConfiguracoes({ ...configuracoes, fundo: event.target.value as TransversalSettings["fundo"] })}><option value="nenhum">Cor sólida</option><option value="padrao1.webp">Padrão 1</option><option value="padrao2.webp">Padrão 2</option><option value="exu-bg.svg">Exu</option></select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Tipografia geral
            <select className={CLASSE} value={configuracoes.tipografia} onChange={(event) => setConfiguracoes({ ...configuracoes, tipografia: event.target.value as TransversalSettings["tipografia"] })}><option value="sistema">Sistema (padrão)</option><option value="sedgwick">Sedgwick Ave Display</option><option value="zen-dots">Zen Dots</option></select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPOS_TEXTO.map(({ campo, rotulo }) => <label key={campo} className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">{rotulo}
            <input maxLength={CAMPOS_TEXTO_LONGOS.has(campo) ? 300 : 100} className={CLASSE} value={configuracoes.textos[campo]} onChange={(event) => setConfiguracoes({ ...configuracoes, textos: { ...configuracoes.textos, [campo]: event.target.value } })} />
          </label>)}
        </div>
        <div className="flex justify-end"><button type="submit" disabled={salvando} className="min-h-11 rounded-lg bg-[#412551] px-5 font-semibold text-white disabled:opacity-60">{salvando ? "Salvando…" : "Salvar aparência e textos"}</button></div>
      </form>}

      <label className="flex max-w-md flex-col gap-1.5 text-sm font-medium text-slate-700">Área
        <select className={CLASSE} value={filtro} onChange={(event) => { setFiltro(event.target.value as Tipo | "todos"); setRascunho(null); setSelecionado(null); }}>
          {TIPOS.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
        </select>
      </label>

      {rascunho && <form className="space-y-4 rounded-xl border border-violet-200 bg-violet-50 p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); void salvar(); }}>
        <div><p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Editando {TIPOS.find((tipo) => tipo.id === rascunho.tipo)?.nome}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{rascunho.titulo}</h2><p className="text-sm text-slate-600">{rascunho.rota}</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Publicação
            <select className={CLASSE} value={rascunho.estado} onChange={(event) => setRascunho({ ...rascunho, estado: event.target.value as Estado })}>{ESTADOS.map((estado) => <option key={estado.valor} value={estado.valor}>{estado.rotulo}</option>)}</select>
          </label>
          {rascunho.tipo !== "pagina" && <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Ordem
            <input className={CLASSE} type="number" min={0} max={10000} value={rascunho.ordem} onChange={(event) => setRascunho({ ...rascunho, ordem: Number(event.target.value) })} />
          </label>}
        </div>
        {(["pagina", "integrantes", "espetaculos", "premios"] as Tipo[]).includes(rascunho.tipo) && <div className="grid gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título SEO<input maxLength={300} className={CLASSE} value={rascunho.seo?.titulo ?? ""} onChange={(event) => mudarSeo("titulo", event.target.value)} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição SEO<textarea maxLength={1000} rows={3} className={`${CLASSE} min-h-24`} value={rascunho.seo?.descricao ?? ""} onChange={(event) => mudarSeo("descricao", event.target.value)} /></label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Imagem para compartilhamento (URL ou caminho começando com /)<input maxLength={1000} className={CLASSE} value={rascunho.seo?.imagemUrl ?? ""} onChange={(event) => mudarSeo("imagemUrl", event.target.value)} /></label>
        </div>}
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={salvando} className="min-h-11 rounded-lg bg-[#412551] px-4 font-semibold text-white disabled:opacity-60">{salvando ? "Salvando…" : "Salvar"}</button><button type="button" disabled={salvando} onClick={() => { setSelecionado(null); setRascunho(null); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700">Cancelar</button></div>
      </form>}

      {carregando ? <p role="status" className="rounded-lg bg-white p-5 text-slate-600">Carregando registros…</p> : visiveis.length === 0 ? <p className="rounded-lg bg-white p-5 text-slate-600">Nenhum registro nesta área.</p> : (
        <ul className="divide-y divide-slate-200 rounded-xl bg-white px-4 shadow-sm sm:px-5">
          {visiveis.map((item) => <li key={`${item.tipo}:${item.id}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><h2 className="truncate font-semibold text-slate-900">{item.titulo}</h2><p className="truncate text-sm text-slate-600">{item.rota} · {item.estado.toLowerCase()}{item.tipo !== "pagina" ? ` · ordem ${item.ordem}` : ""}</p></div>
            <button type="button" onClick={() => editar(item)} aria-pressed={selecionado === `${item.tipo}:${item.id}`} className="min-h-10 shrink-0 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-[#412551]">Editar</button>
          </li>)}
        </ul>
      )}
    </section>
  );
}
