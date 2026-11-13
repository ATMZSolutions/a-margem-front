// @vitest-environment jsdom
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import AdminContatos from "./Contatos";

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
    Tag: ({ children }: PropsWithChildren) => <span>{children}</span>,
  };
});

describe("AdminContatos", () => {
  let fetchMock: Mock;

  const dadosPadrao = {
    canais: [
      {
        id: "canal-1",
        tipo: "whatsapp",
        rotulo: "WhatsApp Produção",
        url: "https://wa.me/551199999999",
        ordem: 0,
        ativo: true,
      },
      {
        id: "canal-2",
        tipo: "instagram",
        rotulo: "Instagram Oficial",
        url: "https://instagram.com/coletivoamargem",
        ordem: 1,
        ativo: false,
      },
    ],
    pagina: {
      titulo: "Fale Conosco",
      fundo: { midiaId: "mid-1", origem: null, url: "/fundo.webp", alt: "Fundo" },
      logo: { midiaId: "mid-2", origem: null, url: "/logo.webp", alt: "Logo" },
    },
    midias: [
      { id: "mid-1", url: "/fundo.webp", mime: "image/webp", bytes: 1024, nomeOriginal: "fundo.webp" },
      { id: "mid-2", url: "/logo.webp", mime: "image/webp", bytes: 2048, nomeOriginal: "logo.webp" },
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

  it("renderiza canais cadastrados com cabeçalho e busca", async () => {
    render(<AdminContatos />);

    expect(await screen.findByText("WhatsApp Produção")).toBeInTheDocument();
    expect(screen.getByText("Instagram Oficial")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contatos" })).toBeInTheDocument();
  });

  it("exibe estado de erro e botão de tentar novamente quando a carga falha", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Falha na rede"));
    render(<AdminContatos />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os canais");
    const botaoTentar = screen.getByRole("button", { name: "Tentar novamente" });
    expect(botaoTentar).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => dadosPadrao,
    });
    await act(async () => {
      fireEvent.click(botaoTentar);
    });

    expect(await screen.findByText("WhatsApp Produção")).toBeInTheDocument();
  });

  it("abre modal de configuração da página exibindo previews das imagens atuais", async () => {
    const usuario = userEvent.setup();
    render(<AdminContatos />);

    expect(await screen.findByText("WhatsApp Produção")).toBeInTheDocument();

    const botaoConfig = screen.getByRole("button", { name: /configurar página/i });
    await usuario.click(botaoConfig);

    expect(screen.getByRole("heading", { name: "Configurar página de contato" })).toBeInTheDocument();
    expect(screen.getByText("Fundo atual")).toBeInTheDocument();
    expect(screen.getByText("Logo atual")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fale Conosco")).toBeInTheDocument();
  });

  it("abre modal de novo canal com validações de campo", async () => {
    const usuario = userEvent.setup();
    render(<AdminContatos />);

    expect(await screen.findByText("WhatsApp Produção")).toBeInTheDocument();

    const botaoNovo = screen.getByRole("button", { name: /novo canal/i });
    await usuario.click(botaoNovo);

    expect(screen.getByRole("heading", { name: "Novo canal de contato" })).toBeInTheDocument();
    expect(screen.getByLabelText(/rótulo exibido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/url \/ link do canal/i)).toBeInTheDocument();
  });

  it("filtra canais de acordo com o texto digitado na busca", async () => {
    render(<AdminContatos />);

    expect(await screen.findByText("WhatsApp Produção")).toBeInTheDocument();
    const inputBusca = screen.getByPlaceholderText(/filtrar por rótulo/i);

    fireEvent.change(inputBusca, { target: { value: "Instagram" } });

    await waitFor(() => {
      expect(screen.queryByText("WhatsApp Produção")).not.toBeInTheDocument();
      expect(screen.getByText("Instagram Oficial")).toBeInTheDocument();
    });
  });
});

