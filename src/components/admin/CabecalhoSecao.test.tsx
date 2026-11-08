// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CabecalhoSecao from "./CabecalhoSecao";

describe("CabecalhoSecao", () => {
  it("exibe título e ação de criação com estado acessível", () => {
    const aoAlternar = vi.fn();
    render(
      <CabecalhoSecao
        titulo="Notícias"
        descricao="Publicações e novidades."
        acao="Nova notícia"
        aberto={false}
        aoAlternar={aoAlternar}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Notícias" })).toBeInTheDocument();
    expect(screen.getByText("Publicações e novidades.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nova notícia" }));
    expect(aoAlternar).toHaveBeenCalledOnce();
  });

  it("troca a ação por cancelar quando o formulário está aberto", () => {
    const aoAlternar = vi.fn();
    render(
      <CabecalhoSecao
        titulo="Livros"
        descricao="Obras do coletivo."
        acao="Novo livro"
        aberto
        aoAlternar={aoAlternar}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveAttribute("aria-expanded", "true");
  });
});
