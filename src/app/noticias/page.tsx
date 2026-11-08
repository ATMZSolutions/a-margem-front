import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPublicNews } from "@/lib/publicContent";
import { getPageMetadata, isPublicSitePage } from "@/lib/siteMetadata";
import NoticiasClient from "./NoticiasClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> { return getPageMetadata("/noticias", "Notícias", "Novidades, publicações e notícias do Coletivo À Margem, grupo de teatro hip-hop de Pernambuco."); }

export default async function NoticiasPage() {
  if (!await isPublicSitePage("/noticias")) notFound();
  const items = await listPublicNews();
  return <NoticiasClient items={items} />;
}
