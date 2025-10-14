import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const sobres = await prisma.sobre.findMany({ 
    orderBy: { ano: 'desc' }
  });

  // Adicionar URL da imagem para cada item que tem imagem, mas não expor o blob
  const sobresWithImageUrls = sobres.map(sobre => ({
    ano: sobre.ano,
    descricao: sobre.descricao,
    imageUrl: sobre.imagem ? `/api/image/sobre/${sobre.ano}` : null
  }));

  return NextResponse.json(sobresWithImageUrls);
}