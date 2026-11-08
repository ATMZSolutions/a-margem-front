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
vi.mock("@/lib/prisma", () => ({ default: { noticia: {
  findMany: mocks.listar,
  create: mocks.criar,
  update: mocks.atualizar,
  delete: mocks.excluir,
} } }));

import { DELETE, GET, POST, PUT } from "./route";

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/noticias") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: { origin: "https://amargem.test", ...(metodo === "POST" || metodo === "PUT" ? { "content-type": "application/json" } : {}) },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa de notícias", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.listar.mockResolvedValue([{ id: 3, titulo: "Notícia" }]);
    mocks.criar.mockResolvedValue({ id: 4 });
    mocks.atualizar.mockResolvedValue({ id: 3 });
    mocks.excluir.mockResolvedValue({ id: 3 });
  });

  it("lê notícias em ordem decrescente e respeita sessão", async () => {
    const resposta = await GET(requisicao("GET"));
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual([{ id: 3, titulo: "Notícia" }]);
    expect(mocks.listar).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({}, { status: 401 }));
    expect((await GET(requisicao("GET"))).status).toBe(401);
  });

  it("aceita link vazio ou HTTP(S) e recusa conteúdo inválido", async () => {
    const resposta = await POST(requisicao("POST", { titulo: "Título", conteudo: "Texto", link: "" }));
    expect(resposta.status).toBe(201);
    expect(mocks.criar).toHaveBeenCalledWith({ data: { titulo: "Título", conteudo: "Texto", link: "" } });
    expect((await POST(requisicao("POST", { titulo: "Título", conteudo: "Texto", link: "javascript:alert(1)" }))).status).toBe(400);
    expect((await POST(requisicao("POST", { titulo: "", conteudo: "", link: 4 }))).status).toBe(400);
    expect((await POST(requisicao("POST", { titulo: "Título", conteudo: "Texto", link: `https://x.test/${"a".repeat(2050)}` }))).status).toBe(400);
    expect((await POST(requisicao("POST", { titulo: "Título", conteudo: "Texto", link: "https://amargem.test/noticia" }))).status).toBe(201);
  });

  it("atualiza campos enviados e recusa id, título, conteúdo, link ou atualização vazia", async () => {
    const resposta = await PUT(requisicao("PUT", { id: 3, titulo: "Novo", conteudo: "Atualizado", link: "http://amargem.test" }));
    expect(resposta.status).toBe(200);
    expect(mocks.atualizar).toHaveBeenCalledWith({ where: { id: 3 }, data: { titulo: "Novo", conteudo: "Atualizado", link: "http://amargem.test" } });

    for (const corpo of [
      {},
      { id: 3, titulo: " " },
      { id: 3, conteudo: "" },
      { id: 3, link: "javascript:alert(1)" },
      { id: 3 },
    ]) {
      expect((await PUT(requisicao("PUT", corpo))).status).toBe(400);
    }
  });

  it("exclui notícia válida e rejeita identificadores inválidos", async () => {
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/noticias?id=3"))).status).toBe(200);
    expect(mocks.excluir).toHaveBeenCalledWith({ where: { id: 3 } });
    expect((await DELETE(requisicao("DELETE", undefined, "/api/admin/noticias?id=-1"))).status).toBe(400);
  });
});
