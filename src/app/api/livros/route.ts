import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const livros = await prisma.book.findMany({ 
    orderBy: { createdAt: 'desc' }
  });

  // Adicionar URL da imagem para cada livro que tem imagem, mas não expor o blob
  const livrosWithImageUrls = livros.map(livro => ({
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    descricao: livro.descricao,
    createdAt: livro.createdAt,
    imageUrl: livro.imagem ? `/api/image/livro/${livro.id}` : null
  }));

  return NextResponse.json(livrosWithImageUrls);
}