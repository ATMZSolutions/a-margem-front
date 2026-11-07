import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import ProjetosClient from "./ProjetosClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projetos e trajetória",
  description: "Conheça as ações educacionais, oficinas e projetos culturais do Coletivo À Margem.",
  alternates: { canonical: "/projetos" },
  openGraph: { title: "Projetos | Coletivo À Margem", description: "Ações culturais e trajetória do coletivo.", url: "https://www.amargem.com.br/projetos" },
};

export default async function ProjetosPage() {
  const items = await prisma.projeto.findMany({ orderBy: { data: "desc" } });
  return <ProjetosClient initialData={items.map((item) => ({ ...item, data: item.data.toISOString() }))} />;
}
