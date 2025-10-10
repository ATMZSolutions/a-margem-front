"use client";

import { useRouter } from "next/navigation";
import { motion, Variants, easeOut } from "framer-motion";
import BackBtn from "@/components/BackBtn";
import IntegranteCard from "@/components/IntegranteCard";

interface Integrante {
  id: string;
  nome: string;
  image: string;
}

// Lista de integrantes
const integrantes: Integrante[] = [
  { id: "bento", nome: "Bento", image: "/coletivo/bento.webp" },
  { id: "cas", nome: "Cas", image: "/coletivo/cas.webp" },
  { id: "duda", nome: "Duda", image: "/coletivo/duda.webp" },
  { id: "guerra", nome: "Guerra", image: "/coletivo/guerra.webp" },
  { id: "ina", nome: "Iná", image: "/coletivo/ina.webp" },
  { id: "torres", nome: "Torres", image: "/coletivo/torres.webp" },
];

// Variants para animação dos cards
const cardVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: easeOut,
    },
  }),
};

export default function ColetivoPage() {
  const router = useRouter();

  const handleClick = (id: string) => {
    router.push(`/coletivo/integrante/${id}`);
  };

  return (
    <section
      className="relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundColor: "#412551",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      {/* Botão de voltar */}
      <BackBtn label="Coletivo" />

      {/* Grid de integrantes */}
      <div className="w-full max-w-3xl mt-40 grid grid-cols-2 sm:grid-cols-3 gap-6">
        {integrantes.map((p, idx) => (
          <motion.div
            key={p.id}
            custom={idx}
            variants={cardVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ scale: 1.05 }} // leve zoom ao passar o mouse
            whileTap={{ scale: 0.95 }}
          >
            <IntegranteCard
              nome={p.nome}
              image={p.image}
              onClick={() => handleClick(p.id)}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
