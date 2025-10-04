"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { Drawer } from "antd";

const menuItems = [
  { label: "Home", href: "/" },
  { label: "Agenda", href: "/agenda" },
  { label: "Sobre", href: "/sobre" },
  { label: "Coletivo", href: "/coletivo" },
  { label: "Prêmios", href: "/premios" },
  { label: "Espetáculos", href: "/espetaculos" },
  { label: "Projetos", href: "/projetos" },
  { label: "Notícias", href: "/noticias" },
  { label: "Contato", href: "/contato" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Barra superior com logo à esquerda e hamburguer à direita */}
      <div className="w-full flex justify-between items-center px-4 py-1 fixed top-0 left-0 z-50  bg-black/60 backdrop-blur-[5px]">
        <div className="text-white text-2xl font-bold">A Margem</div>
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
        closable={false} // remove o close padrão
        width="100%"
        styles={{
          body: {
            backgroundColor: "rgba(0, 0, 0, 1)",
            display: "flex",
            flexDirection: "column",
            padding: "2rem",
            alignItems: "flex-end", // alinha links à direita
          },
        }}
      >
        {/* Botão de fechar manual no canto direito */}
        <button
          onClick={() => setOpen(false)}
          className="mb-10 text-white text-3xl"
          aria-label="Fechar menu"
        >
          <CloseOutlined />
        </button>

        {/* Links alinhados à direita */}
        <nav className="flex flex-col gap-6 text-2xl font-semibold text-right">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ color: "white" }}
              className="hover:text-gray-400 transition-colors"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </div>
  );
}
