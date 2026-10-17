import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isPositiveInteger, isText, readJsonObject } from "@/lib/adminInput";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const items = await prisma.agenda.findMany({ orderBy: { data: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const date = body && parseDate(body.data);
  if (!body || !date || !isText(body.titulo, 300) || !isText(body.local, 300) || !isText(body.cidade, 200)) {
    return NextResponse.json({ error: "Invalid agenda data" }, { status: 400 });
  }
  const created = await prisma.agenda.create({ data: {
    titulo: body.titulo,
    data: date,
    local: body.local,
    cidade: body.cidade,
  } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await readJsonObject(request);
  if (!body || !isPositiveInteger(body.id)) return NextResponse.json({ error: "Invalid agenda id" }, { status: 400 });
  const data: { titulo?: string; data?: Date; local?: string; cidade?: string } = {};
  if (body.titulo !== undefined) {
    if (!isText(body.titulo, 300)) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    data.titulo = body.titulo;
  }
  if (body.data !== undefined) {
    const date = parseDate(body.data);
    if (!date) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.data = date;
  }
  if (body.local !== undefined) {
    if (!isText(body.local, 300)) return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    data.local = body.local;
  }
  if (body.cidade !== undefined) {
    if (!isText(body.cidade, 200)) return NextResponse.json({ error: "Invalid city" }, { status: 400 });
    data.cidade = body.cidade;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  const updated = await prisma.agenda.update({ where: { id: body.id }, data });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const numericId = id && /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid agenda id" }, { status: 400 });
  }
  await prisma.agenda.delete({ where: { id: numericId } });
  return NextResponse.json({ ok: true });
}
