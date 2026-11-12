// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ModalConfirmarSenha from "./ModalConfirmarSenha";

describe("ModalConfirmarSenha", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("não renderiza quando aberto é falso", () => {
    render(<ModalConfirmarSenha aberto={false} aoFechar={vi.fn()} aoConfirmar={vi.fn()} />);
    expect(screen.queryByText("Confirmação de segurança")).not.toBeInTheDocument();
  });

  it("renderiza textos customizados e permite alternar visibilidade da senha e cancelar", async () => {
    const aoFechar = vi.fn();
    const usuario = userEvent.setup();
    render(
      <ModalConfirmarSenha
        aberto={true}
        titulo="Título Personalizado"
        descricao="Descrição personalizada de teste"
        textoBotaoConfirmar="Salvar Dados Seguros"
        aoFechar={aoFechar}
        aoConfirmar={vi.fn()}
      />
    );

    expect(screen.getByText("Título Personalizado")).toBeInTheDocument();
    expect(screen.getByText("Descrição personalizada de teste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar Dados Seguros" })).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Digite a senha de administrador");
    expect(input).toHaveAttribute("type", "password");

    const botaoAlternar = screen.getByRole("button", { name: "Exibir senha" });
    await usuario.click(botaoAlternar);
    expect(input).toHaveAttribute("type", "text");

    await usuario.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(input).toHaveAttribute("type", "password");

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("exibe erro se a senha for vazia ou se a resposta for de erro com e sem payload", async () => {
    const usuario = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Senha inválida." }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error("JSON quebrado"); },
      })
      .mockRejectedValueOnce("Erro não-objeto");

    vi.stubGlobal("fetch", fetchMock);

    render(<ModalConfirmarSenha aberto={true} aoFechar={vi.fn()} aoConfirmar={vi.fn()} />);

    const form = screen.getByRole("button", { name: "Confirmar alteração" }).closest("form")!;
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Digite a senha administrativa.");

    const input = screen.getByPlaceholderText("Digite a senha de administrador");
    await usuario.type(input, "senha-errada");
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha inválida.");

    // Segunda tentativa: resposta sem json de erro
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha administrativa incorreta.");

    // Terceira tentativa: erro lançado não é Error
    fireEvent.submit(form);
    expect(await screen.findByRole("alert")).toHaveTextContent("Senha administrativa incorreta.");
  });

  it("chama aoConfirmar e fecha quando a verificação for bem-sucedida", async () => {
    const usuario = userEvent.setup();
    const aoConfirmar = vi.fn().mockResolvedValue(undefined);
    const aoFechar = vi.fn();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    render(<ModalConfirmarSenha aberto={true} aoFechar={aoFechar} aoConfirmar={aoConfirmar} />);

    const input = screen.getByPlaceholderText("Digite a senha de administrador");
    await usuario.type(input, "senha-correta");
    await usuario.click(screen.getByRole("button", { name: "Confirmar alteração" }));

    await waitFor(() => expect(aoConfirmar).toHaveBeenCalledTimes(1));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });
});
