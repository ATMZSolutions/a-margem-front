import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type ImageMime = "image/jpeg" | "image/png" | "image/webp";

function verifiedMime(bytes: Uint8Array): ImageMime | null {
  let detected: ImageMime | null = null;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    detected = "image/jpeg";
  } else if (
    bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e
    && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a
    && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    detected = "image/png";
  } else if (
    bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    detected = "image/webp";
  }
  return detected;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const { type, id } = await context.params;
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
    }

    let record: { imagem: Uint8Array | null } | null = null;
    if (type === "livro") {
      record = await prisma.book.findUnique({ where: { id: numericId }, select: { imagem: true } });
    } else if (type === "sobre") {
      record = await prisma.sobre.findUnique({ where: { ano: numericId }, select: { imagem: true } });
    } else {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }

    if (!record?.imagem) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    const mimeType = verifiedMime(record.imagem);
    if (!mimeType) return NextResponse.json({ error: "Unsupported or invalid image" }, { status: 415 });

    const imageStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(record!.imagem!));
        controller.close();
      },
    });
    return new NextResponse(imageStream, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(record.imagem.byteLength),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image service unavailable" }, { status: 500 });
  }
}
