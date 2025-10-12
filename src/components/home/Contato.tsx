"use client";

import React from "react";
import { AtSign, Instagram, Mail } from "lucide-react";
import { TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons"; // ícones Ant Design
import { motion, Variants } from "framer-motion";

const contactVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Contato = () => {
  const contacts = [
    {
      icon: <WhatsAppOutlined style={{ fontSize: 18, color: "#000" }} />,
      text: "+55 (81) 9 8600-9096",
      link: "https://wa.me/5581986009096",
    },
    {
      icon: <Mail size={18} />,
      text: "coletivoamargem1@gmail.com",
      link: "https://mail.google.com/mail/?view=cm&to=coletivoamargem1@gmail.com",
    },
    {
      icon: <Instagram size={18} />,
      text: "@amargemcoletivo",
      link: "https://instagram.com/amargemcoletivo",
    },
    {
      icon: <TikTokOutlined style={{ fontSize: 18, color: "#000" }} />,
      text: "@coletivoamargem",
      link: "https://www.tiktok.com/@coletivoamargem",
    },
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
            <motion.a
              key={idx}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:underline"
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
};

export default Contato;
