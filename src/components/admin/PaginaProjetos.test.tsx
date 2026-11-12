// @vitest-environment jsdom
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import PaginaProjetos from "./PaginaProjetos";

const mocks = vi.hoisted(() => ({
  modal: { error: vi.fn(), success: vi.fn(), confirm: vi.fn() },
}));

vi.mock("antd", () => {
  type PropsBotao = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    type?: string;
    htmlType?: "button" | "submit" | "reset";
    loading?: boolean;
    danger?: boolean;
    icon?: ReactNode;
  };
  type PropsBusca = InputHTMLAttributes<HTMLInputElement> & { allowClear?: boolean };

  function Botao({ children, htmlType = "button", loading, danger: _danger, icon: _icon, type: _type, ...props }: PropsWithChildren<PropsBotao>) {
    void _danger;
    void _icon;
    void _type;
    return <button {...props} type={htmlType} disabled={props.disabled || loading}>{children}</button>;
  }
  function Busca({ allowClear: _allowClear, ...props }: PropsBusca) {
    void _allowClear;
    return <input {...props} />;
  }
  function Provedor({ children }: PropsWithChildren) {
    return <>{children}</>;
  }

  return {
    Button: Botao,
    ConfigProvider: Provedor,
    Input: { Search: Busca },
    Modal: { useModal: () => [mocks.modal, null] },
  };
});

describe("PaginaProjetos", () => {
  let fetchMock: Mock;

  const dadosPadrao = {
    pagina: {
      introducao: "Apresentação de projetos do coletivo teatral.",
      tituloTrajetoria: "Trajetória e Obras",
      fundo: { midiaId: "mid-bg", origem: null, url: "/bg-projetos.webp", alt: "Fundo" },
    },
    fotos: [
      {
        id: "foto-1",
        midiaId: "mid-1",
        url: "/galeria1.webp",
        textoAlternativo: "Ensaio do espetáculo",
        legenda: "Ensaio geral aberto à comunidade",
        credito: "Foto por Coletivo",
        dataEditorial: "2026-04-01",
        ordem: 0,
      },
    ],
    midias: [
      { id: "mid-bg", url: "/bg-projetos.webp", mime: "image/webp", bytes: 1024, nomeOriginal: "bg.webp" },
      { id: "mid-1", url: "/galeria1.webp", mime: "image/webp", bytes: 2048, nomeOriginal: "galeria1.webp" },
    ],
  };

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => dadosPadrao,
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renderiza cabeçalho e fotos da galeria", async () => {
    render(<PaginaProjetos />);

    expect(await screen.findByRole("heading", { name: "Galeria de projetos" })).toBeInTheDocument();
    expect(screen.getByText("Ensaio geral aberto à comunidade")).toBeInTheDocument();
  });

  it("abre modal de configurações da página exibindo preview do fundo atual", async () => {
    const usuario = userEvent.setup();
    render(<PaginaProjetos />);

    expect(await screen.findByRole("heading", { name: "Galeria de projetos" })).toBeInTheDocument();

    const botaoConfig = screen.getByRole("button", { name: /configurações da página/i });
    await usuario.click(botaoConfig);

    expect(screen.getByRole("heading", { name: "Configurações da página de projetos" })).toBeInTheDocument();
    expect(screen.getByText("Fundo atual")).toBeInTheDocument();
    expect(screen.getByAltText("Imagem de fundo atual")).toBeInTheDocument();
    expect(screen.getByLabelText("Título da trajetória")).toHaveValue("Trajetória e Obras");
  });

  it("abre modal de edição de foto da galeria exibindo preview da foto atual", async () => {
    const usuario = userEvent.setup();
    render(<PaginaProjetos />);

    expect(await screen.findByText("Ensaio geral aberto à comunidade")).toBeInTheDocument();

    const botaoEditar = screen.getByRole("button", { name: "Editar" });
    await usuario.click(botaoEditar);

    expect(screen.getByRole("heading", { name: "Editar foto da galeria" })).toBeInTheDocument();
    expect(screen.getByText("Foto atual")).toBeInTheDocument();
    expect(screen.getByAltText("Foto atual da galeria")).toBeInTheDocument();
    expect(screen.getByLabelText("Texto alternativo")).toHaveValue("Ensaio do espetáculo");
  });

  it("abre modal de nova foto da galeria", async () => {
    const usuario = userEvent.setup();
    render(<PaginaProjetos />);

    expect(await screen.findByRole("heading", { name: "Galeria de projetos" })).toBeInTheDocument();

    const botaoNova = screen.getByRole("button", { name: /nova foto na galeria/i });
    await usuario.click(botaoNova);

    expect(screen.getByRole("heading", { name: "Nova foto da galeria" })).toBeInTheDocument();
    expect(screen.getByLabelText("Texto alternativo")).toBeInTheDocument();
    expect(screen.getByLabelText("Legenda")).toBeInTheDocument();
  });
});

