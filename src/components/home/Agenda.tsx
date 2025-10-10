"use client";

import React from "react";
import { motion, Variants } from "framer-motion";

const agendaVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Agenda = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#681A01] text-black overflow-hidden">
      {/* Imagem de fundo */}
      <img
        src="/padrao2.webp"
        alt="Background Padrao2"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* Overlay para misturar com a cor */}
      <div className="absolute inset-0 bg-[#681A01]/70 z-10 pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative z-20 flex flex-col items-center justify-center w-4/5 md:w-3/5 text-white">
        <motion.h2
          className="text-4xl md:text-5xl font-sedgwick uppercase tracking-widest font-bold mb-8 text-center"
          variants={agendaVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Próximos Eventos
        </motion.h2>
      </div>
    </section>
  );
};

export default Agenda;
