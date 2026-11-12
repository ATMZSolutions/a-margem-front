// @vitest-environment jsdom
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import AdminProjeto from "./Projeto";
import { limparCacheAdministrativo } from "@/lib/cache-administrativo";

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

describe("AdminProjeto", () => {
  let fetchMock: Mock;

  const projetosMock = [
    {
      id: 1,
      data: "2026-05-10T00:00:00.000Z",
      descricao: "Oficina comunitária de teatro de rua realizada na periferia.",
    },
    {
      id: 2,
      data: "2026-06-15T00:00:00.000Z",
      descricao: "Circulação do espetáculo Xirê em três praças públicas.",
    },
  ];

  beforeEach(() => {
    limparCacheAdministrativo();
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => projetosMock,
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renderiza lista de projetos cadastrados", async () => {
    render(<AdminProjeto />);

    expect(await screen.findByText(/Oficina comunitária de teatro de rua/i)).toBeInTheDocument();
    expect(screen.getByText(/Circulação do espetáculo Xirê/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Projetos" })).toBeInTheDocument();
  });

  it("abre modal de novo projeto e valida campos com CampoAdmin", async () => {
    const usuario = userEvent.setup();
    render(<AdminProjeto />);

    expect(await screen.findByText(/Oficina comunitária/i)).toBeInTheDocument();

    const botaoNovo = screen.getByRole("button", { name: /novo projeto/i });
    await usuario.click(botaoNovo);

    expect(screen.getByRole("heading", { name: "Novo projeto" })).toBeInTheDocument();
    expect(screen.getByLabelText("Data")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
  });

  it("filtra projetos pela descrição", async () => {
    render(<AdminProjeto />);

    expect(await screen.findByText(/Oficina comunitária/i)).toBeInTheDocument();
    const inputBusca = screen.getByPlaceholderText(/filtrar por descrição/i);

    fireEvent.change(inputBusca, { target: { value: "Xirê" } });

    await waitFor(() => {
      expect(screen.queryByText(/Oficina comunitária/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Circulação do espetáculo Xirê/i)).toBeInTheDocument();
    });
  });

  it("solicita confirmação de exclusão ao clicar no botão excluir", async () => {
    render(<AdminProjeto />);

    expect(await screen.findByText(/Oficina comunitária/i)).toBeInTheDocument();

    const botoesExcluir = screen.getAllByRole("button", { name: /excluir/i });
    fireEvent.click(botoesExcluir[0]);

    expect(mocks.modal.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Confirmar exclusão",
        content: "Tem certeza que deseja excluir este projeto?",
      })
    );
  });
});

