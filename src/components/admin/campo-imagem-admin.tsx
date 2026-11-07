"use client";

import { ImagePlus } from "lucide-react";
import type { ChangeEventHandler, RefObject } from "react";
import ImagemAmpliavel from "./imagem-ampliavel";

type CampoImagemAdminProps = {
  id: string;
  titulo: string;
  ajuda: string;
  imagem?: string;
  textoAlternativo: string;
  aspecto?: "quadrado" | "retrato";
  obrigatoria?: boolean;
  enviando: boolean;
  referencia?: RefObject<HTMLInputElement | null>;
  aoSelecionar: ChangeEventHandler<HTMLInputElement>;
};

export default function CampoImagemAdmin({
  id,
  titulo,
  ajuda,
  imagem,
  textoAlternativo,
  aspecto = "quadrado",
  obrigatoria = false,
  enviando,
  referencia,
  aoSelecionar,
}: CampoImagemAdminProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
      <div
        className={`relative w-32 overflow-hidden rounded-lg border border-slate-200 bg-[#f7f5f1] ${aspecto === "retrato" ? "aspect-[3/4]" : "aspect-square"}`}
      >
        {imagem ? (
          <ImagemAmpliavel
            src={imagem}
            alt={textoAlternativo}
            sizes="128px"
            semOtimizacao
            ajuste="conter"
            className="h-full w-full rounded-lg"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center text-slate-500">
            <ImagePlus className="size-6 text-[#6b5276]" aria-hidden="true" />
            <span className="text-xs">Prévia da imagem</span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-800">
          {titulo}
        </label>
        <p id={`${id}-ajuda`} className="text-sm leading-5 text-slate-600">
          {ajuda}
        </p>
        <input
          ref={referencia}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={obrigatoria}
          onChange={aoSelecionar}
          disabled={enviando}
          aria-describedby={`${id}-ajuda`}
          className="block min-h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-700 file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:bg-[#fff1df] file:px-3 file:font-semibold file:text-[#412551] hover:file:bg-[#ffe4c2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551] disabled:cursor-wait disabled:opacity-60"
        />
        {enviando ? (
          <p role="status" className="text-sm font-medium text-[#412551]">
            Enviando imagem…
          </p>
        ) : (
          <p className="text-xs text-slate-500">Formatos aceitos: JPEG, PNG ou WebP.</p>
        )}
      </div>
    </div>
  );
}
