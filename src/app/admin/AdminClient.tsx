"use client";

import AdminAgenda from "@/components/admin/Agenda";
import AdminLivro from "@/components/admin/Livro";
import AdminNoticia from "@/components/admin/Noticia";
import AdminProjeto from "@/components/admin/Projeto";
import AdminSobre from "@/components/admin/Sobre";
import React, { useEffect, useState } from "react";

export interface BufferData {
  type: 'Buffer';
  data: number[];
}

export default function AdminClient() {
  const [atBottom, setAtBottom] = useState(false);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    // redirect to login
    window.location.href = "/admin/login";
  }

  // scroll detection
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
    <main className="min-h-screen items-center justify-center flex flex-col py-20 bg-gray-900 text-white ">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex justify-between items-center mb-4 bg-black/30 p-4 rounded">
          <h1 className="text-2xl font-bold">Painel do Admin</h1>
          <button onClick={logout} className="bg-gray-700 px-3 py-1 rounded">
            Sair
          </button>
        </div>

        <AdminAgenda/>
        <AdminNoticia/>
        <AdminLivro/>
        <AdminProjeto/>
        <AdminSobre/>
      </div>
    </main>
  );
}
