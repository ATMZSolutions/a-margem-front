import { NextResponse } from "next/server";
import { listBookListings } from "@/lib/publicContent";

export async function GET() {
  const books = await listBookListings();
  return NextResponse.json(books.map((book) => ({
    id: book.id,
    titulo: book.titulo,
    autor: book.autor,
    descricao: book.descricao,
    createdAt: book.createdAt,
    imageUrl: book.hasImage ? `/api/image/livro/${book.id}` : null,
  })));
}
