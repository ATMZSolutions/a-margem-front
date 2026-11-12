// @vitest-environment jsdom
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import BibliotecaMidia from "./BibliotecaMidia";

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

  function Botao({ children, htmlType = "button", loading, danger: _danger, icon: _icon, type: _type, ...props }: PropsWithChildren<PropsBotao>) {
    void _danger;
    void _icon;
    void _type;
    return <button {...props} type={htmlType} disabled={props.disabled || loading}>{children}</button>;
  }
  function Provedor({ children }: PropsWithChildren) {
    return <>{children}</>;
  }

  return {
    Button: Botao,
    ConfigProvider: Provedor,
    Modal: { useModal: () => [mocks.modal, null] },
  };
});

describe("BibliotecaMidia", () => {
  let fetchMock: Mock;

  const midiasMock = [
    {
      id: "mid-1",
      url: "/foto1.webp",
      mime: "image/webp",
      bytes: 2048,
      largura: 800,
      altura: 600,
      nomeOriginal: "Foto do Espetáculo Xirê",
      criadoEm: "2026-01-01T00:00:00.000Z",
      semVinculoDesde: null,
      usos: [
        {
          chave: "Espetaculo:xire:capa",
          area: "espetaculos",
          registro: "Xirê",
          campo: "Capa do espetáculo",
          textoAlternativo: null,
          legenda: null,
          credito: null,
        },
      ],
      quantidadeUsos: 1,
      semVinculosDetectados: false,
    },
  ];

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => midiasMock,
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renderiza catálogo de imagens com contadores e usos", async () => {
    render(<BibliotecaMidia />);

    expect(await screen.findByRole("heading", { name: "Biblioteca de imagens" })).toBeInTheDocument();
    expect(screen.getByText("Foto do Espetáculo Xirê")).toBeInTheDocument();
    expect(screen.getByText(/1 arquivo no catálogo/i)).toBeInTheDocument();
    expect(screen.getByText(/Espetáculos/i)).toBeInTheDocument();
  });

  it("abre modal para editar nome da imagem e salva com CampoAdmin", async () => {
    const usuario = userEvent.setup();
    render(<BibliotecaMidia />);

    expect(await screen.findByText("Foto do Espetáculo Xirê")).toBeInTheDocument();

    const botaoEditarNome = screen.getByRole("button", { name: /editar nome/i });
    await usuario.click(botaoEditarNome);

    expect(screen.getByRole("heading", { name: "Editar nome da imagem" })).toBeInTheDocument();
    const inputNome = screen.getByLabelText("Nome da imagem / arquivo");
    expect(inputNome).toHaveValue("Foto do Espetáculo Xirê");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "mid-1", nomeOriginal: "Xirê - Foto Principal" }),
    });

    await usuario.clear(inputNome);
    await usuario.type(inputNome, "Xirê - Foto Principal");

    const botaoSalvar = screen.getByRole("button", { name: "Salvar nome" });
    await usuario.click(botaoSalvar);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/midias",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ id: "mid-1", nomeOriginal: "Xirê - Foto Principal" }),
        })
      );
    });
  });

  it("aciona confirmação antes de reconciliar com o Storage", async () => {
    render(<BibliotecaMidia />);

    expect(await screen.findByRole("heading", { name: "Biblioteca de imagens" })).toBeInTheDocument();

    const botaoReconciliar = screen.getByRole("button", { name: /reconciliar storage/i });
    fireEvent.click(botaoReconciliar);

    expect(mocks.modal.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Reconciliar referências e Storage",
      })
    );
  });
});

