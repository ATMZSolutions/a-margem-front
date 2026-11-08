import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, sessionMaxAge, validateSession } from "./adminSession";

const usuario = "administradora";
const segredo = "segredo-de-teste-com-mais-de-32-bytes";

function base64Url(valor: unknown) {
  return Buffer.from(JSON.stringify(valor)).toString("base64url");
}

async function assinarToken(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: "HS256", typ: "JWT" }) {
  const parteHeader = base64Url(header);
  const partePayload = base64Url(payload);
  const mensagem = `${parteHeader}.${partePayload}`;
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(mensagem));
  return `${mensagem}.${Buffer.from(assinatura).toString("base64url")}`;
}

describe("sessão administrativa", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USER", usuario);
    vi.stubEnv("ADMIN_PASS", "senha-segura-para-testes");
    vi.stubEnv("JWT_SECRET", segredo);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-07T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("cria e valida um token com duração de oito horas", async () => {
    const token = await createSession(usuario);
    expect(sessionMaxAge).toBe(8 * 60 * 60);
    await expect(validateSession(token)).resolves.toBe(true);
  });

  it("não cria uma sessão para outro usuário nem sem configuração", async () => {
    await expect(createSession("outra pessoa")).rejects.toThrow("Invalid admin user");
    vi.stubEnv("JWT_SECRET", "");
    await expect(createSession(usuario)).rejects.toThrow("precisam estar configurados");
  });

  it("rejeita token ausente, longo, malformado ou assinado com outra chave", async () => {
    const token = await createSession(usuario);
    const partes = token.split(".");
    const assinaturaAlterada = `${partes[0]}.${partes[1]}.${partes[2].slice(0, -1)}x`;

    await expect(validateSession()).resolves.toBe(false);
    await expect(validateSession("x".repeat(2049))).resolves.toBe(false);
    await expect(validateSession("sem.partes.suficientes.aqui")).resolves.toBe(false);
    await expect(validateSession("!!!.e30.assinatura")).resolves.toBe(false);
    await expect(validateSession(assinaturaAlterada)).resolves.toBe(false);
  });

  it("rejeita cabeçalho que não declara HS256", async () => {
    const token = await assinarToken({ username: usuario, iat: 1794052800, exp: 1794081600 }, { alg: "none", typ: "JWT" });
    await expect(validateSession(token)).resolves.toBe(false);
  });

  it.each([
    { username: "outra pessoa", iat: 1794052800, exp: 1794081600 },
    { username: usuario, iat: 1794052801, exp: 1794081600 },
    { username: usuario, iat: 1794052800, exp: 1794052799 },
    { username: usuario, iat: 1794052800.5, exp: 1794081600 },
    { username: usuario, iat: 1794052800, exp: 1794081601 },
  ])("rejeita payload inválido", async (payload) => {
    const token = await assinarToken(payload);
    await expect(validateSession(token)).resolves.toBe(false);
  });

  it("rejeita tokens quando a configuração administrativa falha", async () => {
    const token = await createSession(usuario);
    vi.stubEnv("ADMIN_PASS", "curta");
    await expect(validateSession(token)).resolves.toBe(false);
  });
});
