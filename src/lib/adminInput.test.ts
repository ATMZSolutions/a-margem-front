import { describe, expect, it } from "vitest";
import { decodeImageData, isPositiveInteger, isText, readJsonObject } from "./adminInput";

function criarRequisicao(corpo: string, cabecalhos: Record<string, string> = { "content-type": "application/json" }) {
  return new Request("http://localhost/api/admin", {
    method: "POST",
    headers: cabecalhos,
    body: corpo,
  });
}

function codificar(bytes: number[]) {
  return Buffer.from(bytes).toString("base64");
}

describe("readJsonObject", () => {
  it("lê um objeto JSON com tipo de conteúdo parametrizado", async () => {
    await expect(readJsonObject(criarRequisicao('{"titulo":"Notícia"}', {
      "content-type": "Application/JSON; charset=utf-8",
    }))).resolves.toEqual({ titulo: "Notícia" });
  });

  it("rejeita cabeçalho ausente ou tipo de conteúdo incompatível", async () => {
    await expect(readJsonObject(criarRequisicao("{}", {}))).resolves.toBeNull();
    await expect(readJsonObject(criarRequisicao("{}", { "content-type": "text/plain" }))).resolves.toBeNull();
  });

  it("rejeita requisição sem corpo, JSON inválido e arrays", async () => {
    const semCorpo = new Request("http://localhost/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    await expect(readJsonObject(semCorpo)).resolves.toBeNull();
    await expect(readJsonObject(criarRequisicao("{ inválido"))).resolves.toBeNull();
    await expect(readJsonObject(criarRequisicao("[]"))).resolves.toBeNull();
  });

  it("recusa corpo acima do limite declarado e do limite lido", async () => {
    await expect(readJsonObject(criarRequisicao("{}", {
      "content-type": "application/json",
      "content-length": "99999999",
    }))).resolves.toBeNull();

    await expect(readJsonObject(criarRequisicao("x".repeat(8 * 1024 * 1024)))).resolves.toBeNull();
  });
});

describe("isText", () => {
  it("aceita texto não vazio dentro do limite", () => {
    expect(isText(" notícia ", 20)).toBe(true);
    expect(isText("a", 1)).toBe(true);
  });

  it.each(["", "   ", 12, null, undefined, "longo"])("rejeita valor inválido %j", (valor) => {
    expect(isText(valor, 4)).toBe(false);
  });
});

describe("isPositiveInteger", () => {
  it("aceita inteiro positivo seguro", () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1", NaN])("rejeita valor inválido %j", (valor) => {
    expect(isPositiveInteger(valor)).toBe(false);
  });
});

describe("decodeImageData", () => {
  it.each([
    { assinatura: [0xff, 0xd8, 0xff, 0x00], mime: "image/jpeg" },
    { assinatura: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00], mime: "image/png" },
    { assinatura: [...Buffer.from("RIFF"), 0x00, 0x00, 0x00, 0x00, ...Buffer.from("WEBP")], mime: "image/webp" },
  ])("decodifica a assinatura válida de $mime", ({ assinatura, mime }) => {
    const resultado = decodeImageData(codificar(assinatura), mime);
    expect(resultado).toEqual(Buffer.from(assinatura));
  });

  it("rejeita tipo MIME divergente e dados que não sejam imagens suportadas", () => {
    expect(decodeImageData(codificar([0xff, 0xd8, 0xff]), "image/png")).toBeNull();
    expect(decodeImageData(codificar([0, 1, 2, 3]), "image/png")).toBeNull();
  });

  it.each(["", "%%%", "YQ==", 4, null, undefined])("rejeita conteúdo base64 inválido %j", (valor) => {
    expect(decodeImageData(valor, "image/jpeg")).toBeNull();
  });

  it("rejeita imagens que excedem cinco MiB", () => {
    const bytes = Buffer.alloc(5 * 1024 * 1024 + 1);
    bytes.set([0xff, 0xd8, 0xff]);
    expect(decodeImageData(bytes.toString("base64"), "image/jpeg")).toBeNull();
  });
});
