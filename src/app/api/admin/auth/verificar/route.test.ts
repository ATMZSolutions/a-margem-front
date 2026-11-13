import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  autorizar: vi.fn(),
  obterConfiguracao: vi.fn(),
}));

vi.mock("@/lib/adminRequest", () => ({ authorizeAdminRequest: mocks.autorizar }));
vi.mock("@/lib/adminConfig", () => ({ getAdminConfig: mocks.obterConfiguracao }));

type RotasVerificar = typeof import("./route");
let POST: RotasVerificar["POST"];

function requisicao(corpo: unknown) {
  return new Request("https://amargem.test/api/admin/auth/verificar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

describe("rota de verificação de senha administrativa", () => {
  beforeEach(async () => {
    vi.resetModules();
    mocks.autorizar.mockResolvedValue(null);
    mocks.obterConfiguracao.mockReturnValue({
      username: "administradora",
      password: "senha-segura-para-testes",
      jwtSecret: "segredo-de-teste-com-mais-de-32-bytes",
    });
    ({ POST } = await import("./route"));
  });

  afterEach(() => vi.clearAllMocks());

  it("recusa requisição não autorizada", async () => {
    mocks.autorizar.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));
    const resposta = await POST(requisicao({ password: "qualquer-senha" }));
    expect(resposta.status).toBe(401);
  });

  it("retorna 503 se a configuração administrativa falhar", async () => {
    mocks.obterConfiguracao.mockImplementationOnce(() => {
      throw new Error("Config indisponível");
    });
    const resposta = await POST(requisicao({ password: "senha-segura-para-testes" }));
    expect(resposta.status).toBe(503);
    expect(await resposta.json()).toEqual({ error: "Configuração administrativa indisponível" });
  });

  it("retorna 400 se a senha não for informada", async () => {
    const respostaSemSenha = await POST(requisicao({}));
    expect(respostaSemSenha.status).toBe(400);
    expect(await respostaSemSenha.json()).toEqual({ error: "Senha não informada." });

    const respostaVazia = await POST(requisicao({ password: "" }));
    expect(respostaVazia.status).toBe(400);
  });

  it("retorna 401 se a senha for incorreta (tamanho diferente ou conteúdo diferente)", async () => {
    const respostaTamanhoDiferente = await POST(requisicao({ password: "curta" }));
    expect(respostaTamanhoDiferente.status).toBe(401);
    expect(await respostaTamanhoDiferente.json()).toEqual({ error: "Senha administrativa incorreta." });

    const respostaMesmoTamanhoIncorreta = await POST(requisicao({ password: "senha-errada-para-testes" }));
    expect(respostaMesmoTamanhoIncorreta.status).toBe(401);
  });

  it("retorna 200 com ok: true quando a senha estiver correta", async () => {
    const resposta = await POST(requisicao({ password: "senha-segura-para-testes" }));
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ ok: true });
  });
});

