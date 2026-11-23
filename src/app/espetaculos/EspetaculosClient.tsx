"use client";

import BackBtn from "@/components/BackBtn";
import Image from "next/image";
import Link from "next/link";
import type { EspetaculoPublico } from "@/lib/publicContent";
import { useSiteTexts } from "@/components/SiteTextProvider";

export default function EspetaculosClient({ espetaculos }: { espetaculos: EspetaculoPublico[] }) {
  const textos = useSiteTexts();
  const ordenados = [...espetaculos].sort((a, b) => a.ordem - b.ordem || b.release.localeCompare(a.release));

  return (
    <section
      className="relative bg-site-primary min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{ backgroundImage: "var(--site-background-image)" }}
    >
      <BackBtn label="Espetáculos" textKey="tituloEspetaculos" />
      {ordenados.length === 0 ? (
        <p className="mt-40 text-center text-white">{textos?.espetaculosVazios ?? "Nenhum espetáculo publicado no momento."}</p>
      ) : (
        <div className="mt-40 grid w-full max-w-7xl grid-cols-1 gap-7 sm:gap-8 md:grid-cols-2 lg:gap-8 lg:px-4 xl:grid-cols-4">
          <h1 className="sr-only">Espetáculos</h1>
          {ordenados.map((item) => (
            <div key={item.id} className="min-w-0">
              <Link href={`/espetaculos/${item.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/15 bg-black/25 text-white shadow-lg transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/30">
                  <Image
                    src={item.img}
                    alt={`Espetáculo ${item.title}`}
                    fill
                    sizes="(max-width: 768px) calc(100vw - 2rem), (max-width: 1280px) 50vw, 300px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 items-start justify-between gap-4 p-4 sm:p-5">
                  <h2 className="min-w-0 font-sedgwick text-2xl uppercase leading-tight tracking-wide text-white sm:text-3xl xl:text-2xl">{item.title}</h2>
                  <span className="shrink-0 pt-1 text-sm font-semibold text-white">{item.release}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
