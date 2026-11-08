"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Menu, X } from "lucide-react";
import type { NavigationItem } from "@/lib/siteContent";
import { useSiteTexts } from "@/components/SiteTextProvider";

const Drawer = dynamic(() => import("antd").then((module) => module.Drawer), { ssr: false });

export default function Sidebar({ items, logoUrl, logoAlt, logoHref, nomePublico }: { items: NavigationItem[]; logoUrl: string; logoAlt: string; logoHref: string; nomePublico: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const textos = useSiteTexts();

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <div>
      {/* Barra superior com logo à esquerda e hamburguer à direita */}
      <div className="w-full flex justify-between items-center px-4 py-1 fixed top-0 left-0 z-50 bg-black/60 backdrop-blur-[5px]">
        {/* Logo com animação */}
        <Link href={logoHref} aria-label={`${nomePublico}, página inicial`}>
          <Image
            src={logoUrl}
            alt={logoAlt}
            height={40}
            width={160}
            style={{ height: "2.5rem", width: "auto" }}
            unoptimized
            priority
          />
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="text-white text-2xl p-2"
          aria-label={textos?.abrirMenu ?? "Abrir menu"}
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
            className="text-site-accent text-3xl"
            aria-label={textos?.fecharMenu ?? "Fechar menu"}
          >
            <X aria-hidden="true" />
          </button>

          <nav className="flex flex-col gap-4 text-2xl font-semibold text-right">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.destino}
                style={{ color: "white" }}
                className="text-site-accent! font-sedgwick uppercase tracking-widest transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </Drawer>}
    </div>
  );
}
