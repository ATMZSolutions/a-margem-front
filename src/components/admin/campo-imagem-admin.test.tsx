// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CampoImagemAdmin from "./campo-imagem-admin";

describe("CampoImagemAdmin", () => {
  it("identifica a imagem, descreve os formatos e exige arquivo quando indicado", () => {
    render(
      <CampoImagemAdmin
        id="capa"
        titulo="Capa do livro"
        ajuda="Escolha a imagem da obra."
        textoAlternativo="Prévia da capa"
        aspecto="retrato"
        obrigatoria
        enviando={false}
        aoSelecionar={vi.fn()}
      />,
    );

    const arquivo = screen.getByLabelText("Capa do livro") as HTMLInputElement;
    expect(arquivo).toBeRequired();
    expect(arquivo).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(arquivo).toHaveAttribute("aria-describedby", "capa-ajuda");
    expect(screen.getByText("Escolha a imagem da obra.")).toBeInTheDocument();
    expect(screen.getByText("Prévia da imagem")).toBeInTheDocument();
  });

  it("mantém o campo opcional na edição e informa quando o envio está ativo", () => {
    render(
      <CampoImagemAdmin
        id="imagem-sobre"
        titulo="Imagem"
        ajuda="A imagem atual será mantida se nenhum arquivo for selecionado."
        imagem="/imagem-atual.webp"
        textoAlternativo="Imagem do registro"
        enviando
        aoSelecionar={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Imagem")).not.toBeRequired();
    expect(screen.getByLabelText("Imagem")).toBeDisabled();
    expect(screen.getByText("Enviando imagem…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ampliar imagem: Imagem do registro" })).toBeInTheDocument();
  });

  it("encaminha a seleção do arquivo ao formulário", () => {
    const aoSelecionar = vi.fn();
    render(
      <CampoImagemAdmin
        id="imagem"
        titulo="Imagem"
        ajuda="Selecione uma imagem."
        textoAlternativo="Prévia"
        enviando={false}
        aoSelecionar={aoSelecionar}
      />,
    );

    fireEvent.change(screen.getByLabelText("Imagem"), {
      target: { files: [new File(["imagem"], "foto.png", { type: "image/png" })] },
    });
    expect(aoSelecionar).toHaveBeenCalledOnce();
  });
});
