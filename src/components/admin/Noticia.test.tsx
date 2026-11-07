// @vitest-environment jsdom
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limparCacheAdministrativo } from "@/lib/cache-administrativo";
import AdminNoticia from "./Noticia";

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
  type PropsBusca = InputHTMLAttributes<HTMLInputElement> & { allowClear?: boolean; variant?: string };

  function Botao({ children, htmlType = "button", loading, danger: _danger, icon: _icon, type: _type, ...props }: PropsWithChildren<PropsBotao>) {
    void _danger;
    void _icon;
    void _type;
    return <button {...props} type={htmlType} disabled={props.disabled || loading}>{children}</button>;
  }
  function Busca({ allowClear: _allowClear, variant: _variant, ...props }: PropsBusca) {
    void _allowClear;
    void _variant;
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
    Pagination: () => null,
  };
});

type NoticiaTeste = { id: number; titulo: string; conteudo: string; link: string };

function respostaJson(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { "content-type": "application/json" } });
}

describe("fluxo de notícias no painel", () => {
  let noticias: NoticiaTeste[];
  let buscar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    limparCacheAdministrativo();
    noticias = [];
    buscar = vi.fn(async (_endereco: RequestInfo | URL, opcoes?: RequestInit) => {
      if (opcoes?.method === "POST") {
        const conteudo = JSON.parse(opcoes.body as string) as Omit<NoticiaTeste, "id">;
        noticias = [{ id: 1, ...conteudo }];
        return respostaJson({ id: 1 }, 201);
      }
      if (opcoes?.method === "PUT") {
        noticias = [{ ...noticias[0], ...(JSON.parse(opcoes.body as string) as Partial<NoticiaTeste>) }];
        return respostaJson({ id: 1 });
      }
      if (opcoes?.method === "DELETE") {
        noticias = [];
        return respostaJson({ ok: true });
      }
      return respostaJson(noticias);
    });
    vi.stubGlobal("fetch", buscar);
    mocks.modal.error.mockClear();
    mocks.modal.success.mockClear();
    mocks.modal.confirm.mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("cria e publica notícia, atualiza a lista e confirma sucesso", async () => {
    const usuario = userEvent.setup();
    render(<AdminNoticia />);
    await waitFor(() => expect(buscar).toHaveBeenCalledWith("/api/admin/noticias", { credentials: "include" }));

    await usuario.click(screen.getByRole("button", { name: "Nova notícia" }));
    await usuario.type(screen.getByLabelText("Título"), "Estreia do espetáculo");
    await usuario.type(screen.getByLabelText("Conteúdo"), "Apresentação no Recife.");
    await usuario.type(screen.getByLabelText("Link"), "https://amargem.test/noticia");
    await usuario.click(screen.getByRole("button", { name: "Publicar notícia" }));

    expect(await screen.findByRole("heading", { name: "Estreia do espetáculo" })).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledWith("/api/admin/noticias", expect.objectContaining({ method: "POST" }));
    expect(mocks.modal.success).toHaveBeenCalled();
  });

  it("edita e exclui notícia por meio das ações do item", async () => {
    noticias = [{ id: 1, titulo: "Título antigo", conteudo: "Texto original", link: "https://amargem.test/antiga" }];
    const usuario = userEvent.setup();
    render(<AdminNoticia />);
    expect(await screen.findByRole("heading", { name: "Título antigo" })).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    const titulo = screen.getByLabelText("Título");
    await usuario.clear(titulo);
    await usuario.type(titulo, "Título atualizado");
    await usuario.clear(screen.getByLabelText("Conteúdo"));
    await usuario.type(screen.getByLabelText("Conteúdo"), "Texto revisado.");
    await usuario.clear(screen.getByLabelText("Link"));
    await usuario.type(screen.getByLabelText("Link"), "https://amargem.test/atualizada");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(await screen.findByRole("heading", { name: "Título atualizado" })).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledWith("/api/admin/noticias", expect.objectContaining({ method: "PUT" }));

    await usuario.click(screen.getByRole("button", { name: "Excluir" }));
    expect(mocks.modal.confirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Confirmar exclusão" }));
    const confirmacao = mocks.modal.confirm.mock.calls.at(-1)?.[0] as { onOk: () => Promise<void> };
    await confirmacao.onOk();
    expect(buscar).toHaveBeenCalledWith("/api/admin/noticias?id=1", { method: "DELETE" });
    expect(await screen.findByText("Ainda não há notícias. Crie a primeira para começar.")).toBeInTheDocument();
  });

  it("filtra a lista e mostra erro de carregamento", async () => {
    noticias = [
      { id: 1, titulo: "Agenda cultural", conteudo: "Uma publicação.", link: "" },
      { id: 2, titulo: "Oficina de teatro", conteudo: "Outra publicação.", link: "" },
    ];
    const usuario = userEvent.setup();
    const { unmount } = render(<AdminNoticia />);
    expect(await screen.findByRole("heading", { name: "Agenda cultural" })).toBeInTheDocument();
    await usuario.type(screen.getByRole("textbox", { name: "Buscar notícias por título" }), "Oficina");
    expect(screen.getByRole("heading", { name: "Oficina de teatro" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Agenda cultural" })).not.toBeInTheDocument();

    unmount();
    limparCacheAdministrativo();
    buscar.mockRejectedValueOnce(new Error("sem conexão"));
    render(<AdminNoticia />);
    await waitFor(() => expect(mocks.modal.error).toHaveBeenCalled());
  });
});
