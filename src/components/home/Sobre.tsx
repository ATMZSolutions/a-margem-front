"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PhotoCarousel from "../PhotoCarousel";
import Image from "next/image";

const randomImages = [
  "/home/img9.jpg",
  "/home/img5.jpg",
  "/home/img6.jpg",
  "/home/img7.jpg",
  "/home/img8.jpg",
  "/home/img4.jpg",
];

const Sobre = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background principal */}
      <Image
        src="/exu-bg.svg"
        alt="Background Exu"
        fill // ocupa toda a div pai
        className="object-cover scale-105 brightness-50 -z-10"
      />

      {/* Overlay gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90 -z-[5]" />

      {/* Conteúdo principal */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-[90%] md:w-[80%] lg:w-[70%] gap-10 md:gap-20 text-white py-12">
        {/* Texto + botão */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-start w-full md:w-1/2 space-y-6"
        >
          <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-wide font-sedgwick text-[#F38901] drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            Sobre nós
          </h2>

          <p className="text-base md:text-md leading-relaxed text-justify text-gray-200 indent-4">
            O Coletivo À Margem é o primeiro grupo de teatro hip-hop de
            Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e
            oficinas para diferentes públicos, traduzindo a palavra “margem” em
            potência criativa e pertencimento, reafirmando a função social do
            teatro hip-hop.
          </p>

          {/* Botão animado */}
          <motion.button
            onClick={() => router.push("/sobre")}
            className="group relative w-full md:w-auto px-6 py-2 border border-[#F38901] text-[#F38901] rounded-xl font-medium overflow-hidden transition-all duration-300 hover:bg-[#F38901] hover:text-black"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <span className="relative z-10">Conheça nossa história</span>
            <span className="absolute inset-0 bg-[#F38901]/20 group-hover:bg-[#F38901] transition-all duration-300" />
          </motion.button>
        </motion.div>

        {/* Carousel */}
        <div className="w-full md:w-1/2 flex justify-center">
          <PhotoCarousel
            topButton={{
              show: true,
              href: "/coletivo",
              label: "Conheça os Integrantes",
            }}
            images={randomImages}
          />
        </div>
      </div>
    </section>
  );
};

export default Sobre;
