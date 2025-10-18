import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  context: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = await context.params; // ✅ mantido o await como pediu

    let record: { imagem: Uint8Array | null; imagemTipo: string | null } | null = null;

    if (type === "livro") {
      record = await prisma.book.findUnique({
        where: { id: parseInt(id, 10) },
        select: { imagem: true, imagemTipo: true },
      });
    } else if (type === "sobre") {
      record = await prisma.sobre.findUnique({
        where: { ano: parseInt(id, 10) },
        select: { imagem: true, imagemTipo: true },
      });
    } else {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    if (!record?.imagem) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
    }

    // ✅ cria stream a partir do Uint8Array
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(record!.imagem);
        controller.close();
      },
    });

    // ✅ resposta otimizada e sem cache
    return new NextResponse(stream, {
      headers: {
        "Content-Type": record.imagemTipo || "image/jpeg",
        "Cache-Control": "public, max-age=120, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    console.error("Erro ao servir imagem:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
