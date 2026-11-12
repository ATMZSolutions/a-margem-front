import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  autorizar: vi.fn(),
  listar: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(),
  excluir: vi.fn(),
}));

vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/publicContent", () => ({ listAdminSobreListings: mocks.listar }));
vi.mock("@/lib/prisma", () => ({ default: { sobre: {
  create: mocks.criar, update: mocks.atualizar, delete: mocks.excluir,
} } }));

import { DELETE, GET, POST, PUT } from "./route";

const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString("base64");

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/sobre") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: { origin: "https://amargem.test", ...(metodo === "POST" || metodo === "PUT" ? { "content-type": "application/json" } : {}) },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa de Sobre", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.listar.mockResolvedValue([{ ano: 2025, descricao: "História", hasImage: false }]);
    mocks.criar.mockResolvedValue({ ano: 2026 });
    mocks.atualizar.mockResolvedValue({ ano: 2025 });
    mocks.excluir.mockResolvedValue({ ano: 2025 });
  });

  it("lista registros traduzindo o indicador interno de imagem", async () => {
    const resposta = await GET(requisicao("GET"));
    expect(await resposta.json()).toEqual([{ ano: 2025, descricao: "História", imagem: false }]);
  });

  it("cria registro com imagem opcional e recusa ano ou descrição inválidos", async () => {
    const corpo = { ano: 2026, descricao: "Memória do coletivo" };
    expect((await POST(requisicao("POST", corpo))).status).toBe(201);
    expect(mocks.criar).toHaveBeenCalledWith({ data: corpo, select: { ano: true } });

    expect((await POST(requisicao("POST", { ...corpo, imageData: jpegBase64, imagemTipo: "image/jpeg" }))).status).toBe(201);
    expect(mocks.criar).toHaveBeenLastCalledWith({ data: expect.objectContaining({
      ...corpo,
      imagem: expect.any(Uint8Array),
      imagemTipo: "image/jpeg",
    }), select: { ano: true } });
    const imagemCriada = mocks.criar.mock.calls.at(-1)?.[0].data.imagem as Uint8Array;
    expect(Array.from(imagemCriada)).toEqual([0xff, 0xd8, 0xff, 0x00]);
    expect((await POST(requisicao("POST", { ...corpo, ano: 0 }))).status).toBe(400);
    expect((await POST(requisicao("POST", { ...corpo, descricao: "" }))).status).toBe(400);
    expect((await POST(requisicao("POST", { ...corpo, imageData: "inválida", imagemTipo: "image/jpeg" }))).status).toBe(400);
  });

  it("atualiza descrição e imagem e valida identificador e payload", async () => {
    expect((await PUT(requisicao("PUT", { ano: 2025, descricao: "Texto atualizado" }))).status).toBe(200);
    expect(mocks.atualizar).toHaveBeenCalledWith({
      where: { ano: 2025 },
      data: { descricao: "Texto atualizado" },
      select: { ano: true },
    });
    expect((await PUT(requisicao("PUT", { ano: 2025, imageData: jpegBase64, imagemTipo: "image/jpeg" }))).status).toBe(200);

    for (const corpo of [
      {},
      { ano: 2025, descricao: " " },
      { ano: 2025, imageData: "inválida", imagemTipo: "image/jpeg" },
      { ano: 2025 },
      { ano: -1 },
    ]) {
      expect((await PUT(requisicao("PUT", corpo))).status).toBe(400);
    }
  });

  it("exclui registro por ano válido e recusa anos fora do limite", async () => {
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/sobre?ano=2025"))).status).toBe(200);
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/sobre?ano=1799"))).status).toBe(400);
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/sobre?ano=22a5"))).status).toBe(400);
  });

  it("devolve a negativa de autorização em todos os métodos sem tocar nos dados", async () => {
    for (const [metodo, handler] of [["GET", GET], ["POST", POST], ["PUT", PUT], ["DELETE", DELETE]] as const) {
      mocks.autorizar.mockResolvedValueOnce(new Response(null, { status: 401 }));
      expect((await handler(requisicao(metodo, metodo === "POST" || metodo === "PUT" ? {} : undefined))).status).toBe(401);
    }
    expect(mocks.criar).not.toHaveBeenCalled();
    expect(mocks.atualizar).not.toHaveBeenCalled();
    expect(mocks.excluir).not.toHaveBeenCalled();
  });

  it("recusa exclusão sem identificador", async () => {
    expect((await DELETE(requisicao("DELETE"))).status).toBe(400);
    expect(mocks.excluir).not.toHaveBeenCalled();
  });
});
