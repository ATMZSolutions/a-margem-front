import { getPublicContactPageSettings, getPublicSiteIdentity, listPublicContacts } from "@/lib/siteContent";
import { getPageMetadata, isPublicSitePage } from "@/lib/siteMetadata";
import ContatoPageClient from "./ContatoPageClient";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [pagina, identidade] = await Promise.all([getPublicContactPageSettings(), getPublicSiteIdentity()]);
  return getPageMetadata("/contato", pagina.titulo, identidade.descricaoPadrao);
}

export default async function ContatoPage() {
  if (!await isPublicSitePage("/contato")) notFound();
  const [pagina, contatos] = await Promise.all([getPublicContactPageSettings(), listPublicContacts()]);
  return <ContatoPageClient pagina={pagina} contatos={contatos} />;
}
