"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type Midia = { id: string; url: string; mime: string; bytes: number; nomeOriginal: string | null };
type Foto = { id?: string; midiaId: string; url?: string; textoAlternativo: string; legenda: string; credito: string | null; dataEditorial: string | null; ordem?: number };
type Pagina = { introducao: string; tituloTrajetoria: string; fundo: { midiaId: string | null; origem: string | null; url: string | null; alt: string } };
type Resposta = { pagina: Pagina; fotos: Foto[]; midias: Midia[] };

const campo = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";

function moverItem<T>(lista: T[], indice: number, deslocamento: -1 | 1): T[] {
  const destino = indice + deslocamento;
  if (destino < 0 || destino >= lista.length) return lista;
  const nova = [...lista]; [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
  return nova;
}

async function enviarMidia(arquivo: File): Promise<Midia> {
  const formData = new FormData(); formData.append("file", arquivo);
  const otimizada = await fetch("/api/upload", { method: "POST", body: formData });
  if (!otimizada.ok) throw new Error("A imagem foi recusada. Use JPEG, PNG ou WebP de até 5 MiB.");
  const dados = await otimizada.json() as { imageData: string; imagemTipo: string };
  const resposta = await fetch("/api/admin/midias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dados, nomeOriginal: arquivo.name }) });
  if (!resposta.ok) throw new Error("Não foi possível salvar a imagem no Storage.");
  return await resposta.json() as Midia;
}

export default function PaginaProjetos() {
  const [dados, setDados] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true); setErro("");
    try {
      const resposta = await fetch("/api/admin/projetos-pagina", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar a página de projetos.");
      setDados(await resposta.json() as Resposta);
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível carregar os projetos."); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => { void carregar(); }, [carregar]);

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>, aoSalvar: (midia: Midia) => void) {
    const arquivo = event.target.files?.[0]; event.target.value = "";
    if (!arquivo || !dados) return;
    setEnviandoImagem(true); setErro("");
    try {
      const midia = await enviarMidia(arquivo);
      setDados((atual) => atual ? { ...atual, midias: [midia, ...atual.midias.filter((item) => item.id !== midia.id)] } : atual);
      aoSalvar(midia);
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível enviar a imagem."); }
    finally { setEnviandoImagem(false); }
  }

  function atualizarFoto(index: number, patch: Partial<Foto>) {
    setDados((atual) => atual ? { ...atual, fotos: atual.fotos.map((foto, i) => i === index ? { ...foto, ...patch } : foto) } : atual);
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!dados) return;
    setSalvando(true); setErro(""); setAviso("");
    try {
      const resposta = await fetch("/api/admin/projetos-pagina", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pagina: dados.pagina, fotos: dados.fotos }) });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar a página de projetos.");
      }
      setAviso("Página e galeria de projetos salvas."); await carregar();
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível salvar a página de projetos."); }
    finally { setSalvando(false); }
  }

  if (carregando) return <section className="rounded-xl border border-slate-300 bg-white p-6">Carregando página de projetos…</section>;
  if (!dados) return <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-6"><p role="alert">{erro || "Página de projetos indisponível."}</p><button type="button" onClick={() => void carregar()} className="min-h-10 rounded-lg border px-3">Tentar novamente</button></section>;

  return <section className="space-y-4"><div><h1 className="text-2xl font-bold text-slate-900">Página de projetos</h1><p className="mt-1 text-sm text-slate-600">Edite a apresentação e a galeria visual da página.</p></div>
    <form onSubmit={(event) => void salvar(event)} className="space-y-5 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}{aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Introdução<textarea required maxLength={10000} rows={6} value={dados.pagina.introducao} onChange={(event) => setDados({ ...dados, pagina: { ...dados.pagina, introducao: event.target.value } })} className={`${campo} min-h-32`} /></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título da trajetória<input required maxLength={200} value={dados.pagina.tituloTrajetoria} onChange={(event) => setDados({ ...dados, pagina: { ...dados.pagina, tituloTrajetoria: event.target.value } })} className={campo} /></label>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Imagem de fundo<select value={dados.pagina.fundo.midiaId ?? ""} onChange={(event) => { const midia = dados.midias.find((item) => item.id === event.target.value); setDados({ ...dados, pagina: { ...dados.pagina, fundo: { ...dados.pagina.fundo, midiaId: midia?.id ?? null, origem: midia ? null : null, url: midia?.url ?? null } } }); }} className={campo}><option value="">Usar imagem padrão</option>{dados.midias.map((midia) => <option key={midia.id} value={midia.id}>{midia.nomeOriginal || midia.id.slice(0, 12)}</option>)}</select></label>
        {dados.pagina.fundo.midiaId && <Image src={dados.pagina.fundo.url ?? "/padrao2.webp"} alt="Prévia do fundo" width={180} height={120} unoptimized className="h-28 w-44 rounded-md object-cover" />}
        <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551]">{enviandoImagem ? "Enviando imagem…" : "Enviar imagem de fundo"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event, (midia) => setDados((atual) => atual ? { ...atual, pagina: { ...atual.pagina, fundo: { ...atual.pagina.fundo, midiaId: midia.id, origem: null, url: midia.url } } } : atual))} className="sr-only" /></label>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Galeria</h2><p className="text-sm text-slate-600">A galeria usa arquivos do Storage; remover uma foto só remove seu vínculo.</p></div><button type="button" onClick={() => setDados({ ...dados, fotos: [...dados.fotos, { midiaId: "", textoAlternativo: "", legenda: "", credito: null, dataEditorial: null }] })} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Adicionar foto</button></div>
        {dados.fotos.map((foto, index) => <article key={foto.id ?? `nova-${index}`} className="grid gap-4 rounded-lg border border-slate-200 p-3 lg:grid-cols-[12rem_minmax(0,1fr)]"><div className="space-y-2"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Imagem<select required value={foto.midiaId} onChange={(event) => { const midia = dados.midias.find((item) => item.id === event.target.value); atualizarFoto(index, { midiaId: midia?.id ?? "", url: midia?.url }); }} className={campo}><option value="">Selecione imagem</option>{dados.midias.map((midia) => <option key={midia.id} value={midia.id}>{midia.nomeOriginal || midia.id.slice(0, 12)}</option>)}</select></label>
          {foto.url && <Image src={foto.url} alt={foto.textoAlternativo} width={180} height={140} unoptimized className="h-32 w-full rounded-md object-cover" />}
          <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold">Enviar nova imagem<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event, (midia) => atualizarFoto(index, { midiaId: midia.id, url: midia.url }))} className="sr-only" /></label>
        </div><div className="space-y-3"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Texto alternativo<input maxLength={300} value={foto.textoAlternativo} onChange={(event) => atualizarFoto(index, { textoAlternativo: event.target.value })} className={campo} /></label><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Legenda<input maxLength={2000} value={foto.legenda} onChange={(event) => atualizarFoto(index, { legenda: event.target.value })} className={campo} /></label><div className="grid gap-3 md:grid-cols-2"><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Crédito<input maxLength={300} value={foto.credito ?? ""} onChange={(event) => atualizarFoto(index, { credito: event.target.value || null })} className={campo} /></label><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Data editorial<input maxLength={50} value={foto.dataEditorial ?? ""} onChange={(event) => atualizarFoto(index, { dataEditorial: event.target.value || null })} className={campo} /></label></div><div className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => setDados({ ...dados, fotos: moverItem(dados.fotos, index, -1) })} className="min-h-10 rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={`Mover foto ${index + 1} para cima`}>↑</button><button type="button" disabled={index === dados.fotos.length - 1} onClick={() => setDados({ ...dados, fotos: moverItem(dados.fotos, index, 1) })} className="min-h-10 rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={`Mover foto ${index + 1} para baixo`}>↓</button><button type="button" onClick={() => setDados({ ...dados, fotos: dados.fotos.filter((_, i) => i !== index) })} className="min-h-10 px-2 text-sm font-semibold text-red-700">Remover vínculo da foto</button></div></div></article>)}
        {dados.fotos.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Nenhuma imagem na galeria.</p>}
      </div>
      <div className="flex justify-end border-t border-slate-200 pt-4"><button type="submit" disabled={salvando || enviandoImagem} className="min-h-11 rounded-lg bg-[#412551] px-5 font-semibold text-white hover:bg-[#563765] disabled:opacity-60">{salvando ? "Salvando…" : "Salvar página de projetos"}</button></div>
    </form>
  </section>;
}
