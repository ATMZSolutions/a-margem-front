"use client";

import BackBtn from "@/components/BackBtn";
import IntegranteCard from "@/components/IntegranteCard";
import { useParams } from "next/navigation";
import { useState } from "react";
import { integrantes } from "@/data/integrantes";

export default function IntegrantePage() {
  const params = useParams();
  const { nome } = params;
  const integrante = integrantes.find((i) => i.id === nome);
  const [expanded, setExpanded] = useState(false);

  if (!integrante) return <p>Integrante não encontrado</p>;

  const MAX_LENGTH = 450; // limite antes de cortar texto

  const shortBio =
    integrante.biografia.length > MAX_LENGTH && !expanded
      ? integrante.biografia.slice(0, MAX_LENGTH) + "..."
      : integrante.biografia;

  return (
    <section
      className="min-h-screen flex flex-col items-center justify-center text-white px-4 py-10 bg-cover bg-center"
      style={{
        backgroundColor: "#412551",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Integrante" />

      <div className="pt-28 flex flex-col md:flex-row md:items-start items-center">
        <IntegranteCard
          key={integrante.nome}
          nome={integrante.nome}
          image={integrante.image}
          onClick={() => {}}
        />

        <div className="flex flex-col md:ml-10 items-center md:items-start max-w-4xl">
          {/* Ficha Técnica */}
          <div className="w-full max-w-2xl mt-8 md:mt-0 px-4">
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-[#F38901] pl-2">
              Ficha Técnica
            </h2>
            <p>{integrante.fichaTecnica}</p>
          </div>

          {/* Biografia */}
          <div className="w-full max-w-2xl mt-6 p-4">
            <h2 className="text-2xl font-semibold mb-4 border-l-4 border-[#F38901] pl-2">
              Biografia
            </h2>
            <p className="whitespace-pre-line text-justify">{shortBio}</p>

            {/* Botão Ler mais / menos */}
            {integrante.biografia.length > MAX_LENGTH && (
              <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-[#F38901] hover:underline transition"
              >
          {expanded ? "Ler menos" : "Ler mais"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
