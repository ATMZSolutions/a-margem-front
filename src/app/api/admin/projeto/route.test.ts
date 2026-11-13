import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ autorizar: vi.fn(), listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() }));
vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/prisma", () => ({ default: { projeto: {
  findMany: mocks.listar, create: mocks.criar, update: mocks.atualizar, delete: mocks.excluir,
} } }));

import { DELETE, GET, POST, PUT } from "./route";

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/projeto") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: { origin: "https://amargem.test", ...(metodo === "POST" || metodo === "PUT" ? { "content-type": "application/json" } : {}) },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa de projetos", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.listar.mockResolvedValue([{ id: 1, descricao: "Ação" }]);
    mocks.criar.mockResolvedValue({ id: 2 });
    mocks.atualizar.mockResolvedValue({ id: 1 });
    mocks.excluir.mockResolvedValue({ id: 1 });
  });

  it("lista projetos do mais recente para o mais antigo", async () => {
    const resposta = await GET(requisicao("GET"));
    expect(resposta.status).toBe(200);
    expect(mocks.listar).toHaveBeenCalledWith({
      orderBy: { data: "desc" },
      select: { id: true, data: true, descricao: true },
    });
  });

  it("cria projeto com data válida e rejeita campos inválidos", async () => {
    const resposta = await POST(requisicao("POST", { data: "2026-11-07", descricao: "Ação do coletivo" }));
    expect(resposta.status).toBe(201);
    expect(mocks.criar).toHaveBeenCalledWith({
      data: { data: new Date("2026-11-07"), descricao: "Ação do coletivo" },
      select: { id: true },
    });
    expect((await POST(requisicao("POST", { data: "inválida", descricao: "texto" }))).status).toBe(400);
    expect((await POST(requisicao("POST", { data: "2026-11-07", descricao: "" }))).status).toBe(400);
  });

  it("atualiza data e descrição e rejeita identificador ou campos inválidos", async () => {
    const resposta = await PUT(requisicao("PUT", { id: 1, data: "2026-11-08", descricao: "Atualizado" }));
    expect(resposta.status).toBe(200);
    expect(mocks.atualizar).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { data: new Date("2026-11-08"), descricao: "Atualizado" },
      select: { id: true },
    });
    for (const corpo of [{}, { id: 1, data: "inválida" }, { id: 1, descricao: " " }, { id: 1 }]) {
      expect((await PUT(requisicao("PUT", corpo))).status).toBe(400);
    }
  });

  it("exclui projeto válido e rejeita id sem inteiro positivo seguro", async () => {
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/projeto?id=1"))).status).toBe(200);
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/projeto?id=abc"))).status).toBe(400);
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

  it("recusa datas que não são texto ou são longas demais", async () => {
    expect((await POST(requisicao("POST", { data: 123, descricao: "x" }))).status).toBe(400);
    expect((await POST(requisicao("POST", { data: "2".repeat(41), descricao: "x" }))).status).toBe(400);
  });
});
