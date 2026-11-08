import prisma from "@/lib/prisma";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { listSobreListings, urlPublicaDaMidia } from "@/lib/publicContent";

export type MediaSelection = {
  midiaId: string | null;
  origem: string | null;
  url: string | null;
  alt: string;
};

export type SiteIdentity = {
  nomePublico: string;
  dominio: string;
  destinoLogo: string;
  tituloPadrao: string;
  descricaoPadrao: string;
  palavrasChave: string[];
  autor: string;
  logo: MediaSelection;
  favicon: MediaSelection;
  imagemSocial: MediaSelection;
  textoCopyright: string;
  textoDireitos: string;
};

export type HomeSectionKey = "main" | "agenda" | "sobre" | "contato";
export type HomeSectionSetting = { chave: HomeSectionKey; titulo: string; ativa: boolean; ordem: number };
export type AgendaHomeSettings = {
  titulo: string;
  rotuloAcao: string;
  destinoAcao: string;
  acaoVisivel: boolean;
  maxCidades: number;
  maxEventosPorCidade: number;
  idsSelecionados: number[];
  exibirHorario: boolean;
  fundo: MediaSelection;
};

export type HomeSettings = {
  secoes: HomeSectionSetting[];
  agenda: AgendaHomeSettings;
  intervaloSlidesMs: number;
  opacidadeOverlay: number;
  slides: MediaSelection[];
  logoHero: MediaSelection;
  sobre: {
    titulo: string;
    texto: string;
    fundo: MediaSelection;
    galeria: MediaSelection[];
    acaoPrincipal: { rotulo: string; destino: string; visivel: boolean };
    acaoSecundaria: { rotulo: string; destino: string; visivel: boolean };
  };
  tituloContato: string;
  fundoContato: MediaSelection;
};

export type ContactChannel = {
  id: string;
  chaveOrigem: string;
  tipo: string;
  rotulo: string;
  url: string;
  ordem: number;
  ativo: boolean;
};

export type NavigationItem = {
  id: string;
  chaveOrigem: string;
  rotulo: string;
  destino: string;
  ordem: number;
  ativo: boolean;
};

export type ContactPageSettings = { titulo: string; fundo: MediaSelection; logo: MediaSelection };
export type ProjectPageSettings = { introducao: string; tituloTrajetoria: string; fundo: MediaSelection };
export type TransversalSettings = {
  paleta: "margem" | "contraste" | "terrosa";
  fundo: "nenhum" | "padrao1.webp" | "padrao2.webp" | "exu-bg.svg";
  tipografia: "sistema" | "sedgwick" | "zen-dots";
  textos: {
    voltar: string; fecharPainel: string; saibaMais: string; mostrarMais: string; lerMais: string; lerMenos: string;
    tituloAgenda: string; tituloNoticias: string; tituloIndicacoes: string; tituloSobre: string;
    tituloProjetos: string; tituloColetivo: string; tituloEspetaculos: string; tituloPremios: string;
    naoEncontradoTitulo: string; naoEncontradoMensagem: string;
    agendaVazia: string; noticiasVazias: string; livrosVazios: string;
  };
};
export type ProjectPhoto = {
  id: string;
  midiaId: string;
  url: string;
  textoAlternativo: string;
  legenda: string;
  credito: string | null;
  dataEditorial: string | null;
  ordem: number;
};
export type HistoryEntry = {
  id: string;
  ano: number;
  descricao: string;
  ordem: number;
  estado: "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";
  midiaId: string | null;
  imageUrl: string | null;
};

type SelectionInput = { midiaId?: unknown; origem?: unknown; alt?: unknown };
type SettingObject = Record<string, unknown>;
type MediaRow = { id: string; bucket: string; chave: string; origem: string | null; mime?: string; bytes?: number; nomeOriginal?: string | null };

const MENU_PADRAO: Omit<NavigationItem, "id" | "chaveOrigem">[] = [
  { rotulo: "Home", destino: "/", ordem: 0, ativo: true },
  { rotulo: "Agenda", destino: "/agenda", ordem: 1, ativo: true },
  { rotulo: "Sobre", destino: "/sobre", ordem: 2, ativo: true },
  { rotulo: "Integrantes", destino: "/coletivo", ordem: 3, ativo: true },
  { rotulo: "Prêmios", destino: "/premios", ordem: 4, ativo: true },
  { rotulo: "Espetáculos", destino: "/espetaculos", ordem: 5, ativo: true },
  { rotulo: "Projetos", destino: "/projetos", ordem: 6, ativo: true },
  { rotulo: "Notícias", destino: "/noticias", ordem: 7, ativo: true },
  { rotulo: "Indicações", destino: "/indicacoes", ordem: 8, ativo: true },
  { rotulo: "Contato", destino: "/contato", ordem: 9, ativo: true },
];

const CONTATOS_PADRAO: Omit<ContactChannel, "id" | "chaveOrigem">[] = [
  { tipo: "whatsapp", rotulo: "+55 (81) 9 8600-9096", url: "https://wa.me/5581986009096", ordem: 0, ativo: true },
  { tipo: "email", rotulo: "coletivoamargem1@gmail.com", url: "mailto:coletivoamargem1@gmail.com", ordem: 1, ativo: true },
  { tipo: "instagram", rotulo: "@amargemcoletivo", url: "https://instagram.com/amargemcoletivo", ordem: 2, ativo: true },
  { tipo: "tiktok", rotulo: "@coletivoamargem", url: "https://www.tiktok.com/@coletivoamargem", ordem: 3, ativo: true },
];

const DEFAULT_IDENTITY: Omit<SiteIdentity, "logo" | "favicon" | "imagemSocial"> & {
  logo: SelectionInput; favicon: SelectionInput; imagemSocial: SelectionInput;
} = {
  nomePublico: "Coletivo À Margem",
  dominio: "https://www.amargem.com.br",
  destinoLogo: "/",
  tituloPadrao: "Coletivo À Margem | Teatro hip-hop e cultura no Recife",
  descricaoPadrao: "Coletivo À Margem: teatro hip-hop, arte, cultura e ações colaborativas no Recife, Pernambuco.",
  palavrasChave: ["Coletivo À Margem", "teatro hip-hop", "cultura", "Recife", "Pernambuco", "arte-educação"],
  autor: "Coletivo À Margem",
  logo: { origem: "/logo-branca.png", alt: "Logo À Margem" },
  favicon: { origem: "/favicon.ico", alt: "Ícone do Coletivo À Margem" },
  imagemSocial: { origem: "/amargem-logo-insta.webp", alt: "Coletivo À Margem" },
  textoCopyright: "Copyright © 2025 – Coletivo À Margem.",
  textoDireitos: "Todos os direitos reservados.",
};

const SECOES_PADRAO: HomeSectionSetting[] = [
  { chave: "main", titulo: "Abertura", ativa: true, ordem: 0 },
  { chave: "agenda", titulo: "Agenda", ativa: true, ordem: 1 },
  { chave: "sobre", titulo: "Sobre nós", ativa: true, ordem: 2 },
  { chave: "contato", titulo: "Contatos e redes", ativa: true, ordem: 3 },
];

const DEFAULT_HOME: Omit<HomeSettings, "slides" | "logoHero" | "sobre" | "fundoContato" | "agenda"> & {
  slides: SelectionInput[]; logoHero: SelectionInput; sobre: Omit<HomeSettings["sobre"], "fundo" | "galeria"> & { fundo: SelectionInput; galeria: SelectionInput[] }; fundoContato: SelectionInput; agenda: Omit<AgendaHomeSettings, "fundo"> & { fundo: SelectionInput };
} = {
  secoes: SECOES_PADRAO,
  agenda: {
    titulo: "Próximos Eventos",
    rotuloAcao: "Agenda Completa",
    destinoAcao: "/agenda",
    acaoVisivel: true,
    maxCidades: 2,
    maxEventosPorCidade: 3,
    idsSelecionados: [],
    exibirHorario: false,
    fundo: { origem: "/padrao2.webp", alt: "Fundo dos próximos eventos" },
  },
  intervaloSlidesMs: 5000,
  opacidadeOverlay: 0.6,
  slides: [1, 2, 3].map((numero) => ({ origem: `/home/img${numero}.webp`, alt: "" })),
  logoHero: { origem: "/grito-de-guerra.webp", alt: "Grito de Guerra" },
  sobre: {
    titulo: "Sobre nós",
    texto: "O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop.",
    fundo: { origem: "/exu-bg.svg", alt: "Fundo da apresentação do coletivo" },
    galeria: [9, 5, 6, 7, 8, 4].map((numero) => ({ origem: `/home/img${numero}.webp`, alt: `Imagem ${numero} da trajetória do Coletivo À Margem` })),
    acaoPrincipal: { rotulo: "Conheça nossa história", destino: "/sobre", visivel: true },
    acaoSecundaria: { rotulo: "Conheça os Integrantes", destino: "/coletivo", visivel: true },
  },
  tituloContato: "Contatos e Redes",
  fundoContato: { origem: "/padrao2.webp", alt: "" },
};

const DEFAULT_CONTACT_PAGE = {
  titulo: "Contato",
  fundo: { origem: "/padrao2.webp", alt: "" },
  logo: { origem: "/amargem-logo-insta.webp", alt: "Logo do Coletivo À Margem" },
};

const DEFAULT_PROJECT_PAGE = {
  introducao: "O Coletivo À Margem também desenvolve ações educacionais. Seus integrantes, professores de teatro, têm como foco a difusão da metodologia do teatro hip-hop em diferentes contextos, como escolas, ONGs e projetos culturais.",
  tituloTrajetoria: "Conheça a trajetória",
  fundo: { origem: "/padrao2.webp", alt: "" },
};

export const PALETAS_SITE = {
  margem: { fundo: "#000000", texto: "#ffffff", acento: "#F38901", primario: "#412551" },
  contraste: { fundo: "#000000", texto: "#ffffff", acento: "#FECA55", primario: "#202020" },
  terrosa: { fundo: "#251c18", texto: "#fff8ef", acento: "#e3a45e", primario: "#603a2b" },
} as const;

const DEFAULT_TRANSVERSAL: TransversalSettings = {
  paleta: "margem",
  fundo: "padrao2.webp",
  tipografia: "sistema",
  textos: {
    voltar: "Voltar", fecharPainel: "Fechar painel", saibaMais: "Saiba mais", mostrarMais: "Mostrar mais", lerMais: "Ler mais", lerMenos: "Ler menos",
    tituloAgenda: "Agenda", tituloNoticias: "Notícias", tituloIndicacoes: "Livros", tituloSobre: "Sobre nós",
    tituloProjetos: "Projetos", tituloColetivo: "Integrantes", tituloEspetaculos: "Espetáculos", tituloPremios: "Prêmios",
    naoEncontradoTitulo: "404", naoEncontradoMensagem: "Seção não encontrada.",
    agendaVazia: "Nenhum evento encontrado.", noticiasVazias: "Nenhuma notícia encontrada.", livrosVazios: "Nenhum livro disponível no momento.",
  },
};

function isObject(value: unknown): value is SettingObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parseObject(value: unknown): SettingObject {
  if (!isObject(value)) return {};
  return isObject(value.dados) ? value.dados : value;
}

function textOr(value: unknown, fallback: string, max = 5000): string {
  return typeof value === "string" && value.length <= max ? value : fallback;
}

function httpUrlOr(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.length > 300) return fallback;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname && !url.username && !url.password
      && url.pathname === "/" && !url.search && !url.hash ? value : fallback;
  } catch { return fallback; }
}

function numberOr(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function storedSelection(value: unknown): SelectionInput | undefined {
  return isObject(value) ? value as SelectionInput : undefined;
}

async function resolversFor(selections: SelectionInput[]) {
  const ids = [...new Set(selections.map((selection) => selection.midiaId).filter((value): value is string => typeof value === "string" && value.length <= 128))];
  const origins = [...new Set(selections.map((selection) => selection.origem).filter((value): value is string => typeof value === "string" && value.startsWith("/") && value.length <= 500))];
  if (!ids.length && !origins.length) return { porId: new Map<string, MediaRow>(), porOrigem: new Map<string, MediaRow>() };
  const media = await prisma.midia.findMany({
    where: { OR: [...(ids.length ? [{ id: { in: ids } }] : []), ...(origins.length ? [{ origem: { in: origins } }] : [])] },
    select: { id: true, bucket: true, chave: true, origem: true },
  });
  return {
    porId: new Map(media.map((item) => [item.id, item])),
    porOrigem: new Map(media.flatMap((item) => item.origem ? [[item.origem, item] as const] : [])),
  };
}

function resolveSelection(value: unknown, fallback: SelectionInput, maps: { porId: Map<string, MediaRow>; porOrigem: Map<string, MediaRow> }): MediaSelection {
  const saved = storedSelection(value);
  const selection = saved ?? fallback;
  const midiaId = typeof selection.midiaId === "string" ? selection.midiaId : null;
  const origem = typeof selection.origem === "string" ? selection.origem : null;
  const midia = (midiaId ? maps.porId.get(midiaId) : undefined) ?? (origem ? maps.porOrigem.get(origem) : undefined);
  const alt = textOr(selection.alt, textOr(fallback.alt, "", 300), 300);
  return {
    midiaId: midia?.id ?? null,
    origem,
    url: midia ? urlPublicaDaMidia(midia) : origem,
    alt,
  };
}

async function setting(key: string): Promise<SettingObject> {
  if (!supabaseEditorialAtivo()) return {};
  const row = await prisma.configuracaoSite.findUnique({ where: { chave: key }, select: { dados: true } });
  return parseObject(row?.dados);
}

export async function getPublicTransversalSettings(): Promise<TransversalSettings> {
  const saved = await setting("site:transversal");
  const textos = isObject(saved.textos) ? saved.textos : {};
  return {
    paleta: saved.paleta === "contraste" || saved.paleta === "terrosa" ? saved.paleta : DEFAULT_TRANSVERSAL.paleta,
    fundo: saved.fundo === "nenhum" || saved.fundo === "padrao1.webp" || saved.fundo === "exu-bg.svg" ? saved.fundo : DEFAULT_TRANSVERSAL.fundo,
    tipografia: saved.tipografia === "sedgwick" || saved.tipografia === "zen-dots" ? saved.tipografia : DEFAULT_TRANSVERSAL.tipografia,
    textos: {
      voltar: textOr(textos.voltar, DEFAULT_TRANSVERSAL.textos.voltar, 100),
      fecharPainel: textOr(textos.fecharPainel, DEFAULT_TRANSVERSAL.textos.fecharPainel, 100),
      saibaMais: textOr(textos.saibaMais, DEFAULT_TRANSVERSAL.textos.saibaMais, 100),
      mostrarMais: textOr(textos.mostrarMais, DEFAULT_TRANSVERSAL.textos.mostrarMais, 100),
      lerMais: textOr(textos.lerMais, DEFAULT_TRANSVERSAL.textos.lerMais, 100),
      lerMenos: textOr(textos.lerMenos, DEFAULT_TRANSVERSAL.textos.lerMenos, 100),
      tituloAgenda: textOr(textos.tituloAgenda, DEFAULT_TRANSVERSAL.textos.tituloAgenda, 100),
      tituloNoticias: textOr(textos.tituloNoticias, DEFAULT_TRANSVERSAL.textos.tituloNoticias, 100),
      tituloIndicacoes: textOr(textos.tituloIndicacoes, DEFAULT_TRANSVERSAL.textos.tituloIndicacoes, 100),
      tituloSobre: textOr(textos.tituloSobre, DEFAULT_TRANSVERSAL.textos.tituloSobre, 100),
      tituloProjetos: textOr(textos.tituloProjetos, DEFAULT_TRANSVERSAL.textos.tituloProjetos, 100),
      tituloColetivo: textOr(textos.tituloColetivo, DEFAULT_TRANSVERSAL.textos.tituloColetivo, 100),
      tituloEspetaculos: textOr(textos.tituloEspetaculos, DEFAULT_TRANSVERSAL.textos.tituloEspetaculos, 100),
      tituloPremios: textOr(textos.tituloPremios, DEFAULT_TRANSVERSAL.textos.tituloPremios, 100),
      naoEncontradoTitulo: textOr(textos.naoEncontradoTitulo, DEFAULT_TRANSVERSAL.textos.naoEncontradoTitulo, 100),
      naoEncontradoMensagem: textOr(textos.naoEncontradoMensagem, DEFAULT_TRANSVERSAL.textos.naoEncontradoMensagem, 300),
      agendaVazia: textOr(textos.agendaVazia, DEFAULT_TRANSVERSAL.textos.agendaVazia, 300),
      noticiasVazias: textOr(textos.noticiasVazias, DEFAULT_TRANSVERSAL.textos.noticiasVazias, 300),
      livrosVazios: textOr(textos.livrosVazios, DEFAULT_TRANSVERSAL.textos.livrosVazios, 300),
    },
  };
}

export async function getPublicSiteIdentity(): Promise<SiteIdentity> {
  const saved = await setting("site:identidade");
  const selections = [
    storedSelection(saved.logo) ?? DEFAULT_IDENTITY.logo,
    storedSelection(saved.favicon) ?? DEFAULT_IDENTITY.favicon,
    storedSelection(saved.imagemSocial) ?? DEFAULT_IDENTITY.imagemSocial,
  ];
  const maps = supabaseEditorialAtivo() ? await resolversFor(selections) : { porId: new Map(), porOrigem: new Map() };
  return {
    nomePublico: textOr(saved.nomePublico, DEFAULT_IDENTITY.nomePublico, 200),
    dominio: httpUrlOr(saved.dominio, DEFAULT_IDENTITY.dominio),
    destinoLogo: typeof saved.destinoLogo === "string" && saved.destinoLogo.startsWith("/") && !saved.destinoLogo.startsWith("//") && saved.destinoLogo.length <= 300 ? saved.destinoLogo : DEFAULT_IDENTITY.destinoLogo,
    tituloPadrao: textOr(saved.tituloPadrao, DEFAULT_IDENTITY.tituloPadrao, 300),
    descricaoPadrao: textOr(saved.descricaoPadrao, DEFAULT_IDENTITY.descricaoPadrao, 1000),
    palavrasChave: Array.isArray(saved.palavrasChave) && saved.palavrasChave.length <= 30
      ? saved.palavrasChave.filter((item): item is string => typeof item === "string").slice(0, 30)
      : [...DEFAULT_IDENTITY.palavrasChave],
    autor: textOr(saved.autor, DEFAULT_IDENTITY.autor, 200),
    logo: resolveSelection(saved.logo, DEFAULT_IDENTITY.logo, maps),
    favicon: resolveSelection(saved.favicon, DEFAULT_IDENTITY.favicon, maps),
    imagemSocial: resolveSelection(saved.imagemSocial, DEFAULT_IDENTITY.imagemSocial, maps),
    textoCopyright: textOr(saved.textoCopyright, DEFAULT_IDENTITY.textoCopyright, 300),
    textoDireitos: textOr(saved.textoDireitos, DEFAULT_IDENTITY.textoDireitos, 300),
  };
}

export async function listPublicNavigation(): Promise<NavigationItem[]> {
  if (supabaseEditorialAtivo()) {
    const [items, pages] = await Promise.all([
      prisma.itemMenu.findMany({ orderBy: [{ ordem: "asc" }, { rotulo: "asc" }] }),
      prisma.paginaSite.findMany({ where: { estado: { not: "PUBLICADO" } }, select: { caminho: true } }),
    ]);
    const hiddenPaths = new Set(pages.map((page) => page.caminho));
    if (items.length) return items.filter((item) => item.ativo && !hiddenPaths.has(item.destino)).map((item) => ({
      id: item.id, chaveOrigem: item.chaveOrigem, rotulo: item.rotulo, destino: item.destino, ordem: item.ordem, ativo: item.ativo,
    }));
  }
  const visible = supabaseEditorialAtivo()
    ? await prisma.paginaSite.findMany({ where: { estado: { not: "PUBLICADO" } }, select: { caminho: true } })
    : [];
  const hiddenPaths = new Set(visible.map((page) => page.caminho));
  return MENU_PADRAO.filter((item) => !hiddenPaths.has(item.destino)).map((item, index) => ({ ...item, id: `default-menu-${index}`, chaveOrigem: `menu:${item.destino}` }));
}

export async function listPublicContacts(): Promise<ContactChannel[]> {
  if (supabaseEditorialAtivo()) {
    const items = await prisma.canalContato.findMany({ orderBy: [{ ordem: "asc" }, { rotulo: "asc" }] });
    if (items.length) return items.filter((item) => item.ativo).map((item) => ({
      id: item.id, chaveOrigem: item.chaveOrigem, tipo: item.tipo, rotulo: item.rotulo, url: item.url, ordem: item.ordem, ativo: item.ativo,
    }));
  }
  return CONTATOS_PADRAO.map((item, index) => ({ ...item, id: `default-contact-${index}`, chaveOrigem: `contato:${item.tipo}` }));
}

export async function getPublicHomeSettings(): Promise<HomeSettings> {
  const saved = await setting("home:pagina");
  const hero = isObject(saved.hero) ? saved.hero : {};
  const agendaSaved = isObject(saved.agenda) ? saved.agenda : {};
  const about = isObject(saved.sobre) ? saved.sobre : {};
  const primaryAction = isObject(about.acaoPrincipal) ? about.acaoPrincipal : {};
  const secondaryAction = isObject(about.acaoSecundaria) ? about.acaoSecundaria : {};
  const defaultRefs = [
    ...DEFAULT_HOME.slides,
    DEFAULT_HOME.agenda.fundo,
    DEFAULT_HOME.logoHero,
    DEFAULT_HOME.sobre.fundo,
    ...DEFAULT_HOME.sobre.galeria,
    DEFAULT_HOME.fundoContato,
  ];
  const savedRefs = [
    ...(Array.isArray(hero.slides) ? hero.slides.map((item) => storedSelection(item)).filter((item): item is SelectionInput => Boolean(item)) : []),
    ...(storedSelection(agendaSaved.fundo) ? [storedSelection(agendaSaved.fundo)!] : []),
    ...(storedSelection(hero.logo) ? [storedSelection(hero.logo)!] : []),
    ...(storedSelection(about.fundo) ? [storedSelection(about.fundo)!] : []),
    ...(Array.isArray(about.galeria) ? about.galeria.map((item) => storedSelection(item)).filter((item): item is SelectionInput => Boolean(item)) : []),
    ...(storedSelection(saved.fundoContato) ? [storedSelection(saved.fundoContato)!] : []),
  ];
  const maps = supabaseEditorialAtivo() ? await resolversFor([...defaultRefs, ...savedRefs]) : { porId: new Map(), porOrigem: new Map() };
  let secoes = SECOES_PADRAO;
  if (supabaseEditorialAtivo()) {
    const rows = await prisma.secaoHome.findMany({ orderBy: [{ ordem: "asc" }, { tipo: "asc" }] });
    if (rows.length) {
      const keyByType: Record<string, HomeSectionKey> = { Main: "main", AgendaHome: "agenda", Sobre: "sobre", Contato: "contato", main: "main", agenda: "agenda", sobre: "sobre", contato: "contato" };
      const parsed = rows.flatMap((row) => {
        const chave = keyByType[row.tipo];
        return chave ? [{ chave, titulo: SECOES_PADRAO.find((item) => item.chave === chave)?.titulo ?? row.tipo, ativa: row.ativa, ordem: row.ordem }] : [];
      });
      if (parsed.length) secoes = parsed;
    }
  }
  const savedSlides = Array.isArray(hero.slides) ? hero.slides : null;
  const savedGallery = Array.isArray(about.galeria) ? about.galeria : null;
  return {
    secoes,
    agenda: {
      titulo: textOr(agendaSaved.titulo, DEFAULT_HOME.agenda.titulo, 200),
      rotuloAcao: textOr(agendaSaved.rotuloAcao, DEFAULT_HOME.agenda.rotuloAcao, 100),
      destinoAcao: textOr(agendaSaved.destinoAcao, DEFAULT_HOME.agenda.destinoAcao, 300),
      acaoVisivel: typeof agendaSaved.acaoVisivel === "boolean" ? agendaSaved.acaoVisivel : DEFAULT_HOME.agenda.acaoVisivel,
      maxCidades: numberOr(agendaSaved.maxCidades, DEFAULT_HOME.agenda.maxCidades, 1, 10),
      maxEventosPorCidade: numberOr(agendaSaved.maxEventosPorCidade, DEFAULT_HOME.agenda.maxEventosPorCidade, 1, 10),
      idsSelecionados: Array.isArray(agendaSaved.idsSelecionados) && agendaSaved.idsSelecionados.length <= 100
        ? [...new Set(agendaSaved.idsSelecionados.filter((item): item is number => Number.isSafeInteger(item) && item > 0))]
        : [],
      exibirHorario: typeof agendaSaved.exibirHorario === "boolean" ? agendaSaved.exibirHorario : DEFAULT_HOME.agenda.exibirHorario,
      fundo: resolveSelection(agendaSaved.fundo, DEFAULT_HOME.agenda.fundo, maps),
    },
    intervaloSlidesMs: numberOr(hero.intervaloSlidesMs, DEFAULT_HOME.intervaloSlidesMs, 1000, 30000),
    opacidadeOverlay: numberOr(hero.opacidadeOverlay, DEFAULT_HOME.opacidadeOverlay, 0, 0.9),
    slides: (savedSlides ?? DEFAULT_HOME.slides).slice(0, 20).map((item, index) => resolveSelection(item, DEFAULT_HOME.slides[index] ?? { alt: "" }, maps)),
    logoHero: resolveSelection(hero.logo, DEFAULT_HOME.logoHero, maps),
    sobre: {
      titulo: textOr(about.titulo, DEFAULT_HOME.sobre.titulo, 200),
      texto: textOr(about.texto, DEFAULT_HOME.sobre.texto, 10000),
      fundo: resolveSelection(about.fundo, DEFAULT_HOME.sobre.fundo, maps),
      galeria: (savedGallery ?? DEFAULT_HOME.sobre.galeria).slice(0, 50).map((item, index) => resolveSelection(item, DEFAULT_HOME.sobre.galeria[index] ?? { alt: "" }, maps)),
      acaoPrincipal: {
        rotulo: textOr(primaryAction.rotulo, DEFAULT_HOME.sobre.acaoPrincipal.rotulo, 100),
        destino: textOr(primaryAction.destino, DEFAULT_HOME.sobre.acaoPrincipal.destino, 300),
        visivel: typeof primaryAction.visivel === "boolean" ? primaryAction.visivel : true,
      },
      acaoSecundaria: {
        rotulo: textOr(secondaryAction.rotulo, DEFAULT_HOME.sobre.acaoSecundaria.rotulo, 100),
        destino: textOr(secondaryAction.destino, DEFAULT_HOME.sobre.acaoSecundaria.destino, 300),
        visivel: typeof secondaryAction.visivel === "boolean" ? secondaryAction.visivel : true,
      },
    },
    tituloContato: textOr(saved.tituloContato, DEFAULT_HOME.tituloContato, 200),
    fundoContato: resolveSelection(saved.fundoContato, DEFAULT_HOME.fundoContato, maps),
  };
}

export async function getPublicContactPageSettings(): Promise<ContactPageSettings> {
  const saved = await setting("contato:pagina");
  const refs = [storedSelection(saved.fundo) ?? DEFAULT_CONTACT_PAGE.fundo, storedSelection(saved.logo) ?? DEFAULT_CONTACT_PAGE.logo];
  const maps = supabaseEditorialAtivo() ? await resolversFor(refs) : { porId: new Map(), porOrigem: new Map() };
  return {
    titulo: textOr(saved.titulo, DEFAULT_CONTACT_PAGE.titulo, 200),
    fundo: resolveSelection(saved.fundo, DEFAULT_CONTACT_PAGE.fundo, maps),
    logo: resolveSelection(saved.logo, DEFAULT_CONTACT_PAGE.logo, maps),
  };
}

export async function getPublicProjectPageSettings(): Promise<ProjectPageSettings> {
  const saved = await setting("projetos:pagina");
  const fallback = DEFAULT_PROJECT_PAGE.fundo;
  const maps = supabaseEditorialAtivo() ? await resolversFor([storedSelection(saved.fundo) ?? fallback]) : { porId: new Map(), porOrigem: new Map() };
  return {
    introducao: textOr(saved.introducao, DEFAULT_PROJECT_PAGE.introducao, 10000),
    tituloTrajetoria: textOr(saved.tituloTrajetoria, DEFAULT_PROJECT_PAGE.tituloTrajetoria, 200),
    fundo: resolveSelection(saved.fundo, fallback, maps),
  };
}

export async function listPublicProjectPhotos(): Promise<ProjectPhoto[]> {
  if (!supabaseEditorialAtivo()) return [];
  const gallery = await prisma.galeria.findUnique({
    where: { chaveOrigem: "galeria:projetos" },
    include: { fotos: { orderBy: { ordem: "asc" }, include: { midia: { select: { id: true, bucket: true, chave: true, origem: true } } } } },
  });
  return (gallery?.fotos ?? []).map((foto) => ({
    id: foto.id,
    midiaId: foto.midiaId,
    url: urlPublicaDaMidia(foto.midia) ?? "/padrao2.webp",
    textoAlternativo: foto.textoAlternativo,
    legenda: foto.legenda,
    credito: foto.credito,
    dataEditorial: foto.dataEditorial,
    ordem: foto.ordem,
  }));
}

export async function listPublicHistory(): Promise<{ ano: number; descricao: string; imageUrl: string | null }[]> {
  if (!supabaseEditorialAtivo()) {
    const items = await listSobreListings("asc");
    return items.map((item) => ({ ano: item.ano, descricao: item.descricao, imageUrl: item.hasImage ? `/api/image/sobre/${item.ano}` : null }));
  }
  const items = await prisma.marcoHistorico.findMany({
    where: { estado: "PUBLICADO" },
    orderBy: [{ ordem: "asc" }, { ano: "asc" }, { id: "asc" }],
  });
  if (!items.length) {
    const legado = await listSobreListings("asc");
    return legado.map((item) => ({ ano: item.ano, descricao: item.descricao, imageUrl: item.hasImage ? `/api/image/sobre/${item.ano}` : null }));
  }
  const usages = await prisma.usoMidia.findMany({
    where: { dominio: "MarcoHistorico", campo: "imagem", registro: { in: items.map((item) => item.id) } },
    include: { midia: { select: { bucket: true, chave: true, origem: true } } },
  });
  const images = new Map(usages.map((usage) => [usage.registro, urlPublicaDaMidia(usage.midia)]));
  return items.map((item) => ({ ano: item.ano, descricao: item.descricao, imageUrl: images.get(item.id) ?? null }));
}

export async function listAdminHistory(): Promise<HistoryEntry[]> {
  const items = await prisma.marcoHistorico.findMany({ orderBy: [{ ordem: "asc" }, { ano: "desc" }, { id: "asc" }] });
  if (!items.length) return [];
  const usages = await prisma.usoMidia.findMany({
    where: { dominio: "MarcoHistorico", campo: "imagem", registro: { in: items.map((item) => item.id) } },
    include: { midia: { select: { id: true, bucket: true, chave: true, origem: true } } },
  });
  const images = new Map(usages.map((usage) => [usage.registro, { midiaId: usage.midiaId, url: urlPublicaDaMidia(usage.midia) }]));
  return items.map((item) => ({
    id: item.id,
    ano: item.ano,
    descricao: item.descricao,
    ordem: item.ordem,
    estado: item.estado,
    midiaId: images.get(item.id)?.midiaId ?? null,
    imageUrl: images.get(item.id)?.url ?? null,
  }));
}

export const defaultsParaConfiguracaoAdmin = {
  identidade: DEFAULT_IDENTITY,
  home: DEFAULT_HOME,
  contatoPagina: DEFAULT_CONTACT_PAGE,
  projetosPagina: DEFAULT_PROJECT_PAGE,
  contatos: CONTATOS_PADRAO,
  navegacao: MENU_PADRAO,
  secoesHome: SECOES_PADRAO,
};
