import type { Metadata } from "next";
import { listSobreListings } from "@/lib/publicContent";
import SobreClient from "./SobreClient";
import type { Sobre } from "./SobreClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sobre o Coletivo À Margem",
  description: "Conheça a história, as ações e a trajetória do Coletivo À Margem, no Recife.",
  alternates: { canonical: "/sobre" },
  openGraph: { title: "Sobre | Coletivo À Margem", description: "História e trajetória do coletivo.", url: "https://www.amargem.com.br/sobre" },
};

export default async function SobrePage() {
  const items = await listSobreListings("asc");
  const initialData: Sobre[] = items.map((item) => ({
    ano: item.ano,
    descricao: item.descricao,
    imageUrl: item.hasImage ? `/api/image/sobre/${item.ano}` : null,
  }));
  return <SobreClient initialData={initialData} />;
}
