"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type Estado = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
type Marco = { id: string; ano: number; descricao: string; ordem: number; estado: Estado; midiaId: string | null; imageUrl: string | null };
type Midia = { id: string; url: string; mime: string; bytes: number; nomeOriginal: string | null };
type Formulario = { ano: string; descricao: string; ordem: number; estado: Estado; midiaId: string | null; imageUrl: string | null };
type Resposta = { itens: Marco[]; midias: Midia[] };
const vazio: Formulario = { ano: String(new Date().getFullYear()), descricao: "", ordem: 0, estado: "RASCUNHO", midiaId: null, imageUrl: null };
const campo = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";

async function enviarMidia(arquivo: File): Promise<Midia> {
  const formData = new FormData(); formData.append("file", arquivo);
  const otimizada = await fetch("/api/upload", { method: "POST", body: formData });
  if (!otimizada.ok) throw new Error("A imagem foi recusada. Use JPEG, PNG ou WebP de até 5 MiB.");
  const dados = await otimizada.json() as { imageData: string; imagemTipo: string };
  const resposta = await fetch("/api/admin/midias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dados, nomeOriginal: arquivo.name }) });
  if (!resposta.ok) throw new Error("Não foi possível salvar a imagem no Storage.");
  return await resposta.json() as Midia;
}

export default function Historia() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(vazio);
  const [editando, setEditando] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const resposta = await fetch("/api/admin/historia", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar os marcos históricos.");
      setDados(await resposta.json() as Resposta);
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível carregar a história."); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  function iniciarNovo() { setEditando(null); setFormulario({ ...vazio, ano: String(new Date().getFullYear()), ordem: dados?.itens.length ?? 0 }); setAberto(true); setErro(""); setAviso(""); }
  function iniciarEdicao(item: Marco) { setEditando(item.id); setFormulario({ ano: String(item.ano), descricao: item.descricao, ordem: item.ordem, estado: item.estado, midiaId: item.midiaId, imageUrl: item.imageUrl }); setAberto(true); setErro(""); setAviso(""); }

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]; event.target.value = ""; if (!arquivo) return;
    setEnviandoImagem(true); setErro("");
    try {
      const midia = await enviarMidia(arquivo);
      setDados((atual) => atual ? { ...atual, midias: [midia, ...atual.midias.filter((item) => item.id !== midia.id)] } : atual);
      setFormulario((atual) => ({ ...atual, midiaId: midia.id, imageUrl: midia.url }));
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível enviar a imagem."); }
    finally { setEnviandoImagem(false); }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSalvando(true); setErro(""); setAviso("");
    try {
      const resposta = await fetch("/api/admin/historia", { method: editando ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formulario, ano: Number(formulario.ano), ...(editando ? { id: editando } : {}) }) });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar o marco histórico.");
      }
      setAberto(false); setAviso(editando ? "Marco histórico atualizado." : "Marco histórico criado."); await carregar();
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível salvar o marco histórico."); }
    finally { setSalvando(false); }
  }

  async function arquivar(item: Marco) {
    if (!window.confirm(`Arquivar o marco de ${item.ano}?`)) return;
    setErro("");
    try {
      const resposta = await fetch(`/api/admin/historia?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Não foi possível arquivar o marco.");
      setAviso("Marco arquivado."); await carregar();
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível arquivar o marco."); }
  }

  if (carregando) return <section className="rounded-xl border border-slate-300 bg-white p-6">Carregando história…</section>;
  if (!dados) return <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-6"><p role="alert">{erro || "História indisponível."}</p><button type="button" onClick={() => void carregar()} className="min-h-10 rounded-lg border px-3">Tentar novamente</button></section>;
  const itens = [...dados.itens].sort((a, b) => a.ordem - b.ordem || a.ano - b.ano);

  return <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">História e trajetória</h1><p className="mt-1 text-sm text-slate-600">Edite marcos, imagens, ordem e publicação. Arquivar mantém o registro recuperável.</p></div><button type="button" onClick={() => aberto ? setAberto(false) : iniciarNovo()} className="min-h-11 rounded-lg bg-[#412551] px-4 font-semibold text-white">{aberto ? "Fechar formulário" : "Novo marco"}</button></div>
    <div className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}{aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}
      {aberto && <form onSubmit={(event) => void salvar(event)} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><h2 className="font-semibold">{editando ? "Editar marco" : "Novo marco"}</h2>
        <div className="grid gap-4 md:grid-cols-3"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Ano<input required type="number" min={1800} max={2200} value={formulario.ano} onChange={(event) => setFormulario({ ...formulario, ano: event.target.value })} className={campo} /></label><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Ordem<input required type="number" min={0} max={10000} value={formulario.ordem} onChange={(event) => setFormulario({ ...formulario, ordem: Number(event.target.value) })} className={campo} /></label><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Publicação<select value={formulario.estado} onChange={(event) => setFormulario({ ...formulario, estado: event.target.value as Estado })} className={campo}><option value="RASCUNHO">Rascunho</option><option value="PUBLICADO">Publicado</option><option value="ARQUIVADO">Arquivado</option></select></label></div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição<textarea required maxLength={20000} rows={6} value={formulario.descricao} onChange={(event) => setFormulario({ ...formulario, descricao: event.target.value })} className={`${campo} min-h-32`} /></label>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Imagem<select value={formulario.midiaId ?? ""} onChange={(event) => { const midia = dados.midias.find((item) => item.id === event.target.value); setFormulario({ ...formulario, midiaId: midia?.id ?? null, imageUrl: midia?.url ?? null }); }} className={campo}><option value="">Sem imagem</option>{dados.midias.map((midia) => <option key={midia.id} value={midia.id}>{midia.nomeOriginal || midia.id.slice(0, 12)}</option>)}</select></label>
          {formulario.imageUrl && <Image src={formulario.imageUrl} alt="Prévia da imagem" width={180} height={140} unoptimized className="h-32 w-44 rounded-md object-cover" />}
          <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold">{enviandoImagem ? "Enviando…" : "Enviar nova imagem"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event)} className="sr-only" /></label>
          <button type="button" onClick={() => setFormulario({ ...formulario, midiaId: null, imageUrl: null })} className="ml-3 min-h-10 px-2 text-sm text-red-700">Remover vínculo</button>
        </div>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={salvando || enviandoImagem} className="min-h-11 rounded-lg bg-[#412551] px-4 font-semibold text-white disabled:opacity-60">{salvando ? "Salvando…" : "Salvar marco"}</button><button type="button" onClick={() => setAberto(false)} className="min-h-11 rounded-lg border px-4 font-semibold">Cancelar</button></div>
      </form>}
      {itens.length ? <ul className="divide-y divide-slate-200">{itens.map((item) => <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3">{item.imageUrl && <Image src={item.imageUrl} alt="" width={64} height={64} unoptimized className="size-16 rounded-md object-cover" />}<div className="min-w-0"><h2 className="font-semibold">{item.ano}</h2><p className="line-clamp-2 text-sm text-slate-600">{item.descricao}</p><p className="text-xs uppercase text-slate-500">{item.estado.toLowerCase()} · ordem {item.ordem}</p></div></div><div className="flex gap-2"><button type="button" onClick={() => iniciarEdicao(item)} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Editar</button>{item.estado !== "ARQUIVADO" && <button type="button" onClick={() => void arquivar(item)} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700">Arquivar</button>}</div></li>)}</ul> : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Nenhum marco histórico cadastrado.</p>}
    </div>
  </section>;
}
