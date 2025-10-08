export function slugify(text: string) {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-')             // Substitui espaços por -
    .replace(/[^\w-]+/g, '')        // Remove todos os caracteres não-alfanuméricos (exceto -)
    .replace(/--+/g, '-');            // Substitui múltiplos - por um único -
}

import React from "react";

export const formatDescription = (text: string): React.ReactNode[] => {
  return text.split("\n").map((line, i) => {
    const match = line.match(/^(.*?)([:–])\s*(.*)$/);
    if (match) {
      const [, before, symbol, after] = match;
      return React.createElement(
        "p",
        { key: i, style: { marginBottom: "0.4em" } },
        React.createElement("strong", null, `${before}${symbol}`),
        " ",
        after
      );
    }
    return React.createElement(
      "p",
      { key: i, style: { marginBottom: "0.4em" } },
      line
    );
  });
};
