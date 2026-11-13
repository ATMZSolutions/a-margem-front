import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({
  autorizar: vi.fn(),
  editorialAtivo: vi.fn(),
  midiaFindMany: vi.fn(),
  midiaFindUnique: vi.fn(),
  midiaCreate: vi.fn(),
  midiaUpdate: vi.fn(),
  storageEnviar: vi.fn(),
}));

vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/editorialConfig", () => ({ supabaseEditorialAtivo: mocks.editorialAtivo }));
vi.mock("@/lib/storageRuntime", () => ({
  getRuntimeStorage: () => ({
    storage: {
      enviarEVerificar: mocks.storageEnviar,
    },
    bucketMidias: "midias-bucket",
  }),
}));
vi.mock("@/lib/siteContent", () => ({
  getPublicContactPageSettings: vi.fn().mockResolvedValue(null),
  getPublicHomeSettings: vi.fn().mockResolvedValue(null),
  getPublicProjectPageSettings: vi.fn().mockResolvedValue(null),
  getPublicSiteIdentity: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/publicContent", () => ({
  urlPublicaDaMidia: (m: { id: string }) => `https://storage.test/${m.id}`,
}));
vi.mock("@/lib/prisma", () => ({
  default: {
    midia: {
      findMany: mocks.midiaFindMany,
      findUnique: mocks.midiaFindUnique,
      create: mocks.midiaCreate,
      update: mocks.midiaUpdate,
    },
    integrante: { findMany: vi.fn().mockResolvedValue([]) },
    espetaculo: { findMany: vi.fn().mockResolvedValue([]) },
    premio: { findMany: vi.fn().mockResolvedValue([]) },
    marcoHistorico: { findMany: vi.fn().mockResolvedValue([]) },
    agenda: { findMany: vi.fn().mockResolvedValue([]) },
    noticia: { findMany: vi.fn().mockResolvedValue([]) },
    livro: { findMany: vi.fn().mockResolvedValue([]) },
    projeto: { findMany: vi.fn().mockResolvedValue([]) },
    sobre: { findMany: vi.fn().mockResolvedValue([]) },
    galeriaItem: { findMany: vi.fn().mockResolvedValue([]) },
    configuracaoSite: { findMany: vi.fn().mockResolvedValue([]) },
    secaoHome: { findMany: vi.fn().mockResolvedValue([]) },
    paginaSite: { findMany: vi.fn().mockResolvedValue([]) },
    canalContato: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { GET, PATCH } from "./route";

function requisicao(metodo: string, corpo?: unknown, caminho = "/api/admin/midias") {
  return new Request(`https://amargem.test${caminho}`, {
    method: metodo,
    headers: {
      ...(metodo === "POST" || metodo === "PATCH" ? { "content-type": "application/json", origin: "https://amargem.test" } : { origin: "https://amargem.test" }),
    },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });
}

describe("API administrativa de mídias", () => {
  beforeEach(() => {
    mocks.autorizar.mockResolvedValue(null);
    mocks.editorialAtivo.mockReturnValue(true);
    mocks.midiaFindMany.mockResolvedValue([
      {
        id: "mid-1",
        bucket: "b",
        chave: "k",
        sha256: "hash",
        mime: "image/webp",
        bytes: 1024,
        largura: 100,
        altura: 100,
        nomeOriginal: "foto.webp",
        origem: "manual",
        criadoEm: new Date(),
        semVinculoDesde: null,
        usos: [],
        integrantes: [],
        espetaculos: [],
        premios: [],
        fotos: [],
      },
    ]);
    mocks.midiaUpdate.mockResolvedValue({ id: "mid-1", nomeOriginal: "Novo Nome" });
  });

  it("recusa acesso não autorizado em GET", async () => {
    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    const res = await GET(requisicao("GET"));
    expect(res.status).toBe(401);
  });

  it("retorna 503 se o módulo editorial estiver inativo em GET", async () => {
    mocks.editorialAtivo.mockReturnValueOnce(false);
    const res = await GET(requisicao("GET"));
    expect(res.status).toBe(503);
  });

  it("lista mídias com referências formatadas em GET", async () => {
    const res = await GET(requisicao("GET"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("mid-1");
  });

  it("PATCH valida dados e recusa payload inválido", async () => {
    const resVazio = await PATCH(requisicao("PATCH", {}));
    expect(resVazio.status).toBe(400);

    const resSemNome = await PATCH(requisicao("PATCH", { id: "mid-1" }));
    expect(resSemNome.status).toBe(400);
  });

  it("PATCH atualiza nome da imagem com sucesso", async () => {
    const res = await PATCH(requisicao("PATCH", { id: "mid-1", nomeOriginal: "Novo Nome da Foto" }));
    expect(res.status).toBe(200);
    expect(mocks.midiaUpdate).toHaveBeenCalledWith({
      where: { id: "mid-1" },
      data: { nomeOriginal: "Novo Nome da Foto" },
      select: { id: true, nomeOriginal: true },
    });
  });

  it("PATCH recusa acesso não autorizado ou editorial inativo", async () => {
    mocks.autorizar.mockResolvedValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    expect((await PATCH(requisicao("PATCH", { id: "mid-1", nomeOriginal: "Teste" }))).status).toBe(401);

    mocks.editorialAtivo.mockReturnValueOnce(false);
    expect((await PATCH(requisicao("PATCH", { id: "mid-1", nomeOriginal: "Teste" }))).status).toBe(503);
  });
});
