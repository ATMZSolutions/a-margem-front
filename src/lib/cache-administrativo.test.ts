import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buscarJsonAdministrativo,
  invalidarDadosCacheados,
  lerDadosCacheados,
  limparCacheAdministrativo,
  obterDadosCacheados,
} from "./cache-administrativo";

describe("cache administrativo", () => {
  beforeEach(() => limparCacheAdministrativo());
  afterEach(() => vi.unstubAllGlobals());

  it("deduplica carregamentos e devolve os dados resolvidos sem nova busca", async () => {
    const carregar = vi.fn().mockResolvedValue([{ id: 1 }]);
    const primeira = obterDadosCacheados("admin:noticias", carregar);
    const segunda = obterDadosCacheados("admin:noticias", carregar);

    expect(primeira).toBe(segunda);
    await expect(primeira).resolves.toEqual([{ id: 1 }]);
    expect(lerDadosCacheados("admin:noticias")).toEqual([{ id: 1 }]);
    await expect(obterDadosCacheados("admin:noticias", carregar)).resolves.toEqual([{ id: 1 }]);
    expect(carregar).toHaveBeenCalledTimes(1);
  });

  it("mantém recursos separados e invalida apenas a chave solicitada", async () => {
    await obterDadosCacheados("admin:agenda", async () => ["evento"]);
    await obterDadosCacheados("admin:livros", async () => ["livro"]);
    invalidarDadosCacheados("admin:agenda");

    expect(lerDadosCacheados("admin:agenda")).toBeUndefined();
    expect(lerDadosCacheados("admin:livros")).toEqual(["livro"]);
  });

  it("remove uma entrada cuja busca falhou para permitir nova tentativa", async () => {
    const carregar = vi.fn()
      .mockRejectedValueOnce(new Error("falha de rede"))
      .mockResolvedValueOnce(["recuperado"]);

    await expect(obterDadosCacheados("admin:sobre", carregar)).rejects.toThrow("falha de rede");
    expect(lerDadosCacheados("admin:sobre")).toBeUndefined();
    await expect(obterDadosCacheados("admin:sobre", carregar)).resolves.toEqual(["recuperado"]);
  });

  it("não deixa uma busca antiga repovoar uma chave invalidada", async () => {
    let resolverAntigo!: (valor: string[]) => void;
    const carregamentoAntigo = new Promise<string[]>((resolver) => { resolverAntigo = resolver; });
    const buscaAntiga = obterDadosCacheados("admin:projetos", () => carregamentoAntigo);

    invalidarDadosCacheados("admin:projetos");
    await obterDadosCacheados("admin:projetos", async () => ["atual"]);
    resolverAntigo(["antigo"]);
    await buscaAntiga;

    expect(lerDadosCacheados("admin:projetos")).toEqual(["atual"]);
  });

  it("não remove uma entrada nova quando uma busca antiga invalidada falha", async () => {
    let rejeitarAntigo!: (erro: Error) => void;
    const buscaAntiga = obterDadosCacheados("admin:eventos", () => new Promise<string[]>((_, rejeitar) => { rejeitarAntigo = rejeitar; }));
    const assertivaAntiga = expect(buscaAntiga).rejects.toThrow("antiga");

    invalidarDadosCacheados("admin:eventos");
    await obterDadosCacheados("admin:eventos", async () => ["atual"]);
    rejeitarAntigo(new Error("antiga"));
    await assertivaAntiga;

    expect(lerDadosCacheados("admin:eventos")).toEqual(["atual"]);
  });

  it("limpa todas as entradas ao encerrar a sessão", async () => {
    await obterDadosCacheados("admin:agenda", async () => [1]);
    await obterDadosCacheados("admin:noticias", async () => [2]);
    limparCacheAdministrativo();

    expect(lerDadosCacheados("admin:agenda")).toBeUndefined();
    expect(lerDadosCacheados("admin:noticias")).toBeUndefined();
  });

  it("busca JSON com credenciais e rejeita respostas HTTP malsucedidas", async () => {
    const buscar = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response("erro", { status: 500 }));
    vi.stubGlobal("fetch", buscar);

    await expect(buscarJsonAdministrativo("/api/admin/agenda")).resolves.toEqual({ ok: true });
    expect(buscar).toHaveBeenNthCalledWith(1, "/api/admin/agenda", { credentials: "include" });
    await expect(buscarJsonAdministrativo("/api/admin/agenda")).rejects.toThrow("(500)");
  });
});
