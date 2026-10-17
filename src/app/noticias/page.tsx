import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import NoticiasClient from "./NoticiasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notícias",
  description: "Novidades, publicações e notícias do Coletivo À Margem, grupo de teatro hip-hop de Pernambuco.",
  alternates: { canonical: "/noticias" },
  openGraph: { title: "Notícias | Coletivo À Margem", description: "Acompanhe as novidades do coletivo.", url: "https://www.amargem.com.br/noticias" },
};

export default async function NoticiasPage() {
  const items = await prisma.noticia.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, titulo: true, conteudo: true, link: true },
  });
  return <NoticiasClient items={items} />;
}
