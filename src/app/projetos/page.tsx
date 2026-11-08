import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPublicProjects } from "@/lib/publicContent";
import { getPageMetadata, isPublicSitePage } from "@/lib/siteMetadata";
import { getPublicProjectPageSettings, listPublicProjectPhotos } from "@/lib/siteContent";
import ProjetosClient from "./ProjetosClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> { return getPageMetadata("/projetos", "Projetos e trajetória", "Conheça as ações educacionais, oficinas e projetos culturais do Coletivo À Margem."); }

export default async function ProjetosPage() {
  if (!await isPublicSitePage("/projetos")) notFound();
  const [items, pagina, fotos] = await Promise.all([
    listPublicProjects(),
    getPublicProjectPageSettings(),
    listPublicProjectPhotos(),
  ]);
  return <ProjetosClient
    initialData={items.map((item) => ({ ...item, data: item.data.toISOString() }))}
    pagina={pagina}
    fotos={fotos}
  />;
}
