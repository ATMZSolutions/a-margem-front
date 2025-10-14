import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const items = await prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  
  // Se há dados de imagem, converter de array para Buffer
  if (body.imageData) {
    body.imagem = Buffer.from(body.imageData);
    delete body.imageData;
  }
  
  const created = await prisma.book.create({ data: body });
  return NextResponse.json(created);
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  
  // Se há dados de imagem, converter de array para Buffer
  if (body.imageData) {
    body.imagem = Buffer.from(body.imageData);
    delete body.imageData;
  }
  
  const updated = await prisma.book.update({ where: { id: body.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const deleted = await prisma.book.delete({ where: { id: Number(id) } });
  return NextResponse.json(deleted);
}