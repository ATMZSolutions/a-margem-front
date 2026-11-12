// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CampoAdmin, { validarCampo } from "./CampoAdmin";

describe("validarCampo", () => {
  it("valida campos obrigatórios vazios ou preenchidos", () => {
    expect(validarCampo("", { required: true })).toBe("Este campo é obrigatório.");
    expect(validarCampo("   ", { required: true })).toBe("Este campo é obrigatório.");
    expect(validarCampo("", { required: false })).toBeNull();
    expect(validarCampo("Texto válido", { required: true })).toBeNull();
  });

  it("detecta caracteres proibidos como tags HTML", () => {
    expect(validarCampo("Texto com <tag>", { proibirHtml: true })).toBe("Caracteres especiais < e > não são permitidos.");
    expect(validarCampo("Texto com >", { proibirHtml: true })).toBe("Caracteres especiais < e > não são permitidos.");
    expect(validarCampo("Texto com <tag>", { proibirHtml: false })).toBeNull();
  });

  it("valida comprimento mínimo e máximo", () => {
    expect(validarCampo("ab", { minLen: 3 })).toBe("Mínimo de 3 caracteres (atual: 2).");
    expect(validarCampo("abcde", { maxLen: 4 })).toBe("Limite de 4 caracteres excedido (atual: 5).");
    expect(validarCampo("abcd", { minLen: 2, maxLen: 5 })).toBeNull();
  });

  it("valida URLs com regras de espaços e esquema", () => {
    expect(validarCampo("https://amargem.com com espaco", { tipo: "url" })).toBe("URLs não podem conter espaços em branco.");
    expect(validarCampo("ftp://amargem.com", { tipo: "url" })).toBe("URL deve iniciar com https://, http://, mailto:, tel: ou /");
    expect(validarCampo("javascript:alert(1)", { tipo: "url" })).toBe("URL deve iniciar com https://, http://, mailto:, tel: ou /");
    expect(validarCampo("https://instagram.com/amargem", { tipo: "url" })).toBeNull();
    expect(validarCampo("http://amargem.com", { tipo: "url" })).toBeNull();
    expect(validarCampo("mailto:contato@amargem.com", { tipo: "url" })).toBeNull();
    expect(validarCampo("tel:+551199999999", { tipo: "url" })).toBeNull();
    expect(validarCampo("/sobre", { tipo: "url" })).toBeNull();
  });

  it("valida campo do tipo ano", () => {
    expect(validarCampo("20a6", { tipo: "year" })).toBe("Ano deve conter exatamente 4 dígitos numéricos (ex: 2026).");
    expect(validarCampo("26", { tipo: "year" })).toBe("Ano deve conter exatamente 4 dígitos numéricos (ex: 2026).");
    expect(validarCampo("1800", { tipo: "year" })).toBe("Ano deve estar entre 1900 e 2100.");
    expect(validarCampo("2150", { tipo: "year" })).toBe("Ano deve estar entre 1900 e 2100.");
    expect(validarCampo("2026", { tipo: "year" })).toBeNull();
  });

  it("valida campos numéricos com limites", () => {
    expect(validarCampo("abc", { tipo: "number" })).toBe("Informe um número válido.");
    expect(validarCampo("-5", { tipo: "number", min: 0 })).toBe("O valor mínimo permitido é 0.");
    expect(validarCampo("150", { tipo: "number", max: 100 })).toBe("O valor máximo permitido é 100.");
    expect(validarCampo("50", { tipo: "number", min: 0, max: 100 })).toBeNull();
  });
});

describe("CampoAdmin", () => {
  it("renderiza input padrão com label, placeholder e contador de caracteres", () => {
    const handleChange = vi.fn();
    render(
      <CampoAdmin
        id="titulo"
        label="Título do evento"
        value="Apresentação"
        onChange={handleChange}
        maxLen={50}
        placeholder="Digite o título"
        required
        ajuda="Informe o título oficial."
      />
    );

    expect(screen.getByLabelText(/Título do evento/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite o título")).toHaveValue("Apresentação");
    expect(screen.getByText("12 / 50")).toBeInTheDocument();
    expect(screen.getByText("Informe o título oficial.")).toBeInTheDocument();

    const input = screen.getByLabelText(/Título do evento/);
    fireEvent.change(input, { target: { value: "Novo título" } });
    expect(handleChange).toHaveBeenCalledWith("Novo título");
  });

  it("renderiza textarea quando o tipo for textarea", () => {
    const handleChange = vi.fn();
    render(
      <CampoAdmin
        label="Descrição"
        value="Texto longo"
        tipo="textarea"
        linhas={6}
        onChange={handleChange}
      />
    );

    const textarea = screen.getByLabelText("Descrição") as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.rows).toBe(6);
    fireEvent.change(textarea, { target: { value: "Texto alterado" } });
    expect(handleChange).toHaveBeenCalledWith("Texto alterado");
  });

  it("exibe mensagem de erro quando a validação falhar ou receber erro externo", () => {
    const { rerender } = render(
      <CampoAdmin
        label="Título"
        value="Texto com <script>"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Caracteres especiais < e > não são permitidos.");

    rerender(
      <CampoAdmin
        label="Título"
        value="Texto válido"
        erroExterno="Erro fornecido pelo backend"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Erro fornecido pelo backend");
  });

  it("altera a cor do contador quando próximo ou ultrapassando o limite", () => {
    const { rerender } = render(
      <CampoAdmin
        label="Código"
        value="123456789" // 9/10 = 90%
        maxLen={10}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("9 / 10")).toHaveClass("text-amber-600");

    rerender(
      <CampoAdmin
        label="Código"
        value="12345678901" // 11/10 = >100%
        maxLen={10}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText("11 / 10")).toHaveClass("text-red-600");
  });

  it("renderiza input com tipo url e renderiza texto de ajuda quando não há erro", () => {
    render(
      <CampoAdmin
        label="Link"
        value="https://amargem.com"
        tipo="url"
        ajuda="Informe a URL completa"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Link")).toHaveAttribute("type", "url");
    expect(screen.getByText("Informe a URL completa")).toBeInTheDocument();
  });

  it("renderiza input com tipo year e sem texto de ajuda quando não fornecido", () => {
    render(
      <CampoAdmin
        label="Ano de estreia"
        value="2026"
        tipo="year"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Ano de estreia")).toHaveAttribute("type", "text");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lida corretamente com valor nulo ou indefinido", () => {
    render(
      <CampoAdmin
        label="Campo vazio"
        value={null as unknown as string}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Campo vazio")).toHaveValue("");
  });
});
