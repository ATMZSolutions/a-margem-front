"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PhotoCarousel from "../PhotoCarousel";
import Image from "next/image";
import type { HomeSettings } from "@/lib/siteContent";

const Sobre = ({ settings }: { settings: HomeSettings["sobre"] }) => {
  const router = useRouter();
  const imagens = settings.galeria.flatMap((item) => item.url ? [item.url] : []);
  const alts = settings.galeria.map((item) => item.alt);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background principal */}
      <Image
        src={settings.fundo.url ?? "/exu-bg.svg"}
        alt={settings.fundo.alt}
        fill // ocupa toda a div pai
        unoptimized
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
          <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-wide font-sedgwick text-site-accent drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            {settings.titulo}
          </h2>

          <p className="text-base md:text-md leading-relaxed text-justify text-gray-200 indent-4">
            {settings.texto}
          </p>

          {/* Botão animado */}
          {settings.acaoPrincipal.visivel && <motion.button
            onClick={() => router.push(settings.acaoPrincipal.destino)}
            className="group relative w-full md:w-auto px-6 py-2 border border-site-accent text-site-accent rounded-xl font-medium overflow-hidden transition-all duration-300 hover:bg-site-accent hover:text-black"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <span className="relative z-10">{settings.acaoPrincipal.rotulo}</span>
            <span className="absolute inset-0 bg-site-accent/20 group-hover:bg-site-accent transition-all duration-300" />
          </motion.button>}
        </motion.div>

        {/* Carousel */}
        <div className="w-full md:w-1/2 h-[clamp(220px,60vw,350px)] flex justify-center">
          <PhotoCarousel
            topButton={{
              show: settings.acaoSecundaria.visivel,
              href: settings.acaoSecundaria.destino,
              label: settings.acaoSecundaria.rotulo,
            }}
            images={imagens}
            imageAlts={alts}
          />
        </div>
      </div>
    </section>
  );
};

export default Sobre;
