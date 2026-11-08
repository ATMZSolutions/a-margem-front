"use client";

import { useRouter } from "next/navigation";
import { motion, Variants, easeOut } from "framer-motion";
import BackBtn from "@/components/BackBtn";
import IntegranteCard from "@/components/IntegranteCard";
import type { IntegrantePublico } from "@/lib/publicContent";

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: easeOut },
  }),
};

export default function ColetivoClient({ integrantes }: { integrantes: IntegrantePublico[] }) {
  const router = useRouter();

  return (
    <section
      className="relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{ backgroundColor: "var(--site-primary)", backgroundImage: "var(--site-background-image)" }}
    >
      <BackBtn label="Integrantes" textKey="tituloColetivo" />
      {integrantes.length === 0 ? (
        <p className="mt-40 text-center">Nenhum integrante publicado no momento.</p>
      ) : (
        <div className="w-full max-w-3xl mt-40 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {integrantes.map((integrante, index) => (
            <motion.div
              key={integrante.id}
              custom={index}
              variants={cardVariant}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IntegranteCard
                nome={integrante.nome}
                image={integrante.image}
                onClick={() => router.push(`/coletivo/integrante/${integrante.slug}`)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
