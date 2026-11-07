import { beforeEach, describe, expect, it, vi } from "vitest";
import { authorizeAdminRequest, hasExactJsonContentType, hasSameOrigin } from "./adminRequest";

const { validarSessao } = vi.hoisted(() => ({ validarSessao: vi.fn() }));
vi.mock("./adminSession", () => ({ validateSession: validarSessao }));

function requisicao(cabecalhos: Record<string, string> = {}) {
  return new Request("https://amargem.test/api/admin/noticias", { headers: cabecalhos });
}

describe("regras de requisição administrativa", () => {
  beforeEach(() => validarSessao.mockImplementation(async (token?: string) => Boolean(token)));

  it("reconhece JSON mesmo com parâmetros e diferenças de caixa", () => {
    expect(hasExactJsonContentType(requisicao({ "content-type": "Application/JSON; charset=utf-8" }))).toBe(true);
    expect(hasExactJsonContentType(requisicao({ "content-type": "text/plain" }))).toBe(false);
    expect(hasExactJsonContentType(requisicao())).toBe(false);
  });

  it("aceita apenas origem válida igual à da requisição", () => {
    expect(hasSameOrigin(requisicao({ origin: "https://amargem.test" }))).toBe(true);
    expect(hasSameOrigin(requisicao({ origin: "https://outro.test" }))).toBe(false);
    expect(hasSameOrigin(requisicao({ origin: "não é uma URL" }))).toBe(false);
    expect(hasSameOrigin(requisicao())).toBe(false);
  });

  it("autoriza leitura com token presente no cookie", async () => {
    await expect(authorizeAdminRequest(requisicao({ cookie: "tema=escuro; a_token=token-valido" }))).resolves.toBeNull();
    expect(validarSessao).toHaveBeenCalledWith("token-valido");
  });

  it("rejeita sessão ausente ou inválida", async () => {
    const semSessao = await authorizeAdminRequest(requisicao());
    expect(semSessao?.status).toBe(401);
    expect(await semSessao?.json()).toEqual({ error: "Unauthorized" });

    validarSessao.mockResolvedValue(false);
    expect((await authorizeAdminRequest(requisicao({ cookie: "a_token=ruim" })))?.status).toBe(401);
  });

  it("recusa escrita de outra origem antes de validar a sessão", async () => {
    validarSessao.mockClear();
    const resposta = await authorizeAdminRequest(requisicao({ origin: "https://atacante.test" }), { write: true });
    expect(resposta?.status).toBe(403);
    expect(validarSessao).not.toHaveBeenCalled();
  });

  it("exige JSON nas gravações que recebem corpo JSON", async () => {
    const resposta = await authorizeAdminRequest(requisicao({ origin: "https://amargem.test" }), { write: true, json: true });
    expect(resposta?.status).toBe(415);
    expect(await resposta?.json()).toEqual({ error: "Content-Type must be application/json" });
  });

  it("autoriza escrita JSON da mesma origem com sessão válida", async () => {
    await expect(authorizeAdminRequest(requisicao({
      origin: "https://amargem.test",
      "content-type": "application/json",
      cookie: "a_token=ok",
    }), { write: true, json: true })).resolves.toBeNull();
  });
});
