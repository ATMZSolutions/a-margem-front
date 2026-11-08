import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import prisma from "@/lib/prisma";
import { authorizeAdminRequest } from "@/lib/adminRequest";
import { decodeImageData, isText, readJsonObject } from "@/lib/adminInput";
import { getRuntimeStorage } from "@/lib/storageRuntime";
import { urlPublicaDaMidia } from "@/lib/publicContent";
import { supabaseEditorialAtivo } from "@/lib/editorialConfig";

const EXTENSAO_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function GET(request: Request) {
  const denied = await authorizeAdminRequest(request);
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const items = await prisma.midia.findMany({
    orderBy: [{ criadoEm: "desc" }, { id: "asc" }],
    select: { id: true, bucket: true, chave: true, mime: true, bytes: true, nomeOriginal: true, origem: true },
  });
  return NextResponse.json(items.map((item) => ({
    id: item.id,
    url: urlPublicaDaMidia(item) ?? "/padrao2.webp",
    mime: item.mime,
    bytes: item.bytes,
    nomeOriginal: item.nomeOriginal,
  })));
}

export async function POST(request: Request) {
  const denied = await authorizeAdminRequest(request, { write: true, json: true });
  if (denied) return denied;
  if (!supabaseEditorialAtivo()) return NextResponse.json({ error: "Módulo editorial desativado neste ambiente" }, { status: 503 });
  const body = await readJsonObject(request);
  if (!body || !isText(body.imageData, 7_100_000) || !isText(body.imagemTipo, 50)) {
    return NextResponse.json({ error: "Dados de imagem inválidos" }, { status: 400 });
  }
  const payload = decodeImageData(body.imageData, body.imagemTipo);
  const extensao = EXTENSAO_POR_MIME[body.imagemTipo];
  const runtime = getRuntimeStorage();
  if (!payload || !extensao || !runtime) {
    return NextResponse.json({ error: "Storage ou formato de imagem indisponível" }, { status: 503 });
  }

  try {
    const metadata = await sharp(payload, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
      return NextResponse.json({ error: "Imagem inválida" }, { status: 415 });
    }

    await runtime.storage.conferirOuCriarBucket(runtime.bucketConfig, { allowCreate: false });
    const sha256 = createHash("sha256").update(payload).digest("hex");
    const chave = `originais/${sha256}.${extensao}`;
    const objeto = {
      bucket: runtime.bucketConfig.bucket,
      chave,
      sha256,
      mime: body.imagemTipo,
      bytes: payload.length,
      payload,
    };
    await runtime.storage.enviarEVerificar(objeto);

    const existente = await prisma.midia.findUnique({ where: { bucket_chave: { bucket: objeto.bucket, chave } } });
    if (existente) {
      if (existente.sha256 !== sha256) return NextResponse.json({ error: "Conflito de hash da mídia" }, { status: 409 });
      return NextResponse.json({ id: existente.id, url: urlPublicaDaMidia(existente), mime: existente.mime, bytes: existente.bytes });
    }

    const nomeOriginal = typeof body.nomeOriginal === "string" ? body.nomeOriginal.trim().slice(0, 255) : "";
    const criada = await prisma.midia.create({
      data: {
        bucket: objeto.bucket,
        chave,
        sha256,
        mime: objeto.mime,
        bytes: objeto.bytes,
        largura: metadata.width,
        altura: metadata.height,
        nomeOriginal: nomeOriginal || null,
        origem: "upload-admin",
      },
    });
    return NextResponse.json({ id: criada.id, url: urlPublicaDaMidia(criada), mime: criada.mime, bytes: criada.bytes }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Não foi possível armazenar a imagem" }, { status: 502 });
  }
}
