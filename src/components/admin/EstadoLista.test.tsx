// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EstadoLista from "./EstadoLista";

describe("EstadoLista", () => {
  it("apresenta placeholders enquanto carrega", () => {
    render(<EstadoLista carregando buscando={false} mensagemVazia="Sem registros." />);
    expect(screen.getByRole("status", { name: "Carregando conteúdo" })).toBeInTheDocument();
    expect(screen.queryByText("Sem registros.")).not.toBeInTheDocument();
  });

  it("orienta a criação inicial e dispara a ação", async () => {
    const aoCriar = vi.fn();
    const usuario = userEvent.setup();
    render(
      <EstadoLista
        carregando={false}
        buscando={false}
        mensagemVazia="Sem registros."
        textoAcao="Criar registro"
        aoCriar={aoCriar}
      />,
    );

    await usuario.click(screen.getByRole("button", { name: "Criar registro" }));
    expect(screen.getByText("Sem registros.")).toBeInTheDocument();
    expect(aoCriar).toHaveBeenCalledOnce();
  });

  it("apresenta ausência de resultados sem sugerir uma nova criação", () => {
    render(
      <EstadoLista
        carregando={false}
        buscando
        mensagemVazia="Sem registros."
        textoAcao="Criar registro"
        aoCriar={vi.fn()}
      />,
    );

    expect(screen.getByText("Nenhum resultado encontrado para a busca.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar registro" })).not.toBeInTheDocument();
  });
});
