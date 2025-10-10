"use client";

import React from "react";
import ContactItem from "../ContactItem";
import { AtSign, Instagram, Mail, Phone } from "lucide-react";
import { motion, Variants } from "framer-motion";

const contactVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Contato = () => {
  const contacts = [
    { icon: <Phone size={18} />, text: "+55 (81) 9 8600-9096" },
    { icon: <Mail size={18} />, text: "coletivoamargem1@gmail.com" },
    { icon: <Instagram size={18} />, text: "@amargemcoletivo" },
    { icon: <AtSign size={18} />, text: "@coletivoamargem" },
  ];

  return (
    <section
      className="relative py-40 flex flex-col items-center justify-center bg-[#412551] text-black"
      style={{
        backgroundImage: "url('/padrao2.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[#412551]/80 pointer-events-none"></div>

      <div className="relative w-[40vh] md:w-[60vh] px-4 text-center z-10">
        <h2 className="text-4xl font-sedgwick uppercase tracking-widest md:text-5xl font-bold text-white mb-8 text-end">
          Contatos<br />e Redes
        </h2>

        <div className="flex flex-col items-start space-y-2 font-medium text-white">
          {contacts.map((contact, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              variants={contactVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }} // delay individual aqui
              className="flex items-center gap-2"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#412551]">
                {React.cloneElement(contact.icon, { size: 18 })}
              </span>
              <span>{contact.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Contato;
