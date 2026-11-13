// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ImagemAmpliavel from "./imagem-ampliavel";

function renderizarImagem() {
  return render(
    <ImagemAmpliavel
      src="/imagem-teste.webp"
      alt="Foto do coletivo"
      className="h-24 w-24"
      sizes="96px"
    />,
  );
}

describe("ImagemAmpliavel", () => {
  it("mostra carregamento até a miniatura terminar de carregar", () => {
    renderizarImagem();
    expect(screen.getByRole("status", { name: "Carregando imagem" })).toBeInTheDocument();

    fireEvent.load(screen.getByAltText("Foto do coletivo"));
    expect(screen.queryByRole("status", { name: "Carregando imagem" })).not.toBeInTheDocument();
  });

  it("abre a imagem ampliada e fecha com Escape, devolvendo o foco", async () => {
    const usuario = userEvent.setup();
    renderizarImagem();
    const previa = screen.getByRole("button", { name: "Ampliar imagem: Foto do coletivo" });

    await usuario.click(previa);
    const dialogo = screen.getByRole("dialog", { name: "Imagem ampliada: Foto do coletivo" });
    expect(dialogo).toBeInTheDocument();
    expect(within(dialogo).getByRole("status", { name: "Carregando imagem" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fechar imagem ampliada" })).toHaveFocus();

    fireEvent.load(within(dialogo).getByAltText("Foto do coletivo"));
    expect(within(dialogo).queryByRole("status", { name: "Carregando imagem" })).not.toBeInTheDocument();

    await usuario.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(previa).toHaveFocus();
  });

  it("fecha ao clicar no fundo e pelo botão", async () => {
    const usuario = userEvent.setup();
    const { rerender } = renderizarImagem();
    await usuario.click(screen.getByRole("button", { name: "Ampliar imagem: Foto do coletivo" }));

    const dialogo = screen.getByRole("dialog");
    fireEvent.mouseDown(dialogo.parentElement!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <ImagemAmpliavel src="/imagem-teste.webp" alt="Foto do coletivo" className="h-24 w-24" sizes="96px" />,
    );
    await usuario.click(screen.getByRole("button", { name: "Ampliar imagem: Foto do coletivo" }));
    await usuario.click(screen.getByRole("button", { name: "Fechar imagem ampliada" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("encerra o indicador quando a miniatura falha ao carregar", () => {
    renderizarImagem();
    fireEvent.error(screen.getByAltText("Foto do coletivo"));
    expect(screen.queryByRole("status", { name: "Carregando imagem" })).not.toBeInTheDocument();
  });

  it("mantém o foco no botão de fechar com Tab, ignora outras teclas e cliques dentro do diálogo", async () => {
    const usuario = userEvent.setup();
    renderizarImagem();
    await usuario.click(screen.getByRole("button", { name: "Ampliar imagem: Foto do coletivo" }));
    const fechar = screen.getByRole("button", { name: "Fechar imagem ampliada" });

    await usuario.keyboard("{Tab}");
    expect(fechar).toHaveFocus();
    await usuario.keyboard("a");
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
