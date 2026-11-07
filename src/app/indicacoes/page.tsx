import type { Metadata } from "next";
import { listBookListings } from "@/lib/publicContent";
import IndicacoesClient from "./IndicacoesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Livros recomendados",
  description: "Livros e leituras recomendadas pelo Coletivo À Margem.",
  alternates: { canonical: "/indicacoes" },
  openGraph: { title: "Biblioteca | Coletivo À Margem", description: "Leituras recomendadas pelo coletivo.", url: "https://www.amargem.com.br/indicacoes" },
};

export default async function IndicacoesPage() {
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
