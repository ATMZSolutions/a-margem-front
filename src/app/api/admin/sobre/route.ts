import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const items = await prisma.sobre.findMany({ orderBy: { ano: 'desc' } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const created = await prisma.sobre.create({ data: body });
  return NextResponse.json(created);
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.ano) return NextResponse.json({ error: 'Missing "ano"' }, { status: 400 });
  const updated = await prisma.sobre.update({ where: { ano: body.ano }, data: body });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get('ano');
  if (!ano) return NextResponse.json({ error: 'Missing "ano"' }, { status: 400 });
  const deleted = await prisma.sobre.delete({ where: { ano: Number(ano) } });
  return NextResponse.json(deleted);
}
