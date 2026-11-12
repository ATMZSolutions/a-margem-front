import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";

const { autorizar } = vi.hoisted(() => ({ autorizar: vi.fn() }));
vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: autorizar }));

vi.mock("sharp", async (importOriginal) => {
  const original = (await importOriginal<typeof import("sharp")>()).default;
  return { default: vi.fn((...args: Parameters<typeof original>) => original(...args)) };
});

import { POST } from "./route";

async function criarImagemPng() {
  return sharp({ create: { width: 2, height: 2, channels: 3, background: "#412551" } }).png().toBuffer();
}

function criarRequisicao(arquivo?: File, cabecalhos: Record<string, string> = {}) {
  const formulario = new FormData();
  if (arquivo) formulario.set("file", arquivo);
  return new NextRequest("https://amargem.test/api/upload", {
    method: "POST",
    headers: { origin: "https://amargem.test", ...cabecalhos },
    body: formulario,
  });
}

describe("upload administrativo", () => {
  beforeEach(() => {
    autorizar.mockResolvedValue(null);
    vi.mocked(sharp).mockClear();
  });

  it("retorna a resposta de autorização antes de ler o formulário", async () => {
    const negada = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    autorizar.mockResolvedValue(negada);
    const resposta = await POST(criarRequisicao());
    expect(resposta.status).toBe(401);
    expect(autorizar).toHaveBeenCalledWith(expect.any(NextRequest), { write: true });
  });

  it("rejeita requisição maior que o limite antes de interpretar o formulário", async () => {
    const resposta = await POST(criarRequisicao(undefined, { "content-length": String(5 * 1024 * 1024 + 64 * 1024 + 1) }));
    expect(resposta.status).toBe(413);
  });

  it("rejeita formulário sem arquivo, arquivo vazio ou arquivo acima do limite", async () => {
    expect((await POST(criarRequisicao())).status).toBe(400);
    expect((await POST(criarRequisicao(new File([], "vazio.png")))).status).toBe(400);
    expect((await POST(criarRequisicao(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "grande.png")))).status).toBe(413);
  });

  it("recusa conteúdo que não tenha assinatura de imagem suportada", async () => {
    const arquivo = new File(["não é uma imagem"], "foto.png", { type: "image/png" });
    const resposta = await POST(criarRequisicao(arquivo));
    expect(resposta.status).toBe(415);
    expect(await resposta.json()).toEqual({ error: "Only JPEG, PNG, or WebP images are accepted" });
  });

  it("converte imagem válida para WebP e devolve os dados para gravação", async () => {
    const arquivo = new File([await criarImagemPng()], "foto.png", { type: "image/png" });
    const resposta = await POST(criarRequisicao(arquivo));
    const dados = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(dados.imagemTipo).toBe("image/webp");
    expect(Buffer.from(dados.imageData, "base64").subarray(0, 4).toString()).toBe("RIFF");
  });

  it("retorna erro para bytes com assinatura reconhecida mas imagem corrompida", async () => {
    const pngCorrompido = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "corrompido.png");
    const resposta = await POST(criarRequisicao(pngCorrompido));
    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ error: "Invalid upload" });
  });

  it("converte imagens JPEG e WebP válidas", async () => {
    const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#412551" } }).jpeg().toBuffer();
    const webp = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#412551" } }).webp().toBuffer();
    expect((await POST(criarRequisicao(new File([jpeg], "a.jpg")))).status).toBe(200);
    expect((await POST(criarRequisicao(new File([webp], "a.webp")))).status).toBe(200);
  });

  it("recusa assinaturas truncadas", async () => {
    for (const bytes of [[0xff, 0xd8], [0x89, 0x50, 0x4e, 0x47, 0x0d], [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45]]) {
      expect((await POST(criarRequisicao(new File([new Uint8Array(bytes)], "x")))).status).toBe(415);
    }
  });

  const assinaturas = {
    jpeg: [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0],
  };

  it.each([
    ["sem largura", assinaturas.png, { width: 0, height: 1, format: "png" }],
    ["sem altura", assinaturas.png, { width: 1, height: 0, format: "png" }],
    ["formato não suportado", assinaturas.png, { width: 1, height: 1, format: "gif" }],
    ["formato ausente", assinaturas.png, { width: 1, height: 1 }],
    ["jpeg com assinatura png", assinaturas.png, { width: 1, height: 1, format: "jpeg" }],
    ["png com assinatura jpeg", assinaturas.jpeg, { width: 1, height: 1, format: "png" }],
    ["webp com assinatura png", assinaturas.png, { width: 1, height: 1, format: "webp" }],
  ])("recusa metadados inconsistentes: %s", async (_nome, bytes, metadados) => {
    vi.mocked(sharp).mockImplementationOnce((() => ({ metadata: async () => metadados })) as unknown as typeof sharp);
    const resposta = await POST(criarRequisicao(new File([new Uint8Array(bytes)], "x")));
    expect(resposta.status).toBe(415);
    expect(await resposta.json()).toEqual({ error: "Invalid or unsupported image" });
  });

  it("recusa imagem otimizada acima do limite", async () => {
    vi.mocked(sharp)
      .mockImplementationOnce((() => ({ metadata: async () => ({ width: 1, height: 1, format: "png" }) })) as unknown as typeof sharp)
      .mockImplementationOnce((() => {
        const cadeia: Record<string, unknown> = {};
        for (const nome of ["rotate", "resize", "webp"]) cadeia[nome] = () => cadeia;
        cadeia.toBuffer = async () => Buffer.alloc(5 * 1024 * 1024 + 1);
        return cadeia;
      }) as unknown as typeof sharp);
    const resposta = await POST(criarRequisicao(new File([new Uint8Array(assinaturas.png)], "x")));
    expect(resposta.status).toBe(413);
    expect(await resposta.json()).toEqual({ error: "Optimized image exceeds the 5 MiB limit" });
  });
});
