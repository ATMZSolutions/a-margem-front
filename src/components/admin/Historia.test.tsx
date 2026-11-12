// @vitest-environment jsdom
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import Historia from "./Historia";

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
    Pagination: () => <div data-testid="pagination" />,
  };
});

describe("Historia", () => {
  let fetchMock: Mock;

  const dadosPadrao = {
    itens: [
      {
        id: "marco-1",
        ano: 2020,
        descricao: "Fundação do coletivo teatral na comunidade.",
        ordem: 0,
        estado: "PUBLICADO",
        midiaId: "mid-1",
        imageUrl: "/marco1.webp",
      },
    ],
    midias: [
      { id: "mid-1", url: "/marco1.webp", mime: "image/webp", bytes: 1024, nomeOriginal: "marco1.webp" },
      { id: "mid-2", url: "/marco2.webp", mime: "image/webp", bytes: 2048, nomeOriginal: "marco2.webp" },
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

  it("renderiza lista de marcos históricos", async () => {
    render(<Historia />);

    expect(await screen.findByText(/Ano 2020/i)).toBeInTheDocument();
    expect(screen.getByText(/Fundação do coletivo teatral/i)).toBeInTheDocument();
  });

  it("abre modal de edição com preview da imagem atual ao lado do seletor", async () => {
    const usuario = userEvent.setup();
    render(<Historia />);

    expect(await screen.findByText(/Ano 2020/i)).toBeInTheDocument();

    const botaoEditar = screen.getByRole("button", { name: "Editar" });
    await usuario.click(botaoEditar);

    expect(screen.getByRole("heading", { name: "Editar marco histórico" })).toBeInTheDocument();
    expect(screen.getByText("Imagem atual")).toBeInTheDocument();
    expect(screen.getByAltText("Imagem atual do marco")).toBeInTheDocument();
    expect(screen.getByLabelText("Ano")).toHaveValue("2020");
  });

  it("abre modal de novo marco histórico", async () => {
    const usuario = userEvent.setup();
    render(<Historia />);

    expect(await screen.findByText(/Ano 2020/i)).toBeInTheDocument();

    const botaoNovo = screen.getByRole("button", { name: /novo marco/i });
    await usuario.click(botaoNovo);

    expect(screen.getByRole("heading", { name: "Novo marco histórico" })).toBeInTheDocument();
    expect(screen.getByLabelText("Ano")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
  });
});
