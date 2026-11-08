"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";

type Selecao = { midiaId: string | null; origem: string | null; url: string | null; alt: string };
type Midia = { id: string; url: string; mime: string; bytes: number; nomeOriginal: string | null };
type Canal = { id: string; chaveOrigem: string; tipo: string; rotulo: string; url: string; ordem: number; ativo: boolean };
type ItemMenu = { id: string; chaveOrigem: string; rotulo: string; destino: string; ordem: number; ativo: boolean };
type Identidade = {
  nomePublico: string; dominio: string; destinoLogo: string; tituloPadrao: string; descricaoPadrao: string; palavrasChave: string[];
  autor: string; logo: Selecao; favicon: Selecao; imagemSocial: Selecao; textoCopyright: string; textoDireitos: string;
};
type Home = {
  secoes: { chave: string; titulo: string; ativa: boolean; ordem: number }[];
  agenda: { titulo: string; rotuloAcao: string; destinoAcao: string; acaoVisivel: boolean; maxCidades: number; maxEventosPorCidade: number; idsSelecionados: number[]; exibirHorario: boolean; fundo: Selecao };
  intervaloSlidesMs: number; opacidadeOverlay: number; slides: Selecao[]; logoHero: Selecao;
  sobre: { titulo: string; texto: string; fundo: Selecao; galeria: Selecao[]; acaoPrincipal: { rotulo: string; destino: string; visivel: boolean }; acaoSecundaria: { rotulo: string; destino: string; visivel: boolean } };
  tituloContato: string; fundoContato: Selecao;
};
type PaginaContato = { titulo: string; fundo: Selecao; logo: Selecao };
type PaginaProjetos = { introducao: string; tituloTrajetoria: string; fundo: Selecao };
type EventoAgenda = { id: number; titulo: string; data: string; cidade: string; local: string };
type DadosConfiguracao = { identidade: Identidade; home: Home; contatoPagina: PaginaContato; projetosPagina: PaginaProjetos; contatos: Canal[]; navegacao: ItemMenu[]; midias: Midia[]; agendaDisponivel: EventoAgenda[] };

const campo = "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20";
const classeLabel = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

function moverItem<T>(lista: T[], indice: number, deslocamento: -1 | 1): T[] {
  const destino = indice + deslocamento;
  if (destino < 0 || destino >= lista.length) return lista;
  const nova = [...lista];
  [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
  return nova;
}

function Campo({ label, value, onChange, multiline = false, type = "text", maxLength }: { label: string; value: string | number; onChange: (value: string) => void; multiline?: boolean; type?: string; maxLength?: number }) {
  return <label className={classeLabel}>{label}{multiline ? <textarea className={`${campo} min-h-28`} rows={4} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} /> : <input className={campo} type={type} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function SeletorMidia({ label, value, midias, onChange }: { label: string; value: Selecao; midias: Midia[]; onChange: (value: Selecao) => void }) {
  const selecionada = midias.find((midia) => midia.id === value.midiaId);
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className={classeLabel}>{label}
        <select className={campo} value={value.midiaId ?? ""} onChange={(event) => {
          const midia = midias.find((item) => item.id === event.target.value);
          onChange({ ...value, midiaId: midia?.id ?? null, origem: midia ? null : null, url: midia?.url ?? null });
        }}>
          <option value="">Usar caminho padrão ou sem mídia vinculada</option>
          {midias.map((midia) => <option key={midia.id} value={midia.id}>{midia.nomeOriginal || midia.id.slice(0, 12)} · {Math.ceil(midia.bytes / 1024)} KB</option>)}
        </select>
      </label>
      {selecionada && <div className="flex items-center gap-3"><Image src={selecionada.url} alt="Prévia" width={72} height={72} unoptimized className="size-18 rounded-md object-cover" /><span className="text-xs text-slate-600">{selecionada.mime} · {Math.ceil(selecionada.bytes / 1024)} KB</span></div>}
      <label className={classeLabel}>Texto alternativo<input className={campo} maxLength={300} value={value.alt} onChange={(event) => onChange({ ...value, alt: event.target.value })} /></label>
    </div>
  );
}

async function enviarMidia(arquivo: File): Promise<Midia> {
  const formData = new FormData();
  formData.append("file", arquivo);
  const otimizada = await fetch("/api/upload", { method: "POST", body: formData });
  if (!otimizada.ok) throw new Error("A imagem foi recusada. Use JPEG, PNG ou WebP de até 5 MiB.");
  const dados = await otimizada.json() as { imageData: string; imagemTipo: string };
  const resposta = await fetch("/api/admin/midias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...dados, nomeOriginal: arquivo.name }) });
  if (!resposta.ok) throw new Error("Não foi possível salvar a imagem no Storage.");
  return await resposta.json() as Midia;
}

export default function Configuracoes() {
  const [dados, setDados] = useState<DadosConfiguracao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/admin/configuracoes", { credentials: "include" });
      if (!resposta.ok) throw new Error("Não foi possível carregar as configurações do site.");
      setDados(await resposta.json() as DadosConfiguracao);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as configurações.");
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  function atualizarIdentidade<K extends keyof Identidade>(chave: K, value: Identidade[K]) {
    setDados((atual) => atual ? { ...atual, identidade: { ...atual.identidade, [chave]: value } } : atual);
  }
  function atualizarHome(updates: Partial<Home>) {
    setDados((atual) => atual ? { ...atual, home: { ...atual.home, ...updates } } : atual);
  }
  function atualizarSobre(updates: Partial<Home["sobre"]>) {
    setDados((atual) => atual ? { ...atual, home: { ...atual.home, sobre: { ...atual.home.sobre, ...updates } } } : atual);
  }
  function atualizarPaginaContato(updates: Partial<PaginaContato>) {
    setDados((atual) => atual ? { ...atual, contatoPagina: { ...atual.contatoPagina, ...updates } } : atual);
  }
  function atualizarSelecao(atual: Selecao, value: Selecao, setter: (value: Selecao) => void) { setter({ ...atual, ...value }); }

  async function selecionarArquivo(event: ChangeEvent<HTMLInputElement>, aoSalvar: (midia: Midia) => void) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo || !dados) return;
    setEnviandoImagem(true); setErro("");
    try {
      const midia = await enviarMidia(arquivo);
      setDados((atual) => atual ? { ...atual, midias: [midia, ...atual.midias.filter((item) => item.id !== midia.id)] } : atual);
      aoSalvar(midia);
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível enviar a imagem."); }
    finally { setEnviandoImagem(false); }
  }

  function seletor(label: string, value: Selecao, salvar: (value: Selecao) => void) {
    return <div className="space-y-2"><SeletorMidia label={label} value={value} midias={dados?.midias ?? []} onChange={(next) => atualizarSelecao(value, next, salvar)} /><label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#412551]">{enviandoImagem ? "Enviando imagem…" : "Enviar nova imagem"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event, (midia) => salvar({ ...value, midiaId: midia.id, origem: null, url: midia.url }))} className="sr-only" /></label></div>;
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dados) return;
    setSalvando(true); setErro(""); setAviso("");
    try {
      const resposta = await fetch("/api/admin/configuracoes", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
      if (!resposta.ok) {
        const payload = await resposta.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível salvar as configurações.");
      }
      setAviso("Configurações salvas.");
      await carregar();
    } catch (error) { setErro(error instanceof Error ? error.message : "Não foi possível salvar as configurações."); }
    finally { setSalvando(false); }
  }

  if (carregando) return <section className="rounded-xl border border-slate-300 bg-white p-6">Carregando configurações…</section>;
  if (!dados) return <section className="space-y-4 rounded-xl border border-slate-300 bg-white p-6"><p role="alert">{erro || "Configurações indisponíveis."}</p><button type="button" onClick={() => void carregar()} className="min-h-10 rounded-lg border px-3">Tentar novamente</button></section>;

  return (
    <section className="space-y-4" aria-labelledby="admin-secao-titulo">
      <div><h1 id="admin-secao-titulo" className="text-2xl font-bold text-slate-900">Configurações do site</h1><p className="mt-1 text-sm text-slate-600">Edite identidade, home, contatos e navegação pública.</p></div>
      <form onSubmit={(event) => void salvar(event)} className="space-y-6 rounded-xl border border-slate-300 bg-white p-4 sm:p-6">
        {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>}
        {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}

        <section className="space-y-4 border-b border-slate-200 pb-6"><h2 className="text-lg font-semibold">Identidade e SEO</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo label="Nome público" value={dados.identidade.nomePublico} onChange={(value) => atualizarIdentidade("nomePublico", value)} maxLength={200} />
            <Campo label="Domínio canônico" value={dados.identidade.dominio} onChange={(value) => atualizarIdentidade("dominio", value)} maxLength={300} />
            <Campo label="Destino do logo" value={dados.identidade.destinoLogo} onChange={(value) => atualizarIdentidade("destinoLogo", value)} maxLength={300} />
            <Campo label="Título padrão" value={dados.identidade.tituloPadrao} onChange={(value) => atualizarIdentidade("tituloPadrao", value)} maxLength={300} />
            <Campo label="Autor" value={dados.identidade.autor} onChange={(value) => atualizarIdentidade("autor", value)} maxLength={200} />
            <div className="md:col-span-2"><Campo label="Descrição padrão" value={dados.identidade.descricaoPadrao} onChange={(value) => atualizarIdentidade("descricaoPadrao", value)} multiline maxLength={1000} /></div>
            <Campo label="Palavras-chave (separadas por vírgula)" value={dados.identidade.palavrasChave.join(", ")} onChange={(value) => atualizarIdentidade("palavrasChave", value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30))} />
            <Campo label="Texto de copyright" value={dados.identidade.textoCopyright} onChange={(value) => atualizarIdentidade("textoCopyright", value)} maxLength={300} />
            <Campo label="Texto de direitos" value={dados.identidade.textoDireitos} onChange={(value) => atualizarIdentidade("textoDireitos", value)} maxLength={300} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {seletor("Logo do cabeçalho", dados.identidade.logo, (value) => atualizarIdentidade("logo", value))}
            {seletor("Favicon", dados.identidade.favicon, (value) => atualizarIdentidade("favicon", value))}
            {seletor("Imagem social / Open Graph", dados.identidade.imagemSocial, (value) => atualizarIdentidade("imagemSocial", value))}
          </div>
        </section>

        <section className="space-y-4 border-b border-slate-200 pb-6"><h2 className="text-lg font-semibold">Composição da home</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {dados.home.secoes.map((secao, index) => <div key={secao.chave} className="grid grid-cols-[1fr_8rem] items-end gap-3 rounded-lg border border-slate-200 p-3"><label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={secao.ativa} onChange={(event) => atualizarHome({ secoes: dados.home.secoes.map((item, i) => i === index ? { ...item, ativa: event.target.checked } : item) })} />{secao.titulo}</label><Campo label="Ordem" type="number" value={secao.ordem} onChange={(value) => atualizarHome({ secoes: dados.home.secoes.map((item, i) => i === index ? { ...item, ordem: Number(value) } : item) })} /></div>)}
            <Campo label="Intervalo dos slides (ms)" type="number" value={dados.home.intervaloSlidesMs} onChange={(value) => atualizarHome({ intervaloSlidesMs: Number(value) })} />
            <Campo label="Opacidade do overlay (0 a 0,9)" type="number" value={dados.home.opacidadeOverlay} onChange={(value) => atualizarHome({ opacidadeOverlay: Number(value) })} />
          </div>
          <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4"><legend className="px-1 font-semibold">Destaques da agenda na home</legend>
            <div className="grid gap-4 md:grid-cols-2"><Campo label="Título" value={dados.home.agenda.titulo} onChange={(value) => atualizarHome({ agenda: { ...dados.home.agenda, titulo: value } })} maxLength={200} /><Campo label="Rótulo do botão" value={dados.home.agenda.rotuloAcao} onChange={(value) => atualizarHome({ agenda: { ...dados.home.agenda, rotuloAcao: value } })} maxLength={100} /><Campo label="Destino interno" value={dados.home.agenda.destinoAcao} onChange={(value) => atualizarHome({ agenda: { ...dados.home.agenda, destinoAcao: value } })} maxLength={300} /><Campo label="Máximo de cidades" type="number" value={dados.home.agenda.maxCidades} onChange={(value) => atualizarHome({ agenda: { ...dados.home.agenda, maxCidades: Number(value) } })} /><Campo label="Eventos por cidade" type="number" value={dados.home.agenda.maxEventosPorCidade} onChange={(value) => atualizarHome({ agenda: { ...dados.home.agenda, maxEventosPorCidade: Number(value) } })} /><div className="flex flex-wrap items-end gap-5 pb-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.home.agenda.acaoVisivel} onChange={(event) => atualizarHome({ agenda: { ...dados.home.agenda, acaoVisivel: event.target.checked } })} />Mostrar botão</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.home.agenda.exibirHorario} onChange={(event) => atualizarHome({ agenda: { ...dados.home.agenda, exibirHorario: event.target.checked } })} />Mostrar horário</label></div></div>
            {seletor("Imagem de fundo da agenda", dados.home.agenda.fundo, (value) => atualizarHome({ agenda: { ...dados.home.agenda, fundo: value } }))}
            <div className="space-y-2"><h3 className="text-sm font-semibold">Eventos em destaque</h3><p className="text-xs text-slate-600">Sem seleção manual, o site escolhe eventos futuros automaticamente por cidade. A seleção manual respeita a ordem cronológica.</p>{dados.agendaDisponivel.length ? <div className="grid gap-2 md:grid-cols-2">{dados.agendaDisponivel.map((evento) => <label key={evento.id} className="flex gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" checked={dados.home.agenda.idsSelecionados.includes(evento.id)} onChange={(change) => atualizarHome({ agenda: { ...dados.home.agenda, idsSelecionados: change.target.checked ? [...dados.home.agenda.idsSelecionados, evento.id] : dados.home.agenda.idsSelecionados.filter((id) => id !== evento.id) } })} /><span><strong>{evento.titulo}</strong><span className="block text-xs text-slate-600">{evento.cidade} · {new Date(evento.data).toLocaleDateString("pt-BR")}</span></span></label>)}</div> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Ainda não há eventos cadastrados na agenda.</p>}</div>
          </fieldset>
          <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Slides do destaque</h3><button type="button" onClick={() => atualizarHome({ slides: [...dados.home.slides, { midiaId: null, origem: null, url: null, alt: "" }] })} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Adicionar slide</button></div>
            {dados.home.slides.map((slide, index) => <div key={`slide-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_auto]"><SeletorMidia label={`Slide ${index + 1}`} value={slide} midias={dados.midias} onChange={(value) => atualizarHome({ slides: dados.home.slides.map((item, i) => i === index ? value : item) })} /><div className="flex items-end gap-2"><label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold">Enviar imagem<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event, (midia) => atualizarHome({ slides: dados.home.slides.map((item, i) => i === index ? { ...item, midiaId: midia.id, origem: null, url: midia.url } : item) }))} className="sr-only" /></label><button type="button" disabled={index === 0} onClick={() => atualizarHome({ slides: moverItem(dados.home.slides, index, -1) })} className="min-h-10 rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={`Mover slide ${index + 1} para cima`}>↑</button><button type="button" disabled={index === dados.home.slides.length - 1} onClick={() => atualizarHome({ slides: moverItem(dados.home.slides, index, 1) })} className="min-h-10 rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={`Mover slide ${index + 1} para baixo`}>↓</button><button type="button" disabled={dados.home.slides.length < 2} onClick={() => atualizarHome({ slides: dados.home.slides.filter((_, i) => i !== index) })} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-red-700 disabled:opacity-40">Remover</button></div></div>)}
          </div>
          <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Campo label="Título da seção Sobre" value={dados.home.sobre.titulo} onChange={(value) => atualizarSobre({ titulo: value })} maxLength={200} /><Campo label="Texto da seção Sobre" value={dados.home.sobre.texto} onChange={(value) => atualizarSobre({ texto: value })} multiline maxLength={10000} /></div><div className="space-y-4">{seletor("Logo do destaque", dados.home.logoHero, (value) => atualizarHome({ logoHero: value }))}{seletor("Fundo da seção Sobre", dados.home.sobre.fundo, (value) => atualizarSobre({ fundo: value }))}</div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3"><legend className="px-1 font-semibold">Ação principal</legend><Campo label="Rótulo" value={dados.home.sobre.acaoPrincipal.rotulo} onChange={(value) => atualizarSobre({ acaoPrincipal: { ...dados.home.sobre.acaoPrincipal, rotulo: value } })} maxLength={100} /><Campo label="Destino interno" value={dados.home.sobre.acaoPrincipal.destino} onChange={(value) => atualizarSobre({ acaoPrincipal: { ...dados.home.sobre.acaoPrincipal, destino: value } })} maxLength={300} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.home.sobre.acaoPrincipal.visivel} onChange={(event) => atualizarSobre({ acaoPrincipal: { ...dados.home.sobre.acaoPrincipal, visivel: event.target.checked } })} />Mostrar ação</label></fieldset>
            <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3"><legend className="px-1 font-semibold">Ação secundária</legend><Campo label="Rótulo" value={dados.home.sobre.acaoSecundaria.rotulo} onChange={(value) => atualizarSobre({ acaoSecundaria: { ...dados.home.sobre.acaoSecundaria, rotulo: value } })} maxLength={100} /><Campo label="Destino interno" value={dados.home.sobre.acaoSecundaria.destino} onChange={(value) => atualizarSobre({ acaoSecundaria: { ...dados.home.sobre.acaoSecundaria, destino: value } })} maxLength={300} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dados.home.sobre.acaoSecundaria.visivel} onChange={(event) => atualizarSobre({ acaoSecundaria: { ...dados.home.sobre.acaoSecundaria, visivel: event.target.checked } })} />Mostrar ação</label></fieldset>
          </div>
          <div className="grid gap-4 md:grid-cols-2"><Campo label="Título da seção de contatos" value={dados.home.tituloContato} onChange={(value) => atualizarHome({ tituloContato: value })} maxLength={200} />{seletor("Fundo da seção de contatos", dados.home.fundoContato, (value) => atualizarHome({ fundoContato: value }))}</div>
          <div className="grid gap-3 md:grid-cols-2">{dados.home.sobre.galeria.map((foto, index) => <div key={`sobre-${index}`} className="space-y-2 rounded-lg border border-slate-200 p-3"><SeletorMidia label={`Foto da galeria Sobre ${index + 1}`} value={foto} midias={dados.midias} onChange={(value) => atualizarSobre({ galeria: dados.home.sobre.galeria.map((item, i) => i === index ? value : item) })} /><div className="flex flex-wrap gap-2"><label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold">Enviar imagem<input type="file" accept="image/jpeg,image/png,image/webp" disabled={enviandoImagem} onChange={(event) => void selecionarArquivo(event, (midia) => atualizarSobre({ galeria: dados.home.sobre.galeria.map((item, i) => i === index ? { ...item, midiaId: midia.id, origem: null, url: midia.url } : item) }))} className="sr-only" /></label><button type="button" disabled={index === 0} onClick={() => atualizarSobre({ galeria: moverItem(dados.home.sobre.galeria, index, -1) })} className="min-h-10 rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={`Mover imagem ${index + 1} para cima`}>↑</button><button type="button" disabled={index === dados.home.sobre.galeria.length - 1} onClick={() => atualizarSobre({ galeria: moverItem(dados.home.sobre.galeria, index, 1) })} className="min-h-10 rounded-lg border px-3 text-sm disabled:opacity-40" aria-label={`Mover imagem ${index + 1} para baixo`}>↓</button><button type="button" onClick={() => atualizarSobre({ galeria: dados.home.sobre.galeria.filter((_, i) => i !== index) })} className="min-h-10 px-3 text-sm font-semibold text-red-700">Remover</button></div></div>)}
            <button type="button" onClick={() => atualizarSobre({ galeria: [...dados.home.sobre.galeria, { midiaId: null, origem: null, url: null, alt: "" }] })} className="min-h-12 rounded-lg border border-dashed border-slate-400 text-sm font-semibold">Adicionar imagem à galeria</button>
          </div>
        </section>

        <section className="space-y-4 border-b border-slate-200 pb-6"><h2 className="text-lg font-semibold">Página de contato</h2><Campo label="Título" value={dados.contatoPagina.titulo} onChange={(value) => atualizarPaginaContato({ titulo: value })} maxLength={200} /><div className="grid gap-4 md:grid-cols-2">{seletor("Imagem de fundo", dados.contatoPagina.fundo, (value) => atualizarPaginaContato({ fundo: value }))}{seletor("Logo exibida na página", dados.contatoPagina.logo, (value) => atualizarPaginaContato({ logo: value }))}</div></section>

        <section className="space-y-4 border-b border-slate-200 pb-6"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Contatos e redes</h2><button type="button" onClick={() => setDados({ ...dados, contatos: [...dados.contatos, { id: "", chaveOrigem: "", tipo: "outro", rotulo: "", url: "https://", ordem: dados.contatos.length, ativo: true }] })} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Adicionar canal</button></div>
          {dados.contatos.map((item, index) => <div key={`${item.id}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_1fr_2fr_6rem_auto]"><Campo label="Tipo" value={item.tipo} onChange={(value) => setDados({ ...dados, contatos: dados.contatos.map((canal, i) => i === index ? { ...canal, tipo: value } : canal) })} maxLength={80} /><Campo label="Rótulo" value={item.rotulo} onChange={(value) => setDados({ ...dados, contatos: dados.contatos.map((canal, i) => i === index ? { ...canal, rotulo: value } : canal) })} maxLength={300} /><Campo label="URL" value={item.url} onChange={(value) => setDados({ ...dados, contatos: dados.contatos.map((canal, i) => i === index ? { ...canal, url: value } : canal) })} maxLength={1000} /><Campo label="Ordem" type="number" value={item.ordem} onChange={(value) => setDados({ ...dados, contatos: dados.contatos.map((canal, i) => i === index ? { ...canal, ordem: Number(value) } : canal) })} /><label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={item.ativo} onChange={(event) => setDados({ ...dados, contatos: dados.contatos.map((canal, i) => i === index ? { ...canal, ativo: event.target.checked } : canal) })} />Ativo</label></div>)}
        </section>

        <section className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Navegação pública</h2><button type="button" onClick={() => setDados({ ...dados, navegacao: [...dados.navegacao, { id: "", chaveOrigem: "", rotulo: "", destino: "/", ordem: dados.navegacao.length, ativo: true }] })} className="min-h-10 rounded-lg border px-3 text-sm font-semibold">Adicionar item</button></div>
          {dados.navegacao.map((item, index) => <div key={`${item.id}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[2fr_2fr_6rem_auto]"><Campo label="Rótulo" value={item.rotulo} onChange={(value) => setDados({ ...dados, navegacao: dados.navegacao.map((link, i) => i === index ? { ...link, rotulo: value } : link) })} maxLength={300} /><Campo label="Destino interno" value={item.destino} onChange={(value) => setDados({ ...dados, navegacao: dados.navegacao.map((link, i) => i === index ? { ...link, destino: value } : link) })} maxLength={300} /><Campo label="Ordem" type="number" value={item.ordem} onChange={(value) => setDados({ ...dados, navegacao: dados.navegacao.map((link, i) => i === index ? { ...link, ordem: Number(value) } : link) })} /><label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={item.ativo} onChange={(event) => setDados({ ...dados, navegacao: dados.navegacao.map((link, i) => i === index ? { ...link, ativo: event.target.checked } : link) })} />Ativo</label></div>)}
        </section>

        <div className="flex justify-end border-t border-slate-200 pt-4"><button type="submit" disabled={salvando || enviandoImagem} className="min-h-11 rounded-lg bg-[#412551] px-5 font-semibold text-white hover:bg-[#563765] disabled:opacity-60">{salvando ? "Salvando…" : "Salvar configurações"}</button></div>
      </form>
    </section>
  );
}
