import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isPositiveInteger, isText, readJsonObject } from "@/lib/adminInput";

function validLink(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  const items = await prisma.noticia.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  if (!body || !isText(body.titulo, 300) || !isText(body.conteudo, 20000) || !validLink(body.link)) {
    return NextResponse.json({ error: "Invalid news data" }, { status: 400 });
  }
  const created = await prisma.noticia.create({
    data: { titulo: body.titulo, conteudo: body.conteudo, link: body.link },
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await readJsonObject(request);
  if (!body || !isPositiveInteger(body.id)) return NextResponse.json({ error: "Invalid news id" }, { status: 400 });
  const data: { titulo?: string; conteudo?: string; link?: string } = {};
  if (body.titulo !== undefined) {
    if (!isText(body.titulo, 300)) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    data.titulo = body.titulo;
  }
  if (body.conteudo !== undefined) {
    if (!isText(body.conteudo, 20000)) return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    data.conteudo = body.conteudo;
  }
  if (body.link !== undefined) {
    if (!validLink(body.link)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    data.link = body.link;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  const updated = await prisma.noticia.update({ where: { id: body.id }, data });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const numericId = id && /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid news id" }, { status: 400 });
  }
  await prisma.noticia.delete({ where: { id: numericId } });
  return NextResponse.json({ ok: true });
}
