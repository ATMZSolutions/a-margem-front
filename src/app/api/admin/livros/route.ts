import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { listBookListings } from "@/lib/publicContent";
import { decodeImageData, isPositiveInteger, isText, readJsonObject } from "@/lib/adminInput";

export async function GET() {
  const items = await listBookListings();
  return NextResponse.json(items.map(({ hasImage, ...item }) => ({ ...item, imagem: hasImage })));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body || !isText(body.titulo, 300) || !isText(body.autor, 300) || !isText(body.descricao, 10000)) {
    return NextResponse.json({ error: "Invalid book data" }, { status: 400 });
  }

  let imagem: Buffer | undefined;
  let imagemTipo: string | undefined;
  if (body.imageData !== undefined) {
    imagem = decodeImageData(body.imageData, body.imagemTipo) ?? undefined;
    if (!imagem) return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    imagemTipo = body.imagemTipo as string;
  }

  const created = await prisma.book.create({ data: {
    titulo: body.titulo,
    autor: body.autor,
    descricao: body.descricao,
    ...(imagem ? { imagem, imagemTipo } : {}),
  } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await readJsonObject(request);
  if (!body || !isPositiveInteger(body.id)) return NextResponse.json({ error: "Invalid book id" }, { status: 400 });

  const data: { titulo?: string; autor?: string; descricao?: string; imagem?: Buffer; imagemTipo?: string } = {};
  if (body.titulo !== undefined) {
    if (!isText(body.titulo, 300)) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    data.titulo = body.titulo;
  }
  if (body.autor !== undefined) {
    if (!isText(body.autor, 300)) return NextResponse.json({ error: "Invalid author" }, { status: 400 });
    data.autor = body.autor;
  }
  if (body.descricao !== undefined) {
    if (!isText(body.descricao, 10000)) return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    data.descricao = body.descricao;
  }
  if (body.imageData !== undefined) {
    const image = decodeImageData(body.imageData, body.imagemTipo);
    if (!image) return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    data.imagem = image;
    data.imagemTipo = body.imagemTipo as string;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const updated = await prisma.book.update({ where: { id: body.id }, data });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const numericId = id && /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid book id" }, { status: 400 });
  }
  await prisma.book.delete({ where: { id: numericId } });
  return NextResponse.json({ ok: true });
}
