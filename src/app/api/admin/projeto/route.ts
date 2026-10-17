import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isPositiveInteger, isText, readJsonObject } from "@/lib/adminInput";

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length > 40) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const items = await prisma.projeto.findMany({ orderBy: { data: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  const date = body && parseDate(body.data);
  if (!body || !date || !isText(body.descricao, 10000)) {
    return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
  }
  const created = await prisma.projeto.create({ data: { data: date, descricao: body.descricao } });
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await readJsonObject(request);
  if (!body || !isPositiveInteger(body.id)) return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  const data: { data?: Date; descricao?: string } = {};
  if (body.data !== undefined) {
    const date = parseDate(body.data);
    if (!date) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    data.data = date;
  }
  if (body.descricao !== undefined) {
    if (!isText(body.descricao, 10000)) return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    data.descricao = body.descricao;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  const updated = await prisma.projeto.update({ where: { id: body.id }, data });
  return NextResponse.json({ id: updated.id });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const numericId = id && /^\d+$/.test(id) ? Number(id) : NaN;
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  await prisma.projeto.delete({ where: { id: numericId } });
  return NextResponse.json({ ok: true });
}
