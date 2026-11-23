"use client";

import React, { useState } from "react";
import AppDrawer from "../../components/AppDrawer";
import BackBtn from "@/components/BackBtn";
import Image from "next/image";
import { useSiteTexts } from "@/components/SiteTextProvider";

export interface Sobre {
  ano: number;
  descricao: string;
  imageUrl: string | null;
}

export default function SobreClient({ initialData }: { initialData: Sobre[] }) {
  const textos = useSiteTexts();
  const [selectedItem, setSelectedItem] = useState<Sobre | null>(null);
  const loading = false;
  const [data] = useState<Sobre[]>(initialData);

  const showDrawer = (item: Sobre) => setSelectedItem(item);
  const onCloseDrawer = () => setSelectedItem(null);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-site-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-xl"></div>
        <div className="text-white z-10">{textos?.carregando ?? "Carregando…"}</div>
      </div>
    );
  }

  return (
    <section
      className="relative bg-site-primary min-h-screen flex flex-col items-center text-white px-4 pb-10"
      style={{
        backgroundImage: "var(--site-background-image)",
      }}
    >
      <BackBtn label="Sobre nós" textKey="tituloSobre" />
      <div className="mx-0 mt-36 w-full max-w-3xl sm:mt-40 lg:mx-auto lg:w-full lg:max-w-7xl lg:px-4">
        <header className="mb-5 border-b border-white/15 px-1 pb-4 sm:mb-10 sm:px-0 sm:pb-5 lg:mb-12 lg:pb-7">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-site-accent sm:text-xs lg:mb-3 lg:tracking-[0.24em]">
            História e trajetória
          </p>
          <h1 className="font-sedgwick text-2xl font-normal leading-tight text-white sm:text-4xl xl:text-5xl">
            A história do Coletivo À Margem
          </h1>
        </header>

        <div className="relative mx-auto max-w-6xl pb-8">
          <div aria-hidden="true" className="absolute bottom-10 left-2 top-3 border-l border-white/20 sm:left-[4.375rem] lg:bottom-12 lg:left-24 lg:top-4" />
          <ol className="space-y-4 sm:space-y-8">
            {data.map((item, index) => (
              <li key={item.ano} className="relative flex flex-col gap-2 sm:grid sm:grid-cols-[4rem_minmax(0,1fr)] sm:items-stretch sm:gap-4 lg:grid-cols-[5rem_minmax(0,1fr)] lg:gap-12">
                <div className="relative pl-6 text-left sm:px-0 sm:pt-6 sm:text-right lg:pt-7">
                  <time dateTime={String(item.ano)} className="text-sm font-semibold tracking-tight text-site-accent sm:text-base lg:text-2xl">
                    {item.ano}
                  </time>
                  <span aria-hidden="true" className="absolute left-[0.125rem] top-[0.25rem] h-3 w-3 rounded-full border-2 border-site-accent bg-site-primary shadow-[0_0_0_5px_rgba(0,0,0,0.18)] sm:left-[4rem] sm:top-[1.875rem] lg:left-[5.625rem] lg:top-9" />
                </div>

                <article className={`ml-5 flex min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/35 shadow-lg transition-colors hover:border-site-accent/40 sm:ml-0 sm:rounded-2xl xl:flex-row ${index % 2 === 1 ? "xl:flex-row-reverse" : ""}`}>
                    {item.imageUrl && (
                      <div className="relative h-48 w-full shrink-0 sm:h-56 sm:bg-purple-950/50 xl:h-auto xl:min-h-[19rem] xl:w-[42%]">
                        <Image
                          src={item.imageUrl}
                          alt={`Fotografia de um evento do Coletivo À Margem em ${item.ano}`}
                          fill
                          sizes="(max-width: 640px) calc(100vw - 2rem), (max-width: 1280px) 42vw, 480px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-3 sm:p-6 xl:p-9">
                      <p className="line-clamp-4 text-[0.9375rem] leading-6 text-white/90 sm:line-clamp-5 sm:text-base sm:leading-7 xl:line-clamp-6">
                        {item.descricao}
                      </p>
                      {item.descricao.length > 220 && (
                        <button
                          type="button"
                          onClick={() => showDrawer(item)}
                          className="mt-2 min-h-11 w-fit rounded px-1 text-sm font-semibold text-site-accent underline decoration-site-accent/40 underline-offset-4 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent sm:mt-5"
                        >
                          {textos?.mostrarMais ?? "Ler história completa"}
                        </button>
                      )}
                    </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <AppDrawer
        open={selectedItem !== null}
        onClose={onCloseDrawer}
        title={`Detalhes de ${selectedItem?.ano || ""}`}
        contents={selectedItem ? [selectedItem.descricao] : []}
      />
    </section>
  );
}
