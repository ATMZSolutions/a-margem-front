import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await params;

    let imageData;
    let imagemTipo;

    switch (type) {
      case 'livro':
        const livro = await prisma.book.findUnique({
          where: { id: parseInt(id) },
          select: { imagem: true, imagemTipo: true }
        });
        imageData = livro?.imagem;
        imagemTipo = livro?.imagemTipo;
        break;

      case 'sobre':
        const sobre = await prisma.sobre.findUnique({
          where: { ano: parseInt(id) },
          select: { imagem: true, imagemTipo: true }
        });
        imageData = sobre?.imagem;
        imagemTipo = sobre?.imagemTipo;
        break;

      default:
        return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    if (!imageData || !imagemTipo) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Converter para Uint8Array que é aceito pelo NextResponse
    const uint8Array = new Uint8Array(imageData);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': imagemTipo,
        'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}