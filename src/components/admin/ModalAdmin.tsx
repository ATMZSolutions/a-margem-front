"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalAdminProps {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  larguraMaxima?: "max-w-xl" | "max-w-2xl" | "max-w-3xl" | "max-w-4xl";
}

export default function ModalAdmin({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  larguraMaxima = "max-w-2xl",
}: ModalAdminProps) {
  useEffect(() => {
    if (!aberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }

    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoPressionarTecla);

    return () => {
      document.body.style.overflow = overflowOriginal;
      window.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-admin-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 sm:py-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
      onClick={aoFechar}
    >
      <div
        className={`relative flex w-full ${larguraMaxima} max-h-[92vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
          <div className="border-l-4 border-[#F38901] pl-3 pr-2">
            <h2 id="modal-admin-titulo" className="text-lg font-bold text-slate-900">
              {titulo}
            </h2>
            {descricao && <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{descricao}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar janela"
            className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
}
