import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const items = await prisma.noticia.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.noticia.create({ data: body });
  return NextResponse.json(created);
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updated = await prisma.noticia.update({ where: { id: body.id }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const deleted = await prisma.noticia.delete({ where: { id: Number(id) } });
  return NextResponse.json(deleted);
}
