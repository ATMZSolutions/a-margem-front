"use client";

import AdminAgenda from "@/components/admin/Agenda";
import AdminLivro from "@/components/admin/Livro";
import AdminNoticia from "@/components/admin/Noticia";
import AdminProjeto from "@/components/admin/Projeto";
import AdminSobre from "@/components/admin/Sobre";
import React, { useEffect, useState } from "react";

export interface BufferData {
  type: "Buffer";
  data: number[];
}

export default function AdminClient() {
  const [atBottom, setAtBottom] = useState(false);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.scrollHeight;
      setAtBottom(scrollTop + windowHeight >= fullHeight - 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main
      className="
        min-h-screen 
        w-screen 
        overflow-x-hidden 
        flex flex-col 
        items-center 
        py-10 px-1 
        bg-[#2F4158] 
        text-white 
      "
      style={{
        backgroundImage: "url('padrao1.webp')",
      }}
    >
      {/* HEADER */}
      <div className="flex flex-row mt-8 sm:flex-row justify-between items-center w-full max-w-md mb-8 bg-black/40 p-4 rounded-lg gap-3">
        <h1 className="text-xl flex flex-row font-bold text-center sm:text-left">
          Painel do Admin
        </h1>
        <button
          onClick={logout}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded transition"
        >
          Sair
        </button>
      </div>

      {/* GRID DE CARDS */}
      <div
        className="
          grid 
          grid-cols-1 
          gap-4 
          w-full 
          max-w-md
        "
      >
        <AdminAgenda />
        <AdminNoticia />
        <AdminLivro />
        <AdminProjeto />
        <AdminSobre />
      </div>

      {/* BOTÃO TOPO */}
      {atBottom && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full shadow-lg transition"
        >
          ↑ Topo
        </button>
      )}
    </main>
  );
}
