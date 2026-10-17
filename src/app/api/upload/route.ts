import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 64 * 1024;

function detectImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Cross-origin upload rejected" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "File exceeds the 5 MiB limit" }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const value = formData.get("file");
    if (!(value instanceof File) || value.size === 0) {
      return NextResponse.json({ error: "No image file was uploaded" }, { status: 400 });
    }
    if (value.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File exceeds the 5 MiB limit" }, { status: 413 });
    }

    const bytes = new Uint8Array(await value.arrayBuffer());
    const declaredBytesType = detectImageType(bytes);
    if (!declaredBytesType) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are accepted" }, { status: 415 });
    }

    const metadata = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
    if (
      !metadata.width || !metadata.height
      || !["jpeg", "png", "webp"].includes(metadata.format || "")
      || (metadata.format === "jpeg" && declaredBytesType !== "image/jpeg")
      || (metadata.format === "png" && declaredBytesType !== "image/png")
      || (metadata.format === "webp" && declaredBytesType !== "image/webp")
    ) {
      return NextResponse.json({ error: "Invalid or unsupported image" }, { status: 415 });
    }

    const optimized = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate()
      .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    if (optimized.length > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Optimized image exceeds the 5 MiB limit" }, { status: 413 });
    }

    return NextResponse.json({
      imageData: optimized.toString("base64"),
      imagemTipo: "image/webp",
    });
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
}
