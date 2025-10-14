"use client";

import BackBtn from "@/components/BackBtn";
import React from "react";
import { Mail, Instagram, Phone, AtSign } from "lucide-react";
import { TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { motion, Variants } from "framer-motion";

const contactVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function ContatoPage() {
  const contacts = [
    {
      icon: <WhatsAppOutlined />,
      text: "+55 (81) 9 8600-9096",
      link: "https://wa.me/5581986009096",
    },
    {
      icon: <Mail />,
      text: "coletivoamargem1@gmail.com",
      link: "https://mail.google.com/mail/?view=cm&to=coletivoamargem1@gmail.com",
    },
    {
      icon: <Instagram />,
      text: "@amargemcoletivo",
      link: "https://instagram.com/amargemcoletivo",
    },
    {
      icon: <TikTokOutlined />,
      text: "@coletivoamargem",
      link: "https://www.tiktok.com/@coletivoamargem",
    },
  ];

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-white px-4 bg-cover bg-center"
      style={{
        backgroundColor: "#412551",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#412551]/80 pointer-events-none" />

      {/* Botão de voltar */}
      <BackBtn label="Contato" />

      {/* Conteúdo */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center mt-16 sm:mt-20 text-center">
        {/* Logo */}
        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden mb-8 shadow-lg">
          <img
            src="/amargem-logo-insta.webp"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Lista de contatos com links */}
        <div className="flex flex-col items-center space-y-3 font-medium text-white w-full">
          {contacts.map((contact, idx) => (
            <motion.a
              key={idx}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:underline"
              variants={contactVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#412551]">
                {React.cloneElement(contact.icon, { size: 18 })}
              </span>
              <span>{contact.text}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
