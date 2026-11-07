// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { limparCacheAdministrativo, lerDadosCacheados, obterDadosCacheados } from "@/lib/cache-administrativo";
import LoginPage from "./page";

const { navegar } = vi.hoisted(() => ({ navegar: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: navegar }) }));

function respostaJson(dados: unknown, status: number) {
  return new Response(JSON.stringify(dados), { status, headers: { "content-type": "application/json" } });
}

describe("login administrativo", () => {
  beforeEach(() => {
    limparCacheAdministrativo();
    navegar.mockClear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it("mostra e oculta senha por ação explícita", async () => {
    const usuario = userEvent.setup();
    render(<LoginPage />);
    const senha = screen.getByLabelText("Senha");
    expect(senha).toHaveAttribute("type", "password");
    await usuario.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");
    await usuario.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(senha).toHaveAttribute("type", "password");
  });

  it("informa erro devolvido pelo servidor e mantém a página de login", async () => {
    const usuario = userEvent.setup();
    const buscar = vi.fn().mockResolvedValue(respostaJson({ error: "Credenciais inválidas" }, 401));
    vi.stubGlobal("fetch", buscar);
    render(<LoginPage />);

    await usuario.type(screen.getByLabelText("Nome de usuário"), "administradora");
    await usuario.type(screen.getByLabelText("Senha"), "senha incorreta");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas");
    expect(navegar).not.toHaveBeenCalled();
    expect(buscar).toHaveBeenCalledWith("/api/admin/auth", expect.objectContaining({ method: "POST", credentials: "include" }));
  });

  it("usa mensagem de contingência quando o servidor não devolve JSON", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("resposta inválida", { status: 500 })));
    render(<LoginPage />);

    await usuario.type(screen.getByLabelText("Nome de usuário"), "administradora");
    await usuario.type(screen.getByLabelText("Senha"), "senha de teste");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível entrar.");
  });

  it("avisa sobre falha de rede sem limpar os campos", async () => {
    const usuario = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<LoginPage />);

    await usuario.type(screen.getByLabelText("Nome de usuário"), "administradora");
    await usuario.type(screen.getByLabelText("Senha"), "senha de teste");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Verifique sua conexão");
    expect(screen.getByLabelText("Senha")).toHaveValue("senha de teste");
  });

  it("limpa o cache e navega ao autenticar", async () => {
    const usuario = userEvent.setup();
    await obterDadosCacheados("admin:noticias", async () => [{ id: 1 }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respostaJson({ ok: true }, 200)));
    render(<LoginPage />);

    await usuario.type(screen.getByLabelText("Nome de usuário"), "administradora");
    await usuario.type(screen.getByLabelText("Senha"), "senha correta");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(navegar).toHaveBeenCalledWith("/admin"));
    expect(lerDadosCacheados("admin:noticias")).toBeUndefined();
  });
});
