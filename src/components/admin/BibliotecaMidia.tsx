"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type Referencia = {
  chave: string;
  area: string;
  registro: string;
  campo: string;
  textoAlternativo: string | null;
  legenda: string | null;
  credito: string | null;
};

type Midia = {
  id: string;
  url: string;
  mime: string;
  bytes: number;
  largura: number | null;
  altura: number | null;
  nomeOriginal: string | null;
  criadoEm: string;
  usos: Referencia[];
  quantidadeUsos: number;
  semVinculosDetectados: boolean;
};

type Filtro = "todas" | "vinculadas" | "sem-vinculo";

const CAMPO = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";
const NOMES_AREAS: Record<string, string> = {
  agenda: "Agenda",
  configuracoes: "Configurações do site",
  editorialTransversal: "Publicação e SEO",
  integrantes: "Integrantes",
  espetaculos: "Espetáculos",
  premios: "Prêmios",
  noticias: "Notícias",
  livros: "Indicações",
  projetos: "Projetos",
  sobre: "História",
  paginaProjetos: "Página de projetos",
};

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function abrirArea(area: string) {
  window.dispatchEvent(new CustomEvent("amargem:admin-area", { detail: area }));
}

export default function BibliotecaMidia() {
  const [midias, setMidias] = useState<Midia[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/admin/midias", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar a biblioteca de mídia.");
      setMidias(await resposta.json() as Midia[]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as mídias.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return midias.filter((midia) => {
      if (filtro === "vinculadas" && midia.semVinculosDetectados) return false;
      if (filtro === "sem-vinculo" && !midia.semVinculosDetectados) return false;
      if (!termo) return true;
      const texto = [midia.nomeOriginal, midia.id, ...midia.usos.flatMap((uso) => [uso.registro, uso.campo, uso.textoAlternativo, uso.legenda, uso.credito])]
        .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return texto.includes(termo);
    });
  }, [busca, filtro, midias]);

  return (
    <section className="mx-auto max-w-6xl space-y-5" aria-labelledby="biblioteca-midia-titulo">
      <header className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 id="biblioteca-midia-titulo" className="text-2xl font-bold text-slate-900">Biblioteca de mídia</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Consulte imagens do Storage, prévias e os conteúdos que usam cada arquivo. A troca ou remoção do vínculo é feita no editor do conteúdo correspondente.</p>
          </div>
          <button type="button" onClick={() => void carregar()} disabled={carregando} className="min-h-11 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] disabled:opacity-60">{carregando ? "Atualizando…" : "Atualizar lista"}</button>
        </div>
        <p className="mt-4 text-sm text-slate-600">{midias.length} {midias.length === 1 ? "arquivo" : "arquivos"} no catálogo · {midias.filter((midia) => midia.semVinculosDetectados).length} sem vínculo detectado</p>
      </header>

      {erro && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{erro}</p>}

      <div className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Buscar mídia ou referência
          <input className={CAMPO} type="search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome do arquivo, página ou texto alternativo" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Exibir
          <select className={CAMPO} value={filtro} onChange={(event) => setFiltro(event.target.value as Filtro)}>
            <option value="todas">Todas as mídias</option>
            <option value="vinculadas">Com vínculo</option>
            <option value="sem-vinculo">Sem vínculo detectado</option>
          </select>
        </label>
      </div>

      {carregando ? <p role="status" className="rounded-xl bg-white p-5 text-slate-600">Carregando biblioteca…</p> : visiveis.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-slate-600">Nenhuma mídia corresponde a este filtro.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visiveis.map((midia) => <li key={midia.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[144px_minmax(0,1fr)] sm:p-5">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                <Image src={midia.url} alt={midia.nomeOriginal ? `Prévia: ${midia.nomeOriginal}` : "Prévia da mídia"} fill unoptimized sizes="144px" className="object-contain" />
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="break-words font-semibold text-slate-900">{midia.nomeOriginal || "Arquivo sem nome"}</h2>
                <p className="text-sm text-slate-600">{midia.mime} · {formatarTamanho(midia.bytes)}</p>
                {midia.largura && midia.altura && <p className="text-sm text-slate-600">{midia.largura} × {midia.altura} px</p>}
                <p className="break-all font-mono text-xs text-slate-500">ID {midia.id}</p>
                <p className="text-xs text-slate-500">Adicionada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(midia.criadoEm))}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
              {midia.semVinculosDetectados ? <div className="space-y-2">
                <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Sem vínculo detectado</p>
                <p className="text-sm leading-5 text-slate-600">Candidata a órfã. O arquivo permanece no Storage; confirme referências e retenção antes de qualquer limpeza.</p>
              </div> : <>
                <h3 className="text-sm font-semibold text-slate-800">Usada em {midia.quantidadeUsos} {midia.quantidadeUsos === 1 ? "lugar" : "lugares"}</h3>
                <ul className="mt-2 space-y-2">
                  {midia.usos.map((uso) => <li key={uso.chave} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-slate-800">{NOMES_AREAS[uso.area] ?? uso.area} · {uso.registro}</p>
                      <p className="text-xs text-slate-600">{uso.campo}{uso.textoAlternativo ? ` · alt: ${uso.textoAlternativo}` : ""}{uso.legenda ? ` · ${uso.legenda}` : ""}{uso.credito ? ` · crédito: ${uso.credito}` : ""}</p>
                    </div>
                    <button type="button" onClick={() => abrirArea(uso.area)} className="min-h-10 shrink-0 self-start rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-[#412551] sm:self-auto">Abrir editor</button>
                  </li>)}
                </ul>
              </>}
            </div>
          </li>)}
        </ul>
      )}
    </section>
  );
}
