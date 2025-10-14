"use client"; 

import BackBtn from "@/components/BackBtn";
import Link from "next/link";
import { slugify } from "@/utils/helpers";
import { espetaculosData } from "@/data/espetaculos";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 50 }, 
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function EspetaculosPage() {
  const sortedShows = espetaculosData
    .sort((a, b) => Number(a.release) - Number(b.release))
    .reverse();

  const espetaculos = sortedShows.map((item, index) => {
    const slugname = slugify(item.title);
    const href = `/espetaculos/${slugname}`;

    return (
      <motion.div key={index} variants={itemVariants}>
        <Link
          href={href}
          style={{ color: "white" }}
          className="flex flex-col cursor-pointer mx-2"
        >
          <img
            src={item.img}
            alt={`Evento de ${item.title}`}
            className="h-[200px] md:min-h-[300px] max-w-[300px] md:max-w-[500px] lg:max-w-[650px] object-cover"
          />
          <div className="flex flex-row justify-between">
            <span className="text-black">{item.release}</span>
            <span className="text-4xl md:text-4xl text-black font-sedgwick uppercase tracking-widest mt-2">
              {item.title}
            </span>
          </div>
        </Link>
      </motion.div>
    );
  });

  return (
    <section
      className="relative bg-[#F38901] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Voltar" color="text-black" />

      <motion.div
        className="max-w-xl md:max-w-2xl mt-40 flex flex-col gap-12"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {espetaculos}
      </motion.div>
    </section>
  );
}