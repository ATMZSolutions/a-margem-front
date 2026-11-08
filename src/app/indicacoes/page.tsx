import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listBookListings } from "@/lib/publicContent";
import { getPageMetadata, isPublicSitePage } from "@/lib/siteMetadata";
import IndicacoesClient from "./IndicacoesClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> { return getPageMetadata("/indicacoes", "Livros recomendados", "Livros e leituras recomendadas pelo Coletivo À Margem."); }

export default async function IndicacoesPage() {
  if (!await isPublicSitePage("/indicacoes")) notFound();
  const books = await listBookListings();
  const initialBooks = books.map((book) => ({
    id: book.id,
    titulo: book.titulo,
    autor: book.autor,
    descricao: book.descricao,
    imageUrl: book.hasImage ? `/api/image/livro/${book.id}` : null,
    createdAt: book.createdAt.toISOString(),
  }));
  return <IndicacoesClient initialBooks={initialBooks} />;
}
