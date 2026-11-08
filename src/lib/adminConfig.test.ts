import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminConfig } from "./adminConfig";

describe("getAdminConfig", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_USER", "administradora");
    vi.stubEnv("ADMIN_PASS", "senha-administrativa-segura");
    vi.stubEnv("JWT_SECRET", "segredo-administrativo-com-mais-de-32-bytes");
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(["ADMIN_USER", "ADMIN_PASS", "JWT_SECRET"])("rejeita configuração sem %s", (variavel) => {
    vi.stubEnv(variavel, "");
    expect(() => getAdminConfig()).toThrow("precisam estar configurados");
  });

  it("remove espaços externos do usuário e preserva os demais valores", () => {
    vi.stubEnv("ADMIN_USER", "  administradora  ");
    expect(getAdminConfig()).toEqual({
      username: "administradora",
      password: "senha-administrativa-segura",
      jwtSecret: "segredo-administrativo-com-mais-de-32-bytes",
    });
  });

  it("rejeita senha curta ou igual ao usuário", () => {
    vi.stubEnv("ADMIN_PASS", "curta");
    expect(() => getAdminConfig()).toThrow("pelo menos 16 caracteres");

    vi.stubEnv("ADMIN_PASS", "administradora");
    expect(() => getAdminConfig()).toThrow("diferente do usuário");
  });

  it("valida o segredo JWT pelo tamanho em bytes", () => {
    vi.stubEnv("JWT_SECRET", "a".repeat(31));
    expect(() => getAdminConfig()).toThrow("pelo menos 32 bytes");

    vi.stubEnv("JWT_SECRET", "a".repeat(32));
    expect(getAdminConfig().jwtSecret).toBe("a".repeat(32));
  });
});
