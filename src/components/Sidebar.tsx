"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";

const Drawer = dynamic(() => import("antd").then((module) => module.Drawer), { ssr: false });

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
        <Link href="/" aria-label="À Margem, página inicial">
          <Image
            src="/logo-branca.png"
            alt="Logo À Margem"
            height={40}
            width={160}
            style={{ height: "2.5rem", width: "auto" }}
            priority
          />
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="text-white text-2xl p-2"
          aria-label="Abrir menu"
        >
          <Menu aria-hidden="true" />
        </button>
      </div>

      {/* Drawer vindo da direita */}
      {open && <Drawer
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
            <X aria-hidden="true" />
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
      </Drawer>}
    </div>
  );
}
