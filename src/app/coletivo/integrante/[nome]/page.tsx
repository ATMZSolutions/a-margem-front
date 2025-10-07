"use client";

import BackBtn from "@/components/BackBtn";
import IntegranteCard from "@/components/IntegranteCard";
import { useParams } from "next/navigation";

interface Integrante {
  id: string;
  nome: string;
  image: string;
  fichaTecnica: string;
  biografia: string;
}

const integrantes: Integrante[] = [
  {
    id: "bento",
    nome: "Bento",
    image: "/coletivo/bento.webp",
    fichaTecnica: "Instrumento: Violão | Função: Vocal",
    biografia: "Bento é um músico apaixonado por MPB e composições autorais.",
  },
  {
    id: "cas",
    nome: "Cas",
    image: "/coletivo/cas.webp",
    fichaTecnica: "Instrumento: Baixo | Função: Backing Vocal",
    biografia: "Cas toca baixo desde os 12 anos e adora grooves marcantes.",
  },
  {
    id: "duda",
    nome: "Duda",
    image: "/coletivo/duda.webp",
    fichaTecnica: "Instrumento: Bateria | Função: Percussão",
    biografia: "Duda é baterista e compositor, especializado em ritmos brasileiros.",
  },
  {
    id: "guerra",
    nome: "Guerra",
    image: "/coletivo/guerra.webp",
    fichaTecnica: "Instrumento: Teclado | Função: Arranjos",
    biografia: "Guerra produz arranjos complexos e harmonias sofisticadas.",
  },
  {
    id: "ina",
    nome: "Iná",
    image: "/coletivo/ina.webp",
    fichaTecnica: "Instrumento: Flauta | Função: Solos",
    biografia: "Iná é flautista com experiência em música clássica e experimental.",
  },
  {
    id: "torres",
    nome: "Torres",
    image: "/coletivo/torres.webp",
    fichaTecnica: "Instrumento: Guitarra | Função: Solo",
    biografia: "Torres é guitarrista e arranjador, com influências de rock e jazz.",
  },
];

export default function IntegrantePage() {
  const params = useParams();
  const { nome } = params;

  if (!nome) return <p>Integrante não encontrado</p>;

  const integrante = integrantes.find((i) => i.id === nome);
  if (!integrante) return <p>Integrante não encontrado</p>;

  return (
    <section
      className="min-h-screen flex flex-col items-center text-white px-4 py-10 bg-cover bg-center"
      style={{
        backgroundColor: "#412551",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Coletivo" />

      <div className="pt-28 flex flex-col items-center">
        {/* Card do integrante */}
        <IntegranteCard
          key={integrante.nome}
          nome={integrante.nome}
          image={integrante.image}
          onClick={() => {}}
        />

        {/* Ficha Técnica */}
        <div className="w-full max-w-2xl mt-8 p-4">
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
          <p>{integrante.biografia}</p>
        </div>
      </div>
    </section>
  );
}
