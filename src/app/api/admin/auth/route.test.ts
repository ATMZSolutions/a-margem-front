import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  obterConfiguracao: vi.fn(),
  criarSessao: vi.fn(),
  mesmaOrigem: vi.fn(),
  tipoJson: vi.fn(),
}));

vi.mock("@/lib/adminConfig", () => ({ getAdminConfig: mocks.obterConfiguracao }));
vi.mock("@/lib/adminSession", () => ({ createSession: mocks.criarSessao, sessionMaxAge: 8 * 60 * 60 }));
vi.mock("@/lib/adminRequest", () => ({ hasSameOrigin: mocks.mesmaOrigem, hasExactJsonContentType: mocks.tipoJson }));

type RotasAuth = typeof import("./route");
let POST: RotasAuth["POST"];
let DELETE: RotasAuth["DELETE"];

function requisicaoLogin(corpo: unknown, cabecalhos: Record<string, string> = {}) {
  const valor = typeof corpo === "string" ? corpo : JSON.stringify(corpo);
  return new Request("https://amargem.test/api/admin/auth", {
    method: "POST",
    headers: {
      origin: "https://amargem.test",
      "content-type": "application/json",
      ...cabecalhos,
    },
    body: valor,
  });
}

describe("rotas de autenticação administrativa", () => {
  beforeEach(async () => {
    vi.resetModules();
    mocks.obterConfiguracao.mockReturnValue({
      username: "administradora",
      password: "senha-segura-para-testes",
      jwtSecret: "segredo-de-teste-com-mais-de-32-bytes",
    });
    mocks.criarSessao.mockResolvedValue("token-assinado");
    mocks.mesmaOrigem.mockImplementation((request: Request) => request.headers.get("origin") === new URL(request.url).origin);
    mocks.tipoJson.mockImplementation((request: Request) => request.headers.get("content-type")?.split(";", 1)[0] === "application/json");
    ({ POST, DELETE } = await import("./route"));
  });

  afterEach(() => vi.useRealTimers());

  it("recusa origem externa, corpo grande e tipo de conteúdo inválido", async () => {
    mocks.mesmaOrigem.mockReturnValue(false);
    expect((await POST(requisicaoLogin({}))).status).toBe(403);
    mocks.mesmaOrigem.mockReturnValue(true);

    expect((await POST(requisicaoLogin({}, { "content-length": "2049" }))).status).toBe(413);
    mocks.tipoJson.mockReturnValue(false);
    expect((await POST(requisicaoLogin({}))).status).toBe(415);
    expect(mocks.obterConfiguracao).not.toHaveBeenCalled();
  });

  it("informa configuração administrativa ausente", async () => {
    mocks.obterConfiguracao.mockImplementation(() => { throw new Error("sem configuração"); });
    const resposta = await POST(requisicaoLogin({ username: "administradora", password: "senha" }));
    expect(resposta.status).toBe(503);
    expect(await resposta.json()).toEqual({ error: "Admin authentication is not configured" });
  });

  it("cria sessão e cookie seguro somente após credenciais válidas", async () => {
    const resposta = await POST(requisicaoLogin({ username: "administradora", password: "senha-segura-para-testes" }, {
      "x-forwarded-for": "192.0.2.4, 192.0.2.5",
    }));

    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ ok: true });
    expect(mocks.criarSessao).toHaveBeenCalledWith("administradora");
    expect(resposta.cookies.get("a_token")?.value).toBe("token-assinado");
    expect(resposta.cookies.get("a_token")?.httpOnly).toBe(true);
    expect(resposta.cookies.get("a_token")?.sameSite).toBe("lax");
  });

  it("responde da mesma forma para JSON inválido e credenciais incorretas", async () => {
    const invalida = await POST(requisicaoLogin("{ inválido"));
    const incorreta = await POST(requisicaoLogin({ username: "administradora", password: "errada" }));
    expect(invalida.status).toBe(401);
    expect(incorreta.status).toBe(401);
    expect(await invalida.json()).toEqual({ error: "Invalid credentials" });
    expect(await incorreta.json()).toEqual({ error: "Invalid credentials" });

    const grande = await POST(requisicaoLogin("x".repeat(2049)));
    expect(grande.status).toBe(401);
  });

  it("aplica bloqueio temporário por endereço depois de cinco tentativas", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T12:00:00.000Z"));
    const criarTentativa = () => POST(requisicaoLogin({ username: "errada", password: "errada" }, {
      "x-real-ip": "192.0.2.20",
    }));

    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      expect((await criarTentativa()).status).toBe(401);
    }
    const bloqueada = await criarTentativa();
    expect(bloqueada.status).toBe(429);
    expect(Number(bloqueada.headers.get("retry-after"))).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it("aumenta o bloqueio para quinze minutos na décima tentativa", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T12:00:00.000Z"));
    const criarTentativa = () => POST(requisicaoLogin({ username: "errada", password: "errada" }, {
      "x-forwarded-for": "192.0.2.30",
    }));

    for (let tentativa = 0; tentativa < 5; tentativa += 1) await criarTentativa();
    for (let tentativa = 5; tentativa < 10; tentativa += 1) {
      await vi.advanceTimersByTimeAsync(60_001);
      expect((await criarTentativa()).status).toBe(401);
    }
    const bloqueada = await criarTentativa();
    expect(bloqueada.status).toBe(429);
    expect(Number(bloqueada.headers.get("retry-after"))).toBeGreaterThan(800);
    vi.useRealTimers();
  });

  it("limpa o cookie ao sair e bloqueia logout entre origens", async () => {
    mocks.mesmaOrigem.mockReturnValue(false);
    expect((await DELETE(new Request("https://amargem.test/api/admin/auth", { method: "DELETE" }))).status).toBe(403);

    mocks.mesmaOrigem.mockReturnValue(true);
    const resposta = await DELETE(new Request("https://amargem.test/api/admin/auth", { method: "DELETE" }));
    expect(resposta.status).toBe(200);
    expect(resposta.cookies.get("a_token")?.value).toBe("");
    expect(resposta.cookies.get("a_token")?.maxAge).toBe(0);
  });
});
