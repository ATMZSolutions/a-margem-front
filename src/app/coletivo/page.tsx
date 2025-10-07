"use client";

import { useRouter } from "next/navigation";
import BackBtn from "@/components/BackBtn";
import IntegranteCard from "@/components/IntegranteCard";

interface Integrante {
  id: string;
  nome: string;
  image: string;
}

const integrantes: Integrante[] = [
  { id: "bento", nome: "Bento", image: "/coletivo/bento.webp" },
  { id: "cas", nome: "Cas", image: "/coletivo/cas.webp" },
  { id: "duda", nome: "Duda", image: "/coletivo/duda.webp" },
  { id: "guerra", nome: "Guerra", image: "/coletivo/guerra.webp" },
  { id: "ina", nome: "Iná", image: "/coletivo/ina.webp" },
  { id: "torres", nome: "Torres", image: "/coletivo/torres.webp" },
];

export default function ColetivoPage() {
  const router = useRouter();

  const handleClick = (id: string) => {
    router.push(`/coletivo/integrante/${id}`); // usa id, não nome
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundColor: "#412551",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Coletivo" />

      <div className="w-full max-w-4xl mt-40 grid grid-cols-2 sm:grid-cols-3 gap-6">
        {integrantes.map((p) => (
          <IntegranteCard
            key={p.id}
            nome={p.nome}
            image={p.image}
            onClick={() => handleClick(p.id)} // aqui é o id
          />
        ))}
      </div>
    </section>
  );
}
