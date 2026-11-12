// @vitest-environment jsdom
import type { ButtonHTMLAttributes, InputHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
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
    Pagination: ({ total, pageSize, onChange }: { total: number; pageSize: number; onChange: (pagina: number) => void }) => (
      <nav>
        {Array.from({ length: Math.ceil(total / pageSize) }, (_, indice) => (
          <button key={indice} type="button" onClick={() => onChange(indice + 1)}>{`Página ${indice + 1}`}</button>
        ))}
      </nav>
    ),
  };
});

const capturado = vi.hoisted(() => ({ props: null as null | Record<string, (...args: never[]) => unknown> }));

vi.mock("./subcomponents/NoticiaCard", async (importOriginal) => {
  const Original = (await importOriginal<typeof import("./subcomponents/NoticiaCard")>()).default;
  return {
    default: (props: React.ComponentProps<typeof Original>) => {
      capturado.props = props as unknown as typeof capturado.props;
      return <Original {...props} />;
    },
  };
});

type NoticiaTeste = { id?: number; titulo: string; conteudo: string; link: string };

function respostaJson(dados: unknown, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: { "content-type": "application/json" } });
}

describe("fluxo de notícias no painel", () => {
  let noticias: NoticiaTeste[];
  let buscar: Mock<(endereco: RequestInfo | URL, opcoes?: RequestInit) => Promise<Response>>;

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
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as notícias.");
    expect(screen.queryByText("Ainda não há notícias. Crie a primeira para começar.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova notícia" })).toBeDisabled();

    // Recupera pelo botão Tentar novamente
    await usuario.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Agenda cultural" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova notícia" })).toBeEnabled();
  });

  function falharMetodo(metodo: string) {
    const original = buscar.getMockImplementation()!;
    buscar.mockImplementation(async (endereco: RequestInfo | URL, opcoes?: RequestInit) =>
      opcoes?.method === metodo ? respostaJson({}, 500) : original(endereco, opcoes));
  }

  it("informa erro quando criar notícia falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    falharMetodo("POST");
    const usuario = userEvent.setup();
    render(<AdminNoticia />);
    await usuario.click(await screen.findByRole("button", { name: "Nova notícia" }));
    await usuario.type(screen.getByLabelText("Título"), "T");
    await usuario.type(screen.getByLabelText("Conteúdo"), "C");
    await usuario.type(screen.getByLabelText("Link"), "https://amargem.test/x");
    await usuario.click(screen.getByRole("button", { name: "Publicar notícia" }));
    await waitFor(() => expect(mocks.modal.error).toHaveBeenCalledWith(expect.objectContaining({ content: "Não foi possível criar a notícia." })));
  });

  it("cancela a edição e informa erro quando atualizar falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    noticias = [{ id: 1, titulo: "Original", conteudo: "Texto", link: "https://amargem.test/o" }];
    falharMetodo("PUT");
    const usuario = userEvent.setup();
    render(<AdminNoticia />);
    await usuario.click(await screen.findByRole("button", { name: "Editar" }));
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { name: "Original" })).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Editar" }));
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.modal.error).toHaveBeenCalledWith(expect.objectContaining({ content: "Não foi possível atualizar a notícia." })));
  });

  it("ignora exclusão sem identificador", async () => {
    noticias = [{ id: 1, titulo: "Com id", conteudo: "A", link: "" }];
    render(<AdminNoticia />);
    await screen.findByRole("heading", { name: "Com id" });

    await act(async () => {
      await (capturado.props!.onDelete as (id?: number) => Promise<void>)(undefined);
    });
    expect(mocks.modal.confirm).not.toHaveBeenCalled();
    expect(buscar).not.toHaveBeenCalledWith("/api/admin/noticias", expect.objectContaining({ method: "PUT" }));
  });

  it("trata resposta nula como lista vazia", async () => {
    buscar.mockImplementation(async () => respostaJson(null));
    render(<AdminNoticia />);
    expect(await screen.findByText("Ainda não há notícias. Crie a primeira para começar.")).toBeInTheDocument();
  });

  it("abre o formulário pelo estado vazio e limpa o filtro", async () => {
    const usuario = userEvent.setup();
    const { unmount } = render(<AdminNoticia />);
    await usuario.click(await screen.findByRole("button", { name: "Criar primeira notícia" }));
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByLabelText("Título")).not.toBeInTheDocument();
    unmount();

    limparCacheAdministrativo();
    noticias = [{ id: 1, titulo: "Agenda", conteudo: "A", link: "" }];
    render(<AdminNoticia />);
    await usuario.type(await screen.findByRole("textbox", { name: "Buscar notícias por título" }), "xyz");
    await usuario.click(screen.getByRole("button", { name: "Limpar filtro" }));
    expect(screen.getByRole("heading", { name: "Agenda" })).toBeInTheDocument();
  });

  it("volta à página anterior ao excluir o último item e trata falha na exclusão", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    noticias = [1, 2, 3, 4].map((id) => ({ id, titulo: `Notícia ${id}`, conteudo: "x", link: "" }));
    buscar.mockImplementation(async (_endereco: RequestInfo | URL, opcoes?: RequestInit) => {
      if (opcoes?.method === "DELETE") {
        if (opcoes.method === "DELETE" && String(_endereco).endsWith("id=4")) {
          noticias = noticias.filter((n) => n.id !== 4);
          return respostaJson({ ok: true });
        }
        return respostaJson({}, 500);
      }
      return respostaJson(noticias);
    });
    const usuario = userEvent.setup();
    render(<AdminNoticia />);
    await usuario.click(await screen.findByRole("button", { name: "Página 2" }));
    expect(screen.getByRole("heading", { name: "Notícia 4" })).toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Excluir" }));
    await (mocks.modal.confirm.mock.calls.at(-1)?.[0] as { onOk: () => Promise<void> }).onOk();
    expect(await screen.findByRole("heading", { name: "Notícia 1" })).toBeInTheDocument();

    await usuario.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    await (mocks.modal.confirm.mock.calls.at(-1)?.[0] as { onOk: () => Promise<void> }).onOk();
    expect(mocks.modal.error).toHaveBeenCalledWith(expect.objectContaining({ content: "Não foi possível excluir a notícia." }));
  });
});
