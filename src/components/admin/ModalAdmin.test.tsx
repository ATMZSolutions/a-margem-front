// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ModalAdmin from "./ModalAdmin";

describe("ModalAdmin", () => {
  it("não renderiza nada quando aberto é falso", () => {
    const { container } = render(
      <ModalAdmin aberto={false} aoFechar={vi.fn()} titulo="Título Teste">
        <p>Conteúdo</p>
      </ModalAdmin>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza título, descrição e conteúdo quando aberto", () => {
    render(
      <ModalAdmin
        aberto={true}
        aoFechar={vi.fn()}
        titulo="Editar Notícia"
        descricao="Edite os campos da notícia selecionada."
        larguraMaxima="max-w-xl"
      >
        <p>Formulário de teste</p>
      </ModalAdmin>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Editar Notícia" })).toBeInTheDocument();
    expect(screen.getByText("Edite os campos da notícia selecionada.")).toBeInTheDocument();
    expect(screen.getByText("Formulário de teste")).toBeInTheDocument();
  });

  it("chama aoFechar ao clicar no botão fechar", () => {
    const aoFechar = vi.fn();
    render(
      <ModalAdmin aberto={true} aoFechar={aoFechar} titulo="Teste">
        <p>Conteúdo</p>
      </ModalAdmin>
    );

    fireEvent.click(screen.getByRole("button", { name: "Fechar janela" }));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("chama aoFechar ao clicar no backdrop e não fecha ao clicar no interior", () => {
    const aoFechar = vi.fn();
    render(
      <ModalAdmin aberto={true} aoFechar={aoFechar} titulo="Teste">
        <p>Conteúdo interior</p>
      </ModalAdmin>
    );

    // Clica no conteúdo interior -> stopPropagation
    fireEvent.click(screen.getByText("Conteúdo interior"));
    expect(aoFechar).not.toHaveBeenCalled();

    // Clica no backdrop (elemento com role dialog)
    fireEvent.click(screen.getByRole("dialog"));
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("chama aoFechar ao pressionar Escape e ignora outras teclas", () => {
    const aoFechar = vi.fn();
    render(
      <ModalAdmin aberto={true} aoFechar={aoFechar} titulo="Teste">
        <p>Conteúdo</p>
      </ModalAdmin>
    );

    fireEvent.keyDown(window, { key: "Enter" });
    expect(aoFechar).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("restaura o overflow do body ao desmontar", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(
      <ModalAdmin aberto={true} aoFechar={vi.fn()} titulo="Teste">
        <p>Conteúdo</p>
      </ModalAdmin>
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});

