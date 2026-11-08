import prisma from "@/lib/prisma";
import type { EstadoPublicacao } from "@prisma/client";
import { integrantes as integrantesLegados } from "@/data/integrantes";
import { espetaculosData as espetaculosLegados, shows as detalhesEspetaculosLegados } from "@/data/espetaculos";
import { premios as premiosLegados } from "@/data/premios";
import { slugify } from "@/utils/helpers";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";

export interface BookListing {
  id: number;
  titulo: string;
  autor: string;
  descricao: string;
  hasImage: boolean;
  createdAt: Date;
}

export interface AgendaListing {
  id: number; titulo: string; data: Date; local: string; createdAt: Date; cidade: string;
}

export interface NoticiaListing {
  id: number; titulo: string; conteudo: string; link: string;
}

export interface ProjetoListing {
  id: number; data: Date; descricao: string;
}

export interface SobreListing {
  ano: number;
  descricao: string;
  hasImage: boolean;
}

export interface MidiaPublica {
  id: string;
  url: string;
  mime: string;
  bytes: number;
  nomeOriginal: string | null;
}

export interface IntegrantePublico {
  id: string;
  slug: string;
  nome: string;
  image: string;
  fichaTecnica: string;
  biografia: string;
  ordem: number;
  seo?: unknown;
}

export interface SecaoEspetaculoPublica {
  id: string;
  titulo: string;
  texto: string;
  ordem: number;
}

export interface FotoEspetaculoPublica {
  id: string;
  descricao: string;
  data: string;
  img: string;
  textoAlternativo: string;
}

export interface EspetaculoPublico {
  id: string;
  slug: string;
  title: string;
  release: string;
  opening: string | null;
  local: string | null;
  bgColor: string | null;
  img: string;
  ordem: number;
  imgs: FotoEspetaculoPublica[];
  sections: SecaoEspetaculoPublica[];
  seo?: unknown;
}

export interface PremioPublico {
  id: string;
  slug: string;
  title: string;
  year: string;
  evento: string;
  description: string;
  img: string | null;
  ordem: number;
  seo?: unknown;
}

type MidiaComUrl = { bucket: string; chave: string; origem: string | null };

export function urlPublicaDaMidia(midia: MidiaComUrl | null | undefined): string | null {
  if (!midia) return null;
  const base = process.env.SUPABASE_URL;
  if (base) {
    try {
      const origem = new URL(base).origin;
      const chave = midia.chave.split("/").map(encodeURIComponent).join("/");
      return `${origem}/storage/v1/object/public/${encodeURIComponent(midia.bucket)}/${chave}`;
    } catch {
      // Configuração inválida não produz uma URL de mídia remota.
    }
  }
  return midia.origem?.startsWith("/") ? midia.origem : null;
}

function urlObrigatoriaDaMidia(midia: MidiaComUrl | null | undefined, fallback: string): string {
  return urlPublicaDaMidia(midia) ?? fallback;
}

const PUBLICADO: EstadoPublicacao = "PUBLICADO";

function mapearIntegranteLegado(item: typeof integrantesLegados[number], ordem: number): IntegrantePublico {
  return { ...item, id: `legado:${item.id}`, slug: item.id, ordem };
}

function mapearEspetaculoLegado(item: typeof espetaculosLegados[number], ordem: number): EspetaculoPublico {
  const slug = slugify(item.title);
  const detalhe = detalhesEspetaculosLegados.find((show) => show.title === item.title);
  const imagens = detalhe?.imgs ?? [];
  return {
    id: `legado:${slug}`,
    slug,
    title: item.title,
    release: item.release,
    opening: detalhe?.opening ?? null,
    local: detalhe?.local ?? null,
    bgColor: detalhe?.bgColor ?? null,
    img: item.img,
    ordem,
    imgs: imagens.map((foto, index) => ({
      id: `legado:${slug}:foto:${index}`,
      descricao: foto.descricao,
      data: foto.data,
      img: foto.img,
      textoAlternativo: foto.descricao || `Fotografia ${index + 1} do espetáculo ${item.title}`,
    })),
    sections: (detalhe?.sections ?? []).map((secao, index) => ({
      id: `legado:${slug}:secao:${index}`,
      titulo: secao.subtitle,
      texto: secao.description,
      ordem: index,
    })),
  };
}

function mapearPremioLegado(item: typeof premiosLegados[number], ordem: number): PremioPublico {
  const slug = slugify(item.title);
  return {
    id: `legado:${slug}:${item.year}`,
    slug,
    title: item.title,
    year: String(item.year),
    evento: item.evento,
    description: item.description,
    img: item.img ?? null,
    ordem,
  };
}

export async function listPublishedIntegrantes(): Promise<IntegrantePublico[]> {
  if (!supabaseEditorialAtivo()) return integrantesLegados.map(mapearIntegranteLegado);
  const items = await prisma.integrante.findMany({
    where: { estado: PUBLICADO },
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    include: { foto: { select: { bucket: true, chave: true, origem: true } } },
  });
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    nome: item.nome,
    image: urlObrigatoriaDaMidia(item.foto, "/padrao2.webp"),
    fichaTecnica: item.fichaTecnica,
    biografia: item.biografia,
    ordem: item.ordem,
    seo: item.seo,
  }));
}

export async function getPublishedIntegrante(slug: string): Promise<IntegrantePublico | null> {
  if (!supabaseEditorialAtivo()) {
    const ordem = integrantesLegados.findIndex((item) => item.id === slug);
    return ordem < 0 ? null : mapearIntegranteLegado(integrantesLegados[ordem], ordem);
  }
  const item = await prisma.integrante.findFirst({
    where: { slug, estado: PUBLICADO },
    include: { foto: { select: { bucket: true, chave: true, origem: true } } },
  });
  if (!item) return null;
  return {
    id: item.id,
    slug: item.slug,
    nome: item.nome,
    image: urlObrigatoriaDaMidia(item.foto, "/padrao2.webp"),
    fichaTecnica: item.fichaTecnica,
    biografia: item.biografia,
    ordem: item.ordem,
    seo: item.seo,
  };
}

function projetarEspetaculo(item: Awaited<ReturnType<typeof prisma.espetaculo.findMany>>[number] & {
  capa: { bucket: string; chave: string; origem: string | null } | null;
  secoes: { id: string; titulo: string; texto: string; ordem: number }[];
  galerias: { fotos: { id: string; midia: MidiaComUrl; ordem: number; legenda: string; textoAlternativo: string; dataEditorial: string | null }[] }[];
}): EspetaculoPublico {
  const fotos = item.galerias.flatMap((galeria) => galeria.fotos).sort((a, b) => a.ordem - b.ordem);
  return {
    id: item.id,
    slug: item.slug,
    title: item.titulo,
    release: item.lancamento,
    opening: item.estreia,
    local: item.localEstreia,
    bgColor: item.corFundo,
    img: urlObrigatoriaDaMidia(item.capa, "/padrao2.webp"),
    ordem: item.ordem,
    imgs: fotos.map((foto) => ({
      id: foto.id,
      descricao: foto.legenda,
      data: foto.dataEditorial ?? "",
      img: urlObrigatoriaDaMidia(foto.midia, "/padrao2.webp"),
      textoAlternativo: foto.textoAlternativo,
    })),
    sections: item.secoes.map((secao) => ({ id: secao.id, titulo: secao.titulo, texto: secao.texto, ordem: secao.ordem })),
    seo: item.seo,
  };
}

const includeEspetaculo = {
  capa: { select: { bucket: true, chave: true, origem: true } },
  secoes: { orderBy: { ordem: "asc" as const } },
  galerias: { include: { fotos: { include: { midia: { select: { bucket: true, chave: true, origem: true } } }, orderBy: { ordem: "asc" as const } } } },
};

export async function listPublishedEspetaculos(): Promise<EspetaculoPublico[]> {
  if (!supabaseEditorialAtivo()) return espetaculosLegados.map(mapearEspetaculoLegado);
  const items = await prisma.espetaculo.findMany({
    where: { estado: PUBLICADO },
    orderBy: [{ ordem: "asc" }, { lancamento: "desc" }],
    include: includeEspetaculo,
  });
  return items.map(projetarEspetaculo);
}

export async function getPublishedEspetaculo(slug: string): Promise<EspetaculoPublico | null> {
  if (!supabaseEditorialAtivo()) {
    const ordem = espetaculosLegados.findIndex((item) => slugify(item.title) === slug);
    return ordem < 0 ? null : mapearEspetaculoLegado(espetaculosLegados[ordem], ordem);
  }
  const item = await prisma.espetaculo.findFirst({ where: { slug, estado: PUBLICADO }, include: includeEspetaculo });
  return item ? projetarEspetaculo(item) : null;
}

function projetarPremio(item: {
  id: string; slug: string; titulo: string; ano: string; evento: string; descricao: string; ordem: number; seo: unknown;
  foto: { bucket: string; chave: string; origem: string | null } | null;
}): PremioPublico {
  return {
    id: item.id,
    slug: item.slug,
    title: item.titulo,
    year: item.ano,
    evento: item.evento,
    description: item.descricao,
    img: urlPublicaDaMidia(item.foto),
    ordem: item.ordem,
    seo: item.seo,
  };
}

const includePremio = { foto: { select: { bucket: true, chave: true, origem: true } } };

export async function listPublishedPremios(): Promise<PremioPublico[]> {
  if (!supabaseEditorialAtivo()) return premiosLegados.map(mapearPremioLegado);
  const items = await prisma.premio.findMany({
    where: { estado: PUBLICADO },
    orderBy: [{ ordem: "asc" }, { ano: "desc" }],
    include: includePremio,
  });
  return items.map(projetarPremio);
}

export async function getPublishedPremio(slug: string, year: string): Promise<PremioPublico | null> {
  if (!supabaseEditorialAtivo()) {
    const ordem = premiosLegados.findIndex((item) => slugify(item.title) === slug && String(item.year) === year);
    return ordem < 0 ? null : mapearPremioLegado(premiosLegados[ordem], ordem);
  }
  const item = await prisma.premio.findFirst({
    where: { slug, ano: year, estado: PUBLICADO },
    include: includePremio,
  });
  return item ? projetarPremio(item) : null;
}

export function listBookListings() {
  if (supabaseEditorialAtivo()) {
    return prisma.$queryRaw<BookListing[]>`
      SELECT "id", "titulo", "autor", "descricao",
        ("imagem" IS NOT NULL) AS "hasImage", "createdAt"
      FROM "Livro"
      WHERE "estado" = 'PUBLICADO'
      ORDER BY "ordem" ASC, "createdAt" DESC, "id" DESC
    `;
  }
  return prisma.$queryRaw<BookListing[]>`
    SELECT "id", "titulo", "autor", "descricao",
      ("imagem" IS NOT NULL) AS "hasImage", "createdAt"
    FROM "Livro"
    ORDER BY "createdAt" DESC
  `;
}

export function listAdminBookListings() {
  return prisma.$queryRaw<BookListing[]>`
    SELECT "id", "titulo", "autor", "descricao",
      ("imagem" IS NOT NULL) AS "hasImage", "createdAt"
    FROM "Livro"
    ORDER BY "createdAt" DESC, "id" DESC
  `;
}

export function listSobreListings(order: "asc" | "desc" = "desc") {
  if (supabaseEditorialAtivo()) {
    return order === "asc"
      ? prisma.$queryRaw<SobreListing[]>`
          SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
          FROM "Sobre" WHERE "estado" = 'PUBLICADO'
          ORDER BY "ordem" ASC, "ano" ASC
        `
      : prisma.$queryRaw<SobreListing[]>`
          SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
          FROM "Sobre" WHERE "estado" = 'PUBLICADO'
          ORDER BY "ordem" ASC, "ano" DESC
        `;
  }
  if (order === "asc") {
    return prisma.$queryRaw<SobreListing[]>`
      SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
      FROM "Sobre"
      ORDER BY "ano" ASC
    `;
  }
  return prisma.$queryRaw<SobreListing[]>`
    SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
    FROM "Sobre"
    ORDER BY "ano" DESC
  `;
}

export function listAdminSobreListings(order: "asc" | "desc" = "desc") {
  return order === "asc"
    ? prisma.$queryRaw<SobreListing[]>`
        SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
        FROM "Sobre" ORDER BY "ano" ASC
      `
    : prisma.$queryRaw<SobreListing[]>`
        SELECT "ano", "descricao", ("imagem" IS NOT NULL) AS "hasImage"
        FROM "Sobre" ORDER BY "ano" DESC
      `;
}

export function listPublicAgenda(): Promise<AgendaListing[]> {
  const select = { id: true, titulo: true, data: true, local: true, createdAt: true, cidade: true } as const;
  return supabaseEditorialAtivo()
    ? prisma.agenda.findMany({ where: { estado: PUBLICADO }, orderBy: [{ ordem: "asc" }, { data: "asc" }, { id: "asc" }], select })
    : prisma.agenda.findMany({ orderBy: [{ data: "asc" }, { id: "asc" }], select });
}

export function listPublicNews(): Promise<NoticiaListing[]> {
  const select = { id: true, titulo: true, conteudo: true, link: true } as const;
  return supabaseEditorialAtivo()
    ? prisma.noticia.findMany({ where: { estado: PUBLICADO }, orderBy: [{ ordem: "asc" }, { createdAt: "desc" }, { id: "desc" }], select })
    : prisma.noticia.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }], select });
}

export function listPublicProjects(): Promise<ProjetoListing[]> {
  const select = { id: true, data: true, descricao: true } as const;
  return supabaseEditorialAtivo()
    ? prisma.projeto.findMany({ where: { estado: PUBLICADO }, orderBy: [{ ordem: "asc" }, { data: "desc" }, { id: "desc" }], select })
    : prisma.projeto.findMany({ orderBy: [{ data: "desc" }, { id: "desc" }], select });
}
