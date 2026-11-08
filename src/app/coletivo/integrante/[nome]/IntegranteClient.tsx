"use client";

import BackBtn from "@/components/BackBtn";
import IntegranteCard from "@/components/IntegranteCard";
import { useState } from "react";
import type { IntegrantePublico } from "@/lib/publicContent";
import { useSiteTexts } from "@/components/SiteTextProvider";

export default function IntegranteClient({ integrante }: { integrante: IntegrantePublico }) {
  const textos = useSiteTexts();
  const [expanded, setExpanded] = useState(false);

  const MAX_LENGTH = 450; // limite antes de cortar texto

  const shortBio =
      integrante.biografia.length > MAX_LENGTH && !expanded
      ? integrante.biografia.slice(0, MAX_LENGTH) + "..."
      : integrante.biografia;

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center text-white px-4 py-10 bg-cover bg-center"
      style={{
        backgroundColor: "var(--site-primary)",
        backgroundImage: "var(--site-background-image)",
      }}
    >
      <BackBtn label={textos?.tituloIntegrante ?? "Integrante"} />

      <div className="pt-28 flex flex-col md:flex-row md:items-start items-center">
        <div className="w-full max-w-xs shrink-0">
          <IntegranteCard
            key={integrante.id}
            nome={integrante.nome}
            image={integrante.image}
            onClick={() => {}}
          />
        </div>

        <div className="flex flex-col md:ml-10 items-center md:items-start max-w-4xl">
          {/* Ficha Técnica */}
          <div className="w-full max-w-2xl mt-8 md:mt-0 px-4">
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-site-accent pl-2">
              Ficha Técnica
            </h2>
            <p>{integrante.fichaTecnica}</p>
          </div>

          {/* Biografia */}
          <div className="w-full max-w-2xl mt-6 p-4">
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-site-accent pl-2">
              Biografia
            </h2>
            <p className="whitespace-pre-line text-justify">{shortBio}</p>

            {/* Botão Ler mais / menos */}
            {integrante.biografia.length > MAX_LENGTH && (
              <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-site-accent hover:underline transition"
              >
          {expanded ? textos?.lerMenos ?? "Ler menos" : textos?.lerMais ?? "Ler mais"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
