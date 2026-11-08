import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { listAdminSobreListings } from "@/lib/publicContent";
import { decodeImageData, isPositiveInteger, isText, readJsonObject } from "@/lib/adminInput";
import { authorizeAdminRequest } from "@/lib/adminRequest";

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  const items = await listAdminSobreListings();
  return NextResponse.json(items.map(({ hasImage, ...item }) => ({ ...item, imagem: hasImage })));
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  const body = await readJsonObject(request);
  if (!body || !isPositiveInteger(body.ano) || !isText(body.descricao, 10000)) {
    return NextResponse.json({ error: "Invalid history data" }, { status: 400 });
  }

  let imagem: Buffer | undefined;
  let imagemTipo: string | undefined;
  if (body.imageData !== undefined) {
    imagem = decodeImageData(body.imageData, body.imagemTipo) ?? undefined;
    if (!imagem) return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    imagemTipo = body.imagemTipo as string;
  }
  const created = await prisma.sobre.create({ data: {
    ano: body.ano,
    descricao: body.descricao,
    ...(imagem ? { imagem: Uint8Array.from(imagem), imagemTipo } : {}),
  }, select: { ano: true } });
  return NextResponse.json({ ano: created.ano }, { status: 201 });
}

export async function PUT(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  const body = await readJsonObject(request);
  if (!body || !isPositiveInteger(body.ano)) return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  const data: { descricao?: string; imagem?: Uint8Array<ArrayBuffer>; imagemTipo?: string } = {};
  if (body.descricao !== undefined) {
    if (!isText(body.descricao, 10000)) return NextResponse.json({ error: "Invalid description" }, { status: 400 });
    data.descricao = body.descricao;
  }
  if (body.imageData !== undefined) {
    const image = decodeImageData(body.imageData, body.imagemTipo);
    if (!image) return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    data.imagem = Uint8Array.from(image);
    data.imagemTipo = body.imagemTipo as string;
  }
  if (!Object.keys(data).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  const updated = await prisma.sobre.update({ where: { ano: body.ano }, data, select: { ano: true } });
  return NextResponse.json({ ano: updated.ano });
}

export async function DELETE(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true });
  if (denied) return denied;
  const year = new URL(request.url).searchParams.get("ano");
  const numericYear = year && /^\d{4}$/.test(year) ? Number(year) : NaN;
  if (!Number.isInteger(numericYear) || numericYear < 1800 || numericYear > 2200) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }
  await prisma.sobre.delete({ where: { ano: numericYear } });
  return NextResponse.json({ ok: true });
}
