"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import CabecalhoSecao from "./CabecalhoSecao";
import EstadoLista from "./EstadoLista";
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

function CampoTexto({ label, value, onChange, multiline = false, required = false, type = "text", maxLength }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; required?: boolean; type?: string; maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      {multiline ? (
        <textarea required={required} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} rows={5} className={`${classeCampo()} min-h-28`} />
      ) : (
        <input required={required} type={type} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} className={classeCampo()} />
      )}
    </label>
  );
}

function SeletorMidia({ midias, value, onChange, onUpload, enviando, label }: {
  midias: Midia[]; value: string; onChange: (id: string | null) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void; enviando: boolean; label: string;
}) {
  const selecionada = midias.find((midia) => midia.id === value);
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
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
          <span className="text-xs text-slate-600">{selecionada.mime} · {Math.ceil(selecionada.bytes / 1024)} KB</span>
        </div>
      )}
      <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551] hover:bg-slate-100">
        {enviando ? "Enviando imagem…" : "Enviar nova imagem"}
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviando} onChange={onUpload} className="sr-only" />
      </label>
      <p className="text-xs text-slate-500">A imagem será otimizada e enviada ao Storage. Limite: 5 MiB.</p>
    </div>
  );
}

export default function ConteudoEditorial({ tipo }: { tipo: TipoEditorial }) {
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
  const [aviso, setAviso] = useState("");
  const config = TITULOS[tipo];

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [respostaItems, respostaMidias] = await Promise.all([
        fetch(ROTAS[tipo], { credentials: "include" }),
        fetch("/api/admin/midias", { credentials: "include" }),
      ]);
      if (!respostaItems.ok || !respostaMidias.ok) throw new Error("Não foi possível carregar o conteúdo e as mídias.");
      setItems(await respostaItems.json() as Registro[]);
      setMidias(await respostaMidias.json() as Midia[]);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar o conteúdo.");
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => { void carregar(); }, [carregar]);

  const registrosOrdenados = useMemo(() => [...items].sort((a, b) => a.ordem - b.ordem || tituloDo(a, tipo).localeCompare(tituloDo(b, tipo), "pt-BR")), [items, tipo]);

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

  async function arquivar(item: Registro) {
    if (!window.confirm(`Arquivar “${tituloDo(item, tipo)}”? O conteúdo deixa de aparecer publicamente e pode ser restaurado depois.`)) return;
    setErro("");
    try {
      const resposta = await fetch(`${ROTAS[tipo]}?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (!resposta.ok) throw new Error("Não foi possível arquivar o conteúdo.");
      setAviso("Conteúdo arquivado.");
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível arquivar o conteúdo.");
    }
  }

  function seletorMidia(campo: string, label: string) {
    const valor = valorTexto(formulario, campo);
    return (
      <SeletorMidia
        midias={midias}
        value={valor}
        onChange={(id) => alterar(campo, id)}
        onUpload={(event) => void enviarImagem(event, (id) => alterar(campo, id))}
        enviando={enviandoImagem}
        label={label}
      />
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="admin-secao-titulo">
      <CabecalhoSecao titulo={config.titulo} descricao={config.descricao} acao={config.novo} aberto={aberto} aoAlternar={() => aberto ? setAberto(false) : iniciarNovo()} />
      <div className="space-y-4 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
        {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
        {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

        {aberto && (
          <form onSubmit={salvar} className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-900">{selecionado ? "Editar conteúdo" : config.novo}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {tipo === "integrantes" && (
                <>
                  <CampoTexto label="Nome" required value={valorTexto(formulario, "nome")} onChange={(value) => alterar("nome", value)} maxLength={200} />
                  <CampoTexto label="Identificador da página" required value={valorTexto(formulario, "slug")} onChange={(value) => alterar("slug", slugify(value))} maxLength={120} />
                  <div className="md:col-span-2">{seletorMidia("fotoId", "Foto do perfil")}</div>
                  <div className="md:col-span-2"><CampoTexto label="Ficha técnica" required multiline value={valorTexto(formulario, "fichaTecnica")} onChange={(value) => alterar("fichaTecnica", value)} maxLength={5000} /></div>
                  <div className="md:col-span-2"><CampoTexto label="Biografia" required multiline value={valorTexto(formulario, "biografia")} onChange={(value) => alterar("biografia", value)} maxLength={20000} /></div>
                </>
              )}
              {tipo === "premios" && (
                <>
                  <CampoTexto label="Título" required value={valorTexto(formulario, "titulo")} onChange={(value) => alterar("titulo", value)} maxLength={300} />
                  <CampoTexto label="Identificador da página" required value={valorTexto(formulario, "slug")} onChange={(value) => alterar("slug", slugify(value))} maxLength={120} />
                  <CampoTexto label="Ano" required value={valorTexto(formulario, "ano")} onChange={(value) => alterar("ano", value)} maxLength={4} />
                  <CampoTexto label="Evento" required value={valorTexto(formulario, "evento")} onChange={(value) => alterar("evento", value)} maxLength={300} />
                  <div className="md:col-span-2">{seletorMidia("fotoId", "Imagem do prêmio")}</div>
                  <div className="md:col-span-2"><CampoTexto label="Descrição" required multiline value={valorTexto(formulario, "descricao")} onChange={(value) => alterar("descricao", value)} maxLength={20000} /></div>
                </>
              )}
              {tipo === "espetaculos" && (
                <>
                  <CampoTexto label="Título" required value={valorTexto(formulario, "titulo")} onChange={(value) => alterar("titulo", value)} maxLength={300} />
                  <CampoTexto label="Identificador da página" required value={valorTexto(formulario, "slug")} onChange={(value) => alterar("slug", slugify(value))} maxLength={120} />
                  <CampoTexto label="Ano de lançamento" required value={valorTexto(formulario, "lancamento")} onChange={(value) => alterar("lancamento", value)} maxLength={30} />
                  <CampoTexto label="Data de estreia (opcional)" value={valorTexto(formulario, "estreia")} onChange={(value) => alterar("estreia", value)} maxLength={50} />
                  <CampoTexto label="Local de estreia" value={valorTexto(formulario, "localEstreia")} onChange={(value) => alterar("localEstreia", value)} maxLength={500} />
                  <CampoTexto label="Cor de fundo (hexadecimal)" value={valorTexto(formulario, "corFundo")} onChange={(value) => alterar("corFundo", value)} maxLength={7} />
                  <div className="md:col-span-2">{seletorMidia("capaId", "Capa do espetáculo")}</div>
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-800">Seções da página</h3>
                      <button type="button" onClick={() => setSecoes((atuais) => [...atuais, { titulo: "", texto: "" }])} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">Adicionar seção</button>
                    </div>
                    {secoes.map((secao, index) => (
                      <div key={`secao-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3">
                        <CampoTexto label={`Título da seção ${index + 1}`} required value={secao.titulo} onChange={(titulo) => setSecoes((atuais) => atuais.map((item, i) => i === index ? { ...item, titulo } : item))} maxLength={200} />
                        <CampoTexto label="Texto" required multiline value={secao.texto} onChange={(texto) => setSecoes((atuais) => atuais.map((item, i) => i === index ? { ...item, texto } : item))} maxLength={20000} />
                        <button type="button" onClick={() => setSecoes((atuais) => atuais.filter((_, i) => i !== index))} className="min-h-9 justify-self-start px-2 text-sm font-semibold text-red-700">Remover seção</button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-800">Galeria</h3>
                      <button type="button" onClick={() => setFotos((atuais) => [...atuais, { midiaId: "", textoAlternativo: "", legenda: "", credito: null, dataEditorial: null }])} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">Adicionar foto</button>
                    </div>
                    {fotos.map((foto, index) => (
                      <div key={`foto-${index}`} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                        <SeletorMidia
                          midias={midias}
                          value={foto.midiaId}
                          onChange={(midiaId) => atualizarFoto(index, { midiaId: midiaId ?? "" })}
                          onUpload={(event) => void enviarImagem(event, (midiaId) => atualizarFoto(index, { midiaId: midiaId ?? "" }))}
                          enviando={enviandoImagem}
                          label={`Foto ${index + 1}`}
                        />
                        <CampoTexto label="Texto alternativo" value={foto.textoAlternativo} onChange={(textoAlternativo) => atualizarFoto(index, { textoAlternativo })} maxLength={300} />
                        <CampoTexto label="Legenda" value={foto.legenda} onChange={(legenda) => atualizarFoto(index, { legenda })} maxLength={2000} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <CampoTexto label="Crédito" value={foto.credito ?? ""} onChange={(credito) => atualizarFoto(index, { credito: credito || null })} maxLength={300} />
                          <CampoTexto label="Data editorial" value={foto.dataEditorial ?? ""} onChange={(dataEditorial) => atualizarFoto(index, { dataEditorial: dataEditorial || null })} maxLength={50} />
                        </div>
                        <button type="button" onClick={() => setFotos((atuais) => atuais.filter((_, i) => i !== index))} className="min-h-9 px-2 text-sm font-semibold text-red-700">Remover foto</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <CampoTexto label="Ordem" type="number" value={valorTexto(formulario, "ordem")} onChange={(value) => alterar("ordem", Number(value))} />
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Publicação
                <select value={valorTexto(formulario, "estado")} onChange={(event) => alterar("estado", event.target.value)} className={classeCampo()}>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="PUBLICADO">Publicado</option>
                  <option value="ARQUIVADO">Arquivado</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={salvando || enviandoImagem} className="min-h-11 rounded-lg bg-[#412551] px-4 font-semibold text-white hover:bg-[#563765] disabled:opacity-60">{salvando ? "Salvando…" : "Salvar"}</button>
              <button type="button" onClick={() => setAberto(false)} disabled={salvando} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700">Cancelar</button>
            </div>
          </form>
        )}

        {carregando ? <EstadoLista carregando buscando={false} mensagemVazia="" /> : registrosOrdenados.length === 0 ? (
          <EstadoLista carregando={false} buscando={false} mensagemVazia="Nenhum conteúdo cadastrado." textoAcao={config.novo} aoCriar={iniciarNovo} />
        ) : (
          <ul className="divide-y divide-slate-200">
            {registrosOrdenados.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {(item.fotoUrl || item.capaUrl) && <Image src={item.fotoUrl || item.capaUrl || "/padrao2.webp"} alt="" width={56} height={56} unoptimized className="size-14 rounded-md object-cover" />}
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{tituloDo(item, tipo)}</h2>
                    <p className="text-sm text-slate-600">/{tipo === "integrantes" ? "coletivo/integrante" : tipo}/{item.slug}{tipo === "premios" ? `/${item.ano}` : ""} · ordem {item.ordem} · {item.estado.toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => iniciarEdicao(item)} className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-[#412551]">Editar</button>
                  {item.estado !== "ARQUIVADO" && <button type="button" onClick={() => void arquivar(item)} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700">Arquivar</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
