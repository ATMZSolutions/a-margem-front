"use client"; // Necessário para o framer-motion

import React from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion"; 
import { slugify } from "@/utils/helpers";
import Image from "next/image";

// Definindo as variantes da animação
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

interface PremioProps {
  title: string;
  evento: string;
  year: string | number;
  isSaibaMais?: boolean;
}

const Premio: React.FC<PremioProps> = ({
  title,
  evento,
  year,
  isSaibaMais = false,
}) => {
  const titleUpper = title.toUpperCase();
  const href = `/premios/${slugify(title)}/${year}`;

  return (
    <motion.div
      className="flex flex-col items-center justify-center w-60 md:w-72 text-center"
      variants={cardVariants}
      initial="hidden"
      whileInView="show" 
      viewport={{ once: true }}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`${
            isSaibaMais ? "w-42 md:w-56" : "w-56 md:w-64"
          } h-52 md:h-64 relative opacity-60`}
        >
          <Image
            src="/louros.svg"
            alt="Louros"
            fill
            className="object-contain"
          />
        </div>
        <h1
          className={`absolute font-zen-dots text-[#FECA55] font-bold ${
            isSaibaMais ? "text-xl" : "text-2xl"
          } leading-tight drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)]`}
        >
          {titleUpper}
        </h1>
      </div>

      <p
        className={`text-white font-semibold tracking-widest text-sm md:text-base drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)]`}
      >
        {evento}
      </p>

      <p
        className={`mb-4 text-white font-semibold ${
          isSaibaMais ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
        } drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)] tracking-[0.6em] text-center translate-x-[0.3em]`}
      >
        {year}
      </p>

      <Link href={href} className="bg-white w-4/5 rounded text-black mx-2">
        <button
          className={`${
            isSaibaMais ? "hidden" : ""
          } w-full text-black p-1 cursor-pointer`}
        >
          Saiba mais
        </button>
      </Link>
    </motion.div>
  );
};

export default Premio;