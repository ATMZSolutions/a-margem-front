"use client";

import Image from "next/image";
import { LoaderCircle, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ImagemAmpliavelProps = {
  src: string;
  alt: string;
  className: string;
  sizes: string;
  ajuste?: "cobrir" | "conter";
  semOtimizacao?: boolean;
};

type ImagemComCarregamentoProps = {
  src: string;
  alt: string;
  sizes: string;
  ajuste: "cobrir" | "conter";
  semOtimizacao: boolean;
  ampliada?: boolean;
};

function ImagemComCarregamento({
  src,
  alt,
  sizes,
  ajuste,
  semOtimizacao,
  ampliada = false,
}: ImagemComCarregamentoProps) {
  const [carregando, definirCarregando] = useState(true);

  return (
    <>
      {carregando && (
        <span role="status" aria-label="Carregando imagem" className="absolute inset-0 z-[1] grid place-items-center bg-slate-200/90">
          <LoaderCircle className="size-6 animate-spin text-[#412551]" aria-hidden="true" />
        </span>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={semOtimizacao}
        onLoad={() => definirCarregando(false)}
        onError={() => definirCarregando(false)}
        priority={ampliada}
        className={`transition-opacity duration-200 ${carregando ? "opacity-0" : "opacity-100"} ${ajuste === "conter" || ampliada ? "object-contain" : "object-cover"}`}
      />
    </>
  );
}

export default function ImagemAmpliavel({
  src,
  alt,
  className,
  sizes,
  ajuste = "cobrir",
  semOtimizacao = false,
}: ImagemAmpliavelProps) {
  const [aberta, definirAberta] = useState(false);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const botaoPrevia = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberta) return;

    const overflowAnterior = document.body.style.overflow;
    const botaoPreviaAtual = botaoPrevia.current;
    document.body.style.overflow = "hidden";
    botaoFechar.current?.focus();

    function lidarComTeclado(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        definirAberta(false);
      }
      if (evento.key === "Tab") {
        evento.preventDefault();
        botaoFechar.current?.focus();
      }
    }

    window.addEventListener("keydown", lidarComTeclado);
    return () => {
      window.removeEventListener("keydown", lidarComTeclado);
      document.body.style.overflow = overflowAnterior;
      botaoPreviaAtual?.focus();
    };
  }, [aberta]);

  return (
    <>
      <button
        ref={botaoPrevia}
        type="button"
        onClick={() => definirAberta(true)}
        aria-label={`Ampliar imagem: ${alt}`}
        className={`group relative block cursor-zoom-in overflow-hidden focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F38901] ${className}`}
      >
        <ImagemComCarregamento
          key={`miniatura-${src}`}
          src={src}
          alt={alt}
          sizes={sizes}
          ajuste={ajuste}
          semOtimizacao={semOtimizacao}
        />
        <span aria-hidden="true" className="absolute bottom-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-[#321d3b]/80 text-white shadow-sm transition group-hover:bg-[#321d3b]">
          <Maximize2 className="size-4" />
        </span>
      </button>

      {aberta && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) definirAberta(false);
          }}
        >
          <div role="dialog" aria-modal="true" aria-label={`Imagem ampliada: ${alt}`} className="relative h-[min(84dvh,960px)] w-[min(94vw,1440px)]">
            <button
              ref={botaoFechar}
              type="button"
              onClick={() => definirAberta(false)}
              aria-label="Fechar imagem ampliada"
              className="absolute -top-3 right-0 z-10 grid size-11 translate-y-[-100%] place-items-center rounded-full bg-white text-[#321d3b] shadow-lg transition hover:bg-[#fff1df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F38901] sm:top-0 sm:right-0 sm:translate-x-1/2 sm:translate-y-[-50%]"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <ImagemComCarregamento
              key={`ampliada-${src}`}
              src={src}
              alt={alt}
              sizes="94vw"
              ajuste="conter"
              semOtimizacao={semOtimizacao}
              ampliada
            />
          </div>
        </div>
      )}
    </>
  );
}
