import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPublicHistory } from "@/lib/siteContent";
import { getPageMetadata, isPublicSitePage } from "@/lib/siteMetadata";
import SobreClient from "./SobreClient";
import type { Sobre } from "./SobreClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> { return getPageMetadata("/sobre", "Sobre o Coletivo À Margem", "Conheça a história, as ações e a trajetória do Coletivo À Margem, no Recife."); }

export default async function SobrePage() {
  if (!await isPublicSitePage("/sobre")) notFound();
  const items = await listPublicHistory();
  const initialData: Sobre[] = items.map((item) => ({
    ano: item.ano,
    descricao: item.descricao,
    imageUrl: item.imageUrl,
  }));
  return <SobreClient initialData={initialData} />;
}
