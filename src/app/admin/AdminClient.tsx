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

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <main
      className="
        min-h-screen 
        overflow-x-hidden 
        flex flex-col 
        items-center 
        py-10 
        px-2
        bg-[#2F4158] 
        text-white 
      "
      style={{
        backgroundImage: "url('padrao1.webp')",
      }}
    >
      {/* HEADER */}
      <div className="flex flex-row mt-8 sm:flex-row justify-between items-center w-full max-w-md mb-8 bg-black/70 p-4 rounded-lg gap-3">
        <h1 className="text-2xl font-sedgwick font-normal flex flex-row text-center sm:text-left">
          Painel do Admin
        </h1>
        <button
          onClick={logout}
          className="bg-gray-700 cursor-pointer hover:bg-gray-800 px-4 py-2 rounded transition"
        >
          Sair
        </button>
      </div>

      {/* GRID DE CARDS */}
      <div
        className="
          grid 
          grid-cols-1 
          w-full 
          max-w-md
          px-2
        "
      >
        <AdminAgenda />
        <AdminNoticia />
        <AdminLivro />
        <AdminProjeto />
        <AdminSobre />
      </div>
    </main>
  );
}
