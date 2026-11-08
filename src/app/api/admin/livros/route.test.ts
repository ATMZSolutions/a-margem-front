import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  autorizar: vi.fn(),
  listar: vi.fn(),
  prismaListar: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(),
  excluir: vi.fn(),
}));

vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/publicContent", () => ({ listAdminBookListings: mocks.listar }));
vi.mock("@/lib/prisma", () => ({ default: { book: {
  findMany: mocks.prismaListar, create: mocks.criar, update: mocks.atualizar, delete: mocks.excluir,
} } }));

import { DELETE, GET, POST, PUT } from "./route";

const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]).toString("base64");

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/livros") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: { origin: "https://amargem.test", ...(metodo === "POST" || metodo === "PUT" ? { "content-type": "application/json" } : {}) },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa de livros", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.listar.mockResolvedValue([{ id: 1, titulo: "Livro", hasImage: true }]);
    mocks.criar.mockResolvedValue({ id: 2 });
    mocks.atualizar.mockResolvedValue({ id: 1 });
    mocks.excluir.mockResolvedValue({ id: 1 });
  });

  it("retorna indicador de imagem sem expor o campo interno", async () => {
    const resposta = await GET(requisicao("GET"));
    expect(await resposta.json()).toEqual([{ id: 1, titulo: "Livro", imagem: true }]);
  });

  it("cria livro com ou sem imagem e valida os dados da obra", async () => {
    const corpo = { titulo: "Livro", autor: "Autora", descricao: "Descrição" };
    expect((await POST(requisicao("POST", corpo))).status).toBe(201);
    expect(mocks.criar).toHaveBeenCalledWith({ data: corpo, select: { id: true } });

    expect((await POST(requisicao("POST", { ...corpo, imageData: pngBase64, imagemTipo: "image/png" }))).status).toBe(201);
    expect(mocks.criar).toHaveBeenLastCalledWith({ data: expect.objectContaining({
      ...corpo,
      imagem: expect.any(Uint8Array),
      imagemTipo: "image/png",
    }), select: { id: true } });
    const imagemCriada = mocks.criar.mock.calls.at(-1)?.[0].data.imagem as Uint8Array;
    expect(Array.from(imagemCriada)).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect((await POST(requisicao("POST", { ...corpo, imageData: "inválida", imagemTipo: "image/png" }))).status).toBe(400);
    expect((await POST(requisicao("POST", { ...corpo, titulo: "" }))).status).toBe(400);
  });

  it("atualiza texto ou imagem e valida identificador e campos", async () => {
    const corpo = { id: 1, titulo: "Novo título", autor: "Nova autora", descricao: "Nova descrição" };
    expect((await PUT(requisicao("PUT", corpo))).status).toBe(200);
    expect(mocks.atualizar).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { titulo: corpo.titulo, autor: corpo.autor, descricao: corpo.descricao },
      select: { id: true },
    });
    expect((await PUT(requisicao("PUT", { id: 1, imageData: pngBase64, imagemTipo: "image/png" }))).status).toBe(200);

    for (const dados of [
      {},
      { id: 1, titulo: " " },
      { id: 1, autor: "" },
      { id: 1, descricao: "" },
      { id: 1, imageData: "inválida", imagemTipo: "image/png" },
      { id: 1 },
    ]) {
      expect((await PUT(requisicao("PUT", dados))).status).toBe(400);
    }
  });

  it("exclui livro válido e recusa identificador inválido", async () => {
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/livros?id=1"))).status).toBe(200);
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/livros?id=0"))).status).toBe(400);
  });
});
