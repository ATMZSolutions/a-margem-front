import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  autorizar: vi.fn(),
  listar: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(),
  excluir: vi.fn(),
}));

vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/prisma", () => ({ default: { agenda: {
  findMany: mocks.listar,
  create: mocks.criar,
  update: mocks.atualizar,
  delete: mocks.excluir,
} } }));

import { DELETE, GET, POST, PUT } from "./route";

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/agenda") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: {
      ...(metodo === "POST" || metodo === "PUT" ? { "content-type": "application/json", origin: "https://amargem.test" } : { origin: "https://amargem.test" }),
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa da agenda", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.listar.mockResolvedValue([{ id: 1, titulo: "Apresentação" }]);
    mocks.criar.mockResolvedValue({ id: 2 });
    mocks.atualizar.mockResolvedValue({ id: 1 });
    mocks.excluir.mockResolvedValue({ id: 1 });
  });

  it("autoriza a leitura e devolve as agendas ordenadas pela rota", async () => {
    const resposta = await GET(requisicao("GET"));
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual([{ id: 1, titulo: "Apresentação" }]);
    expect(mocks.listar).toHaveBeenCalledWith({ orderBy: { data: "asc" } });
  });

  it("devolve a negativa de autorização sem consultar os dados", async () => {
    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await GET(requisicao("GET"))).status).toBe(401);
    expect(mocks.listar).not.toHaveBeenCalled();
  });

  it("cria agenda com data convertida e recusa dados inválidos", async () => {
    const valida = await POST(requisicao("POST", {
      titulo: "Apresentação",
      data: "2026-12-20T19:00:00.000Z",
      local: "Teatro",
      cidade: "Recife",
    }));
    expect(valida.status).toBe(201);
    expect(await valida.json()).toEqual({ id: 2 });
    expect(mocks.criar).toHaveBeenCalledWith({ data: expect.objectContaining({ data: new Date("2026-12-20T19:00:00.000Z") }) });

    expect((await POST(requisicao("POST", { titulo: "", data: "inválida", local: "", cidade: "" }))).status).toBe(400);
    expect((await POST(requisicao("POST", { titulo: "A", data: "x".repeat(41), local: "B", cidade: "C" }))).status).toBe(400);
  });

  it("atualiza os campos enviados e valida identificador e cada campo", async () => {
    const resposta = await PUT(requisicao("PUT", {
      id: 1,
      titulo: "Novo título",
      data: "2026-12-21T19:00:00.000Z",
      local: "Espaço cultural",
      cidade: "Olinda",
    }));
    expect(resposta.status).toBe(200);
    expect(mocks.atualizar).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { titulo: "Novo título", data: new Date("2026-12-21T19:00:00.000Z"), local: "Espaço cultural", cidade: "Olinda" },
    });

    for (const corpo of [
      {},
      { id: 1, titulo: " " },
      { id: 1, data: "data inválida" },
      { id: 1, local: "" },
      { id: 1, cidade: "" },
      { id: 1 },
    ]) {
      expect((await PUT(requisicao("PUT", corpo))).status).toBe(400);
    }
  });

  it("exclui identificador válido e recusa valores fora do domínio", async () => {
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/agenda?id=1"))).status).toBe(200);
    expect(mocks.excluir).toHaveBeenCalledWith({ where: { id: 1 } });
    for (const id of ["abc", "0", "9007199254740992"]) {
      expect((await DELETE(requisicao("DELETE", undefined, `/api/admin/agenda?id=${id}`))).status).toBe(400);
    }
  });
});
