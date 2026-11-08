import { createElement } from "react";
import type { ImgHTMLAttributes } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

afterEach(() => cleanup());

vi.mock("next/image", () => ({
  default: (propriedades: ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    unoptimized?: boolean;
  }) => {
    const atributos = { ...propriedades };
    delete atributos.fill;
    delete atributos.priority;
    delete atributos.sizes;
    delete atributos.unoptimized;
    return createElement("img", atributos);
  },
}));
