import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { isText, readJsonObject } from "@/lib/adminInput";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { urlPublicaDaMidia } from "@/lib/publicContent";
import {
  defaultsParaConfiguracaoAdmin,
  getPublicContactPageSettings,
  getPublicHomeSettings,
  getPublicProjectPageSettings,
  getPublicSiteIdentity,
} from "@/lib/siteContent";

const TIPOS_SECAO: Record<string, string> = { main: "Main", agenda: "AgendaHome", sobre: "Sobre", contato: "Contato" };
type LinhaLista = { id: string; chaveOrigem: string; rotulo: string; destino?: string; tipo?: string; ordem: number; ativo: boolean };

function objeto(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function caminhoInterno(value: unknown): value is string {
  return typeof value === "string" && value.length <= 300 && value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value);
}

function urlContato(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 1000) return false;
  if (/^(mailto|tel):[^\s]+$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password
      && url.pathname === "/" && !url.search && !url.hash;
  } catch { return false; }
}

function dominioValido(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 300) return false;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
}

function validarSelecao(value: unknown): value is Record<string, unknown> {
  if (!objeto(value)) return false;
  const idOk = value.midiaId === null || value.midiaId === undefined || (typeof value.midiaId === "string" && value.midiaId.length > 0 && value.midiaId.length <= 128);
  const origemOk = value.origem === null || value.origem === undefined || (typeof value.origem === "string" && value.origem.startsWith("/") && !value.origem.startsWith("//") && value.origem.length <= 500 && !/[\\'"\r\n]/.test(value.origem));
  return idOk && origemOk && (value.alt === undefined || typeof value.alt === "string" && value.alt.length <= 300);
}

function selection(value: Record<string, unknown>) {
  return {
    midiaId: typeof value.midiaId === "string" && value.midiaId ? value.midiaId : null,
    origem: typeof value.origem === "string" ? value.origem : null,
    alt: typeof value.alt === "string" ? value.alt : "",
  };
}

function selectionWithExistingMedia(value: { midiaId: string | null; origem: string | null; alt: string }, mediaIds: Set<string>) {
  const selected = { midiaId: value.midiaId, origem: value.origem, alt: value.alt };
  return selected.midiaId && !mediaIds.has(selected.midiaId) ? { ...selected, midiaId: null } : selected;
}

function conflitoUnico(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

async function validarSelecoes(selecoes: unknown[]): Promise<boolean> {
  if (selecoes.some((item) => !validarSelecao(item))) return false;
  const ids = [...new Set(selecoes.flatMap((item) => typeof item === "object" && item && "midiaId" in item && typeof item.midiaId === "string" ? [item.midiaId] : []))];
  if (!ids.length) return true;
  const encontradas = await prisma.midia.count({ where: { id: { in: ids } } });
  return encontradas === ids.length;
}

function extrairSelecoes(body: Record<string, unknown>): unknown[] | null {
  const identidade = objeto(body.identidade) ? body.identidade : null;
  const home = objeto(body.home) ? body.home : null;
  const contato = objeto(body.contatoPagina) ? body.contatoPagina : null;
  const projetos = objeto(body.projetosPagina) ? body.projetosPagina : null;
  if (!identidade || !home || !contato || !projetos) return null;
  const identidadeRefs = [identidade.logo, identidade.favicon, identidade.imagemSocial];
  const hero = objeto(home.hero) ? home.hero : null;
  const agenda = objeto(home.agenda) ? home.agenda : null;
  const sobre = objeto(home.sobre) ? home.sobre : null;
  if (!hero || !agenda || !sobre || !Array.isArray(hero.slides) || hero.slides.length > 20 || !Array.isArray(sobre.galeria) || sobre.galeria.length > 50) return null;
  const refs = [
    ...identidadeRefs,
    ...hero.slides,
    hero.logo,
    agenda.fundo,
    sobre.fundo,
    ...sobre.galeria,
    home.fundoContato,
    contato.fundo,
    contato.logo,
    projetos.fundo,
  ];
  return refs;
}

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });

  const [identidade, homeRaw, contatoPagina, projetosPagina, contatosSalvos, menuSalvo, secoesSalvas, midias, agendaDisponivel] = await Promise.all([
    getPublicSiteIdentity(),
    getPublicHomeSettings(),
    getPublicContactPageSettings(),
    getPublicProjectPageSettings(),
    prisma.canalContato.findMany({ orderBy: [{ ordem: "asc" }, { rotulo: "asc" }] }),
    prisma.itemMenu.findMany({ orderBy: [{ ordem: "asc" }, { rotulo: "asc" }] }),
    prisma.secaoHome.findMany({ orderBy: [{ ordem: "asc" }, { tipo: "asc" }] }),
    prisma.midia.findMany({ orderBy: [{ criadoEm: "desc" }, { id: "asc" }], select: { id: true, bucket: true, chave: true, mime: true, bytes: true, nomeOriginal: true, origem: true } }),
    prisma.agenda.findMany({ where: { estado: "PUBLICADO" }, orderBy: [{ ordem: "asc" }, { data: "asc" }, { id: "asc" }], select: { id: true, titulo: true, data: true, cidade: true, local: true } }),
  ]);
  const idsAgenda = new Set(agendaDisponivel.map((item) => item.id));
  const idsMidia = new Set(midias.map((item) => item.id));
  const home = {
    ...homeRaw,
    slides: homeRaw.slides.map((item) => selectionWithExistingMedia(item, idsMidia)),
    logoHero: selectionWithExistingMedia(homeRaw.logoHero, idsMidia),
    agenda: {
      ...homeRaw.agenda,
      idsSelecionados: homeRaw.agenda.idsSelecionados.filter((id) => idsAgenda.has(id)),
      fundo: selectionWithExistingMedia(homeRaw.agenda.fundo, idsMidia),
    },
    sobre: {
      ...homeRaw.sobre,
      fundo: selectionWithExistingMedia(homeRaw.sobre.fundo, idsMidia),
      galeria: homeRaw.sobre.galeria.map((item) => selectionWithExistingMedia(item, idsMidia)),
    },
    fundoContato: selectionWithExistingMedia(homeRaw.fundoContato, idsMidia),
  };
  const identidadeAdmin = {
    ...identidade,
    logo: selectionWithExistingMedia(identidade.logo, idsMidia),
    favicon: selectionWithExistingMedia(identidade.favicon, idsMidia),
    imagemSocial: selectionWithExistingMedia(identidade.imagemSocial, idsMidia),
  };
  const contatoPaginaAdmin = {
    ...contatoPagina,
    fundo: selectionWithExistingMedia(contatoPagina.fundo, idsMidia),
    logo: selectionWithExistingMedia(contatoPagina.logo, idsMidia),
  };
  const projetosPaginaAdmin = {
    ...projetosPagina,
    fundo: selectionWithExistingMedia(projetosPagina.fundo, idsMidia),
  };
  const contatos: LinhaLista[] = contatosSalvos.length ? contatosSalvos.map((item) => ({ ...item })) : defaultsParaConfiguracaoAdmin.contatos.map((item, ordem) => ({ id: "", chaveOrigem: `contato:${item.tipo}`, ...item, ordem }));
  const navegacao: LinhaLista[] = menuSalvo.length ? menuSalvo.map((item) => ({ ...item })) : defaultsParaConfiguracaoAdmin.navegacao.map((item, ordem) => ({ id: "", chaveOrigem: `menu:${item.destino}`, ...item, ordem }));
  const secoes = secoesSalvas.length ? home.secoes : defaultsParaConfiguracaoAdmin.secoesHome;

  return NextResponse.json({
    identidade: identidadeAdmin, home: { ...home, secoes }, contatoPagina: contatoPaginaAdmin, projetosPagina: projetosPaginaAdmin,
    contatos, navegacao,
    agendaDisponivel: agendaDisponivel.map((item) => ({ ...item, data: item.data.toISOString() })),
    midias: midias.map((item) => ({ id: item.id, url: urlPublicaDaMidia(item) ?? item.origem ?? "/padrao2.webp", mime: item.mime, bytes: item.bytes, nomeOriginal: item.nomeOriginal })),
  });
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const recebido = await readJsonObject(request);
  const homeRecebida = recebido && objeto(recebido.home) ? recebido.home : null;
  const homeNormalizada = homeRecebida && objeto(homeRecebida.hero) ? homeRecebida : homeRecebida ? {
    ...homeRecebida,
    hero: {
      intervaloSlidesMs: homeRecebida.intervaloSlidesMs,
      opacidadeOverlay: homeRecebida.opacidadeOverlay,
      slides: homeRecebida.slides,
      logo: homeRecebida.logoHero,
    },
  } : null;
  const body = recebido && homeNormalizada ? { ...recebido, home: homeNormalizada } : recebido;
  const refs = body && extrairSelecoes(body);
  if (!body || !refs || !await validarSelecoes(refs)) return NextResponse.json({ error: "Configuração ou referências de mídia inválidas" }, { status: 400 });

  const identidade = body.identidade as Record<string, unknown>;
  const home = body.home as Record<string, unknown>;
  const contatoPagina = body.contatoPagina as Record<string, unknown>;
  const projetosPagina = body.projetosPagina as Record<string, unknown>;
  const hero = home.hero as Record<string, unknown>;
  const agenda = home.agenda;
  const sobre = home.sobre as Record<string, unknown>;
  const acaoPrincipal = sobre.acaoPrincipal;
  const acaoSecundaria = sobre.acaoSecundaria;
  const palavrasChave = identidade.palavrasChave;
  const slides = hero.slides as unknown[];
  const galeriaSobre = sobre.galeria as unknown[];
  const canais = body.contatos;
  const menu = body.navegacao;
  const secoes = home.secoes;

  if (![identidade.nomePublico, identidade.tituloPadrao, identidade.descricaoPadrao, identidade.autor, identidade.textoCopyright, identidade.textoDireitos].every((value) => typeof value === "string")
    || !dominioValido(identidade.dominio)
    || !caminhoInterno(identidade.destinoLogo)
    || !Array.isArray(palavrasChave) || palavrasChave.length > 30 || palavrasChave.some((item) => !isText(item, 100))
    || !isText(identidade.nomePublico, 200) || !isText(identidade.tituloPadrao, 300) || !isText(identidade.descricaoPadrao, 1000)
    || typeof hero.intervaloSlidesMs !== "number" || hero.intervaloSlidesMs < 1000 || hero.intervaloSlidesMs > 30000
    || typeof hero.opacidadeOverlay !== "number" || hero.opacidadeOverlay < 0 || hero.opacidadeOverlay > 0.9
    || !objeto(agenda) || !isText(agenda.titulo, 200) || !isText(agenda.rotuloAcao, 100)
    || !caminhoInterno(agenda.destinoAcao) || typeof agenda.acaoVisivel !== "boolean"
    || !Number.isSafeInteger(agenda.maxCidades) || (agenda.maxCidades as number) < 1 || (agenda.maxCidades as number) > 10
    || !Number.isSafeInteger(agenda.maxEventosPorCidade) || (agenda.maxEventosPorCidade as number) < 1 || (agenda.maxEventosPorCidade as number) > 10
    || typeof agenda.exibirHorario !== "boolean" || !Array.isArray(agenda.idsSelecionados) || agenda.idsSelecionados.length > 100
    || agenda.idsSelecionados.some((id) => !Number.isSafeInteger(id) || (id as number) <= 0)
    || new Set(agenda.idsSelecionados).size !== agenda.idsSelecionados.length
    || slides.length < 1 || slides.length > 20 || galeriaSobre.length > 50
    || !isText(sobre.titulo, 200) || !isText(sobre.texto, 10000)
    || !isText(contatoPagina.titulo, 200) || !isText(home.tituloContato, 200)
    || !isText(projetosPagina.introducao, 10000) || !isText(projetosPagina.tituloTrajetoria, 200)
    || !Array.isArray(secoes) || secoes.length !== 4
    || !Array.isArray(canais) || canais.length > 30 || !Array.isArray(menu) || menu.length > 30) {
    return NextResponse.json({ error: "Campos de configuração fora dos limites permitidos" }, { status: 400 });
  }

  const idsAgenda = agenda.idsSelecionados as number[];
  if (idsAgenda.length && await prisma.agenda.count({ where: { id: { in: idsAgenda } } }) !== idsAgenda.length) {
    return NextResponse.json({ error: "A seleção de eventos da home contém registros inexistentes" }, { status: 400 });
  }

  for (const item of [acaoPrincipal, acaoSecundaria]) {
    if (!objeto(item) || !isText(item.rotulo, 100) || !caminhoInterno(item.destino) || typeof item.visivel !== "boolean") {
      return NextResponse.json({ error: "Ação da home inválida" }, { status: 400 });
    }
  }
  for (const secao of secoes) {
    if (!objeto(secao) || !Object.hasOwn(TIPOS_SECAO, String(secao.chave)) || typeof secao.ativa !== "boolean" || !Number.isSafeInteger(secao.ordem) || (secao.ordem as number) < 0 || (secao.ordem as number) > 100) {
      return NextResponse.json({ error: "Ordem ou visibilidade das seções inválida" }, { status: 400 });
    }
  }
  const chavesSecoes = new Set((secoes as Record<string, unknown>[]).map((secao) => secao.chave));
  if (chavesSecoes.size !== 4) return NextResponse.json({ error: "Cada seção da home deve aparecer uma única vez" }, { status: 400 });
  for (const [lista, nome] of [[canais, "contato"], [menu, "menu"]] as const) {
    const chaves = new Set<string>();
    for (const item of lista) {
      if (!objeto(item) || typeof item.id !== "string" || item.id.length > 128 || !isText(item.rotulo, 300)
        || item.chaveOrigem !== undefined && (typeof item.chaveOrigem !== "string" || item.chaveOrigem.length > 200)
        || !Number.isSafeInteger(item.ordem) || (item.ordem as number) < 0 || (item.ordem as number) > 10000 || typeof item.ativo !== "boolean") {
        return NextResponse.json({ error: `Item de ${nome} inválido` }, { status: 400 });
      }
      if (nome === "contato" && (!isText(item.tipo, 80) || !urlContato(item.url))) return NextResponse.json({ error: "Canal de contato inválido" }, { status: 400 });
      if (nome === "menu" && !caminhoInterno(item.destino)) return NextResponse.json({ error: "Destino de navegação inválido" }, { status: 400 });
      const chave = typeof item.chaveOrigem === "string" && item.chaveOrigem ? item.chaveOrigem : `${nome}:${randomUUID()}`;
      if (chaves.has(chave)) return NextResponse.json({ error: `Há itens de ${nome} duplicados` }, { status: 400 });
      chaves.add(chave);
    }
  }

  const dadosIdentidade = { ...identidade, palavrasChave, logo: selection(identidade.logo as Record<string, unknown>), favicon: selection(identidade.favicon as Record<string, unknown>), imagemSocial: selection(identidade.imagemSocial as Record<string, unknown>) };
  const dadosHome = {
    hero: { intervaloSlidesMs: hero.intervaloSlidesMs, opacidadeOverlay: hero.opacidadeOverlay, slides: slides.map((item) => selection(item as Record<string, unknown>)), logo: selection(hero.logo as Record<string, unknown>) },
    agenda: { titulo: agenda.titulo as string, rotuloAcao: agenda.rotuloAcao as string, destinoAcao: agenda.destinoAcao as string, acaoVisivel: agenda.acaoVisivel as boolean, maxCidades: agenda.maxCidades as number, maxEventosPorCidade: agenda.maxEventosPorCidade as number, idsSelecionados: idsAgenda, exibirHorario: agenda.exibirHorario as boolean, fundo: selection(agenda.fundo as Record<string, unknown>) },
    sobre: { ...sobre, fundo: selection(sobre.fundo as Record<string, unknown>), galeria: galeriaSobre.map((item) => selection(item as Record<string, unknown>)) },
    tituloContato: home.tituloContato,
    fundoContato: selection(home.fundoContato as Record<string, unknown>),
  };

  try {
    await prisma.$transaction(async (tx) => {
      const configs = [
        ["site:identidade", dadosIdentidade], ["home:pagina", dadosHome],
        ["contato:pagina", { ...contatoPagina, fundo: selection(contatoPagina.fundo as Record<string, unknown>), logo: selection(contatoPagina.logo as Record<string, unknown>) }],
        ["projetos:pagina", { ...projetosPagina, fundo: selection(projetosPagina.fundo as Record<string, unknown>) }],
      ] as const;
      for (const [chave, dados] of configs) await tx.configuracaoSite.upsert({ where: { chave }, create: { chave, versao: 1, dados }, update: { dados, versao: { increment: 1 } } });

      const chavesSecao = new Set<string>();
      for (const secao of secoes as Record<string, unknown>[]) {
        const chave = `home:${String(secao.chave)}`;
        chavesSecao.add(chave);
        const tipo = TIPOS_SECAO[String(secao.chave)];
        await tx.secaoHome.upsert({
          where: { chave },
          create: { chave, tipo, ordem: secao.ordem as number, ativa: secao.ativa as boolean, configuracao: {} },
          update: { ordem: secao.ordem as number, ativa: secao.ativa as boolean, tipo },
        });
      }
      await tx.secaoHome.updateMany({ where: { chave: { startsWith: "home:" }, NOT: { chave: { in: [...chavesSecao] } } }, data: { ativa: false } });

      const contatosAtivos = new Set<string>();
      for (const [ordem, raw] of (canais as Record<string, unknown>[]).entries()) {
        const chaveOrigem = typeof raw.chaveOrigem === "string" && raw.chaveOrigem ? raw.chaveOrigem : `admin:contato:${randomUUID()}:${ordem}`;
        contatosAtivos.add(chaveOrigem);
        const data = { tipo: raw.tipo as string, rotulo: raw.rotulo as string, url: raw.url as string, ordem: raw.ordem as number, ativo: raw.ativo as boolean };
        await tx.canalContato.upsert({ where: { chaveOrigem }, create: { chaveOrigem, ...data }, update: data });
      }
      await tx.canalContato.updateMany({ where: { chaveOrigem: { notIn: [...contatosAtivos] } }, data: { ativo: false } });

      const menuAtivo = new Set<string>();
      for (const [ordem, raw] of (menu as Record<string, unknown>[]).entries()) {
        const chaveOrigem = typeof raw.chaveOrigem === "string" && raw.chaveOrigem ? raw.chaveOrigem : `admin:menu:${randomUUID()}:${ordem}`;
        menuAtivo.add(chaveOrigem);
        const data = { rotulo: raw.rotulo as string, destino: raw.destino as string, ordem: raw.ordem as number, ativo: raw.ativo as boolean };
        await tx.itemMenu.upsert({ where: { chaveOrigem }, create: { chaveOrigem, ...data }, update: data });
      }
      await tx.itemMenu.updateMany({ where: { chaveOrigem: { notIn: [...menuAtivo] } }, data: { ativo: false } });
    });
  } catch (error) {
    return conflitoUnico(error)
      ? NextResponse.json({ error: "Conflito ao salvar menu ou contato" }, { status: 409 })
      : NextResponse.json({ error: "Não foi possível salvar as configurações" }, { status: 500 });
  }

  for (const path of ["/", "/contato", "/projetos", "/sitemap.xml"]) revalidatePath(path);
  return NextResponse.json({ ok: true });
}
