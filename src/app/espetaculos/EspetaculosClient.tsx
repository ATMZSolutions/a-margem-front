"use client";

import BackBtn from "@/components/BackBtn";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import type { EspetaculoPublico } from "@/lib/publicContent";
import { useSiteTexts } from "@/components/SiteTextProvider";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function EspetaculosClient({ espetaculos }: { espetaculos: EspetaculoPublico[] }) {
  const textos = useSiteTexts();
  const ordenados = [...espetaculos].sort((a, b) => a.ordem - b.ordem || b.release.localeCompare(a.release));

  return (
    <section
      className="relative bg-site-primary min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{ backgroundImage: "var(--site-background-image)" }}
    >
      <BackBtn label="Espetáculos" textKey="tituloEspetaculos" color="text-black" />
      {ordenados.length === 0 ? (
        <p className="mt-40 text-center text-black">{textos?.espetaculosVazios ?? "Nenhum espetáculo publicado no momento."}</p>
      ) : (
        <motion.div
          className="max-w-xl md:max-w-2xl mt-40 flex flex-col gap-12"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {ordenados.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              <Link href={`/espetaculos/${item.slug}`} style={{ color: "white" }} className="flex flex-col cursor-pointer mx-2">
                <Image
                  src={item.img}
                  alt={`Espetáculo ${item.title}`}
                  width={1300}
                  height={850}
                  sizes="(max-width: 640px) 300px, (max-width: 1024px) 500px, 650px"
                  className="h-[200px] md:h-[300px] w-full max-w-[300px] md:max-w-[500px] lg:max-w-[650px] object-cover"
                />
                <div className="flex flex-row gap-8 justify-between max-w-[300px] md:max-w-[500px] lg:max-w-[650px]">
                  <span className="text-black">{item.release}</span>
                  <span className="text-4xl text-black font-sedgwick uppercase tracking-widest mt-2 text-right">{item.title}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
