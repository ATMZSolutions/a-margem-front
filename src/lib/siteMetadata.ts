import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";
import { getPublicSiteIdentity } from "@/lib/siteContent";

export type SeoOverrides = { titulo?: string; descricao?: string; imagemUrl?: string } | null | undefined;

function parseSeo(value: unknown): SeoOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const seo = value as Record<string, unknown>;
  return {
    ...(typeof seo.titulo === "string" && seo.titulo.trim() ? { titulo: seo.titulo.trim() } : {}),
    ...(typeof seo.descricao === "string" && seo.descricao.trim() ? { descricao: seo.descricao.trim() } : {}),
    ...(typeof seo.imagemUrl === "string" && seo.imagemUrl.trim() ? { imagemUrl: seo.imagemUrl.trim() } : {}),
  };
}

function urlImagem(value: string | undefined, dominio: string, fallback: string): string {
  if (!value) return fallback;
  try { return new URL(value, dominio).toString(); } catch { return fallback; }
}

function juntarUrl(dominio: string, caminho: string): string {
  return new URL(caminho.replace(/^\/+/, ""), `${dominio.replace(/\/+$/, "")}/`).toString();
}

function templateFor(path: string): string {
  if (/^\/coletivo\/integrante\/[^/]+$/.test(path)) return "/coletivo/integrante/[nome]";
  if (/^\/espetaculos\/[^/]+$/.test(path)) return "/espetaculos/[title]";
  if (/^\/premios\/[^/]+\/[^/]+$/.test(path)) return "/premios/[title]/[year]";
  return path;
}

async function metadata(path: string, title: string, description: string, overrides?: unknown): Promise<Metadata> {
  const [identity, configured] = await Promise.all([
    getPublicSiteIdentity(),
    supabaseEditorialAtivo() ? prisma.paginaSite.findUnique({ where: { caminho: templateFor(path) }, select: { seo: true } }) : Promise.resolve(null),
  ]);
  const seo = parseSeo(overrides) ?? parseSeo(configured?.seo);
  const finalTitle = seo?.titulo ?? title;
  const finalDescription = seo?.descricao ?? description;
  const fallbackImage = identity.imagemSocial.url ?? "/amargem-logo-insta.webp";
  const image = urlImagem(seo?.imagemUrl, identity.dominio, urlImagem(fallbackImage, identity.dominio, "/amargem-logo-insta.webp"));
  const pageUrl = juntarUrl(identity.dominio, path);
  return {
    metadataBase: new URL(identity.dominio),
    title: finalTitle,
    description: finalDescription,
    alternates: { canonical: path },
    openGraph: { title: finalTitle, description: finalDescription, url: pageUrl, siteName: identity.nomePublico, locale: "pt_BR", type: "website", images: [{ url: image, alt: finalTitle }] },
    twitter: { card: "summary_large_image", title: finalTitle, description: finalDescription, images: [image] },
  };
}

export function getPageMetadata(path: string, title: string, description: string): Promise<Metadata> {
  return metadata(path, title, description);
}

export function getEntityMetadata(path: string, title: string, description: string, overrides?: unknown): Promise<Metadata> {
  return metadata(path, title, description, overrides);
}

export async function isPublicSitePage(path: string): Promise<boolean> {
  if (!supabaseEditorialAtivo()) return true;
  const page = await prisma.paginaSite.findUnique({ where: { caminho: templateFor(path) }, select: { estado: true } });
  return !page || page.estado === "PUBLICADO";
}
