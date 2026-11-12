// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConteudoEditorial from "./ConteudoEditorial";

function resposta(corpo: unknown, ok = true) {
  return { ok, json: async () => corpo } as Response;
}

describe("ConteudoEditorial", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("mostra erro com nova tentativa, sem estado vazio nem criação, quando a carga falha", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(resposta([], false))
      .mockResolvedValueOnce(resposta([]))
      .mockResolvedValueOnce(resposta([{ id: "1", slug: "ana", estado: "PUBLICADO", ordem: 0, nome: "Ana" }]))
      .mockResolvedValueOnce(resposta([]));
    vi.stubGlobal("fetch", fetchMock);

    render(<ConteudoEditorial tipo="integrantes" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar");
    expect(screen.queryByText("Nenhum conteúdo cadastrado.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo integrante" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(screen.getByText("Ana")).toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Novo integrante" })).toBeEnabled();
  });

  it("mostra estado vazio com ação de criar somente após leitura vazia bem-sucedida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta([])));

    render(<ConteudoEditorial tipo="premios" />);

    expect(await screen.findByText("Nenhum conteúdo cadastrado.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
