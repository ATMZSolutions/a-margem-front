"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { Drawer } from "antd";
import { motion } from "framer-motion";

const menuItems = [
  { label: "Home", href: "/" },
  { label: "Agenda", href: "/agenda" },
  { label: "Sobre", href: "/sobre" },
  { label: "Integrantes", href: "/coletivo" },
  { label: "Prêmios", href: "/premios" },
  { label: "Espetáculos", href: "/espetaculos" },
  { label: "Projetos", href: "/projetos" },
  { label: "Notícias", href: "/noticias" },
  { label: "Indicações", href: "/indicacoes" },
  { label: "Contato", href: "/contato" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Barra superior com logo à esquerda e hamburguer à direita */}
      <div className="w-full flex justify-between items-center px-4 py-1 fixed top-0 left-0 z-50 bg-black/60 backdrop-blur-[5px]">
        {/* Logo com animação */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Link href="/">
            <Image
              src="/logo-branca.png"
              alt="Logo A Margem"
              height={40} // equivalente a h-10
              width={160} // define largura aproximada
              style={{ height: "2.5rem", width: "auto" }} // h-10 = 2.5rem
              priority
            />
          </Link>
        </motion.div>

        <button
          onClick={() => setOpen(true)}
          className="text-white text-2xl p-2"
          aria-label="Abrir menu"
        >
          <MenuOutlined />
        </button>
      </div>

      {/* Drawer vindo da direita */}
      <Drawer
        placement="right"
        open={open}
        onClose={() => setOpen(false)}
        closable={false}
        width="100%"
        styles={{
          body: {
            backgroundColor: "rgba(0, 0, 0, 1)",
            display: "flex",
            flexDirection: "column",
            padding: "2rem",
            alignItems: "flex-end",
          },
        }}
      >
        <div className="w-full flex flex-col gap-8 items-end">
          <button
            onClick={() => setOpen(false)}
            className="text-[#F38901] text-3xl"
            aria-label="Fechar menu"
          >
            <CloseOutlined />
          </button>

          <nav className="flex flex-col gap-4 text-2xl font-semibold text-right">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ color: "white" }}
                className="text-[#F38901]! font-sedgwick uppercase tracking-widest transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </Drawer>
    </div>
  );
}
