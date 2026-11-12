"use client";

import { Plus } from "lucide-react";

type CabecalhoSecaoProps = {
  titulo: string;
  descricao: string;
  acao: string;
  aberto: boolean;
  desabilitado?: boolean;
  aoAlternar: () => void;
};

export default function CabecalhoSecao({
  titulo,
  descricao,
  acao,
  aberto,
  desabilitado = false,
  aoAlternar,
}: CabecalhoSecaoProps) {
  return (
    <header className="flex w-full min-w-0 max-w-full flex-col gap-4 rounded-xl border border-slate-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 2xl:p-4">
      <div className="min-w-0 flex-1 border-l-4 border-[#F38901] pl-4">
        <h1 id="admin-secao-titulo" className="break-words text-lg font-bold text-[#19121d] sm:text-xl">
          {titulo}
        </h1>
        <p className="mt-1 break-words text-sm text-slate-600">{descricao}</p>
      </div>
      <button
        type="button"
        onClick={aoAlternar}
        aria-expanded={aberto}
        disabled={desabilitado}
        className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551] ${aberto ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "bg-[#F38901] text-[#241c26] hover:bg-[#FECA55]"}`}
      >
        {!aberto && <Plus size={18} aria-hidden="true" />}
        {aberto ? "Cancelar" : acao}
      </button>
    </header>
  );
}
