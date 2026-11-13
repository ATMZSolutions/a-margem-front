import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  autorizar: vi.fn(),
  editorialAtivo: vi.fn(),
  revalidatePath: vi.fn(),
  canalFindMany: vi.fn(),
  canalCreate: vi.fn(),
  canalUpdate: vi.fn(),
  canalDelete: vi.fn(),
  midiaFindMany: vi.fn(),
  configUpsert: vi.fn(),
  getPublicContactPageSettings: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/editorialConfig", () => ({ supabaseEditorialAtivo: mocks.editorialAtivo }));
vi.mock("@/lib/siteContent", () => ({ getPublicContactPageSettings: mocks.getPublicContactPageSettings }));
vi.mock("@/lib/prisma", () => ({
  default: {
    canalContato: {
      findMany: mocks.canalFindMany,
      create: mocks.canalCreate,
      update: mocks.canalUpdate,
      delete: mocks.canalDelete,
    },
    midia: {
      findMany: mocks.midiaFindMany,
    },
    configuracaoSite: {
      upsert: mocks.configUpsert,
    },
  },
}));

import { DELETE, GET, POST, PUT } from "./route";

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/contatos") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: {
      ...(metodo === "POST" || metodo === "PUT" ? { "content-type": "application/json", origin: "https://amargem.test" } : { origin: "https://amargem.test" }),
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa de contatos", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.editorialAtivo.mockReturnValue(true);
    mocks.canalFindMany.mockResolvedValue([{ id: "c1", rotulo: "WhatsApp", url: "https://wa.me/123" }]);
    mocks.midiaFindMany.mockResolvedValue([{ id: "m1", bucket: "b", chave: "k", mime: "image/webp", bytes: 1000 }]);
    mocks.getPublicContactPageSettings.mockResolvedValue({ titulo: "Contato", fundo: {}, logo: {} });
    mocks.canalCreate.mockResolvedValue({ id: "c2", rotulo: "Instagram" });
    mocks.canalUpdate.mockResolvedValue({ id: "c1", rotulo: "WhatsApp Atualizado" });
    mocks.canalDelete.mockResolvedValue({ id: "c1" });
    mocks.configUpsert.mockResolvedValue({ id: "cfg1" });
  });

  it("recusa acesso não autorizado em GET", async () => {
    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const res = await GET(requisicao("GET"));
    expect(res.status).toBe(401);
  });

  it("retorna 503 quando o módulo editorial estiver inativo em GET", async () => {
    mocks.editorialAtivo.mockReturnValueOnce(false);
    const res = await GET(requisicao("GET"));
    expect(res.status).toBe(503);
  });

  it("retorna canais, página e mídias no GET com sucesso", async () => {
    const res = await GET(requisicao("GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.canais).toHaveLength(1);
    expect(json.pagina.titulo).toBe("Contato");
    expect(json.midias).toHaveLength(1);
  });

  it("POST recusa acesso não autorizado ou editorial inativo", async () => {
    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await POST(requisicao("POST", {}))).status).toBe(401);

    mocks.editorialAtivo.mockReturnValueOnce(false);
    expect((await POST(requisicao("POST", {}))).status).toBe(503);
  });

  it("POST valida payload e rejeita campos inválidos", async () => {
    const semCorpo = new Request("https://amargem.test/api/admin/contatos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    });
    expect((await POST(semCorpo)).status).toBe(400);

    const semUrl = await POST(requisicao("POST", { rotulo: "Instagram", url: "" }));
    expect(semUrl.status).toBe(400);
  });

  it("POST cria canal com sucesso e invalida cache", async () => {
    const res = await POST(requisicao("POST", {
      tipo: "instagram",
      rotulo: "Instagram Oficial",
      url: "https://instagram.com/amargem",
      ordem: 1,
      ativo: true,
    }));
    expect(res.status).toBe(201);
    expect(mocks.canalCreate).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/contato");
  });

  it("PUT atualiza configurações da página de contato", async () => {
    const res = await PUT(requisicao("PUT", {
      pagina: {
        titulo: "Novo Contato",
        fundo: { midiaId: "m1", alt: "Fundo" },
        logo: { midiaId: "m2", alt: "Logo" },
      },
    }));
    expect(res.status).toBe(200);
    expect(mocks.configUpsert).toHaveBeenCalled();
  });

  it("PUT atualiza canal individual de contato", async () => {
    const res = await PUT(requisicao("PUT", {
      id: "c1",
      tipo: "whatsapp",
      rotulo: "WhatsApp Suporte",
      url: "https://wa.me/551199999999",
      ordem: 2,
      ativo: false,
    }));
    expect(res.status).toBe(200);
    expect(mocks.canalUpdate).toHaveBeenCalled();
  });

  it("PUT rejeita dados insuficientes ou inválidos", async () => {
    const res = await PUT(requisicao("PUT", {}));
    expect(res.status).toBe(400);

    const resInvalido = await PUT(requisicao("PUT", { id: "c1", rotulo: "", url: "invalida" }));
    expect(resInvalido.status).toBe(400);
  });

  it("DELETE exclui canal pelo ID informado na querystring", async () => {
    const res = await DELETE(requisicao("DELETE", undefined, "/api/admin/contatos?id=c1"));
    expect(res.status).toBe(200);
    expect(mocks.canalDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("DELETE rejeita requisição sem ID ou não autorizada", async () => {
    const resSemId = await DELETE(requisicao("DELETE", undefined, "/api/admin/contatos"));
    expect(resSemId.status).toBe(400);

    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const resNaoAuth = await DELETE(requisicao("DELETE", undefined, "/api/admin/contatos?id=c1"));
    expect(resNaoAuth.status).toBe(401);
  });
});

