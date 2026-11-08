type EstadoListaProps = {
  carregando: boolean;
  buscando: boolean;
  mensagemVazia: string;
  textoAcao?: string;
  aoCriar?: () => void;
};

export default function EstadoLista({
  carregando,
  buscando,
  mensagemVazia,
  textoAcao,
  aoCriar,
}: EstadoListaProps) {
  if (carregando) {
    return (
      <div role="status" aria-label="Carregando conteúdo" className="space-y-3 py-5">
        <span className="sr-only">Carregando conteúdo…</span>
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="py-8 text-center">
      <p className="text-sm text-slate-600">
        {buscando ? "Nenhum resultado encontrado para a busca." : mensagemVazia}
      </p>
      {!buscando && aoCriar && textoAcao && (
        <button
          type="button"
          onClick={aoCriar}
          className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#F38901] px-4 text-sm font-semibold text-[#241c26] transition hover:bg-[#FECA55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
        >
          {textoAcao}
        </button>
      )}
    </div>
  );
}
