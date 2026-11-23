"use client";

import React from "react";
import { Instagram, Mail } from "lucide-react";
import { TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons"; // ícones Ant Design
import { motion, Variants } from "framer-motion";
import type { ContactChannel, HomeSettings } from "@/lib/siteContent";

const contactVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function IconeContato({ tipo }: { tipo: string }) {
  if (tipo === "whatsapp") return <WhatsAppOutlined style={{ fontSize: 18, color: "#000" }} />;
  if (tipo === "email") return <Mail size={18} />;
  if (tipo === "instagram") return <Instagram size={18} />;
  if (tipo === "tiktok") return <TikTokOutlined style={{ fontSize: 18, color: "#000" }} />;
  return <span aria-hidden="true">↗</span>;
}

const Contato = ({ contacts, titulo, fundo }: { contacts: ContactChannel[]; titulo: string; fundo: HomeSettings["fundoContato"] }) => {

  return (
    <section
      className="relative py-40 flex flex-col items-center justify-center bg-site-primary text-black"
      style={{
        backgroundImage: `url('${fundo.url ?? "/padrao2.webp"}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-site-primary/80 pointer-events-none"></div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-center md:grid md:grid-cols-2 md:items-start md:gap-16">
        <h2 className="text-4xl font-sedgwick uppercase tracking-widest md:text-5xl font-bold text-white mb-8 text-end">
          {titulo}
        </h2>

        <div className="flex flex-col items-start space-y-2 font-medium text-white md:w-full md:max-w-lg">
          {contacts.map((contact, idx) => (
            <motion.a
              key={contact.id}
              href={contact.url}
              target={contact.url.startsWith("http") ? "_blank" : undefined}
              rel={contact.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="flex min-w-0 items-center gap-2 text-left hover:underline"
              variants={contactVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-site-primary">
                <IconeContato tipo={contact.tipo} />
              </span>
              <span className="min-w-0 break-words">{contact.rotulo}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Contato;
