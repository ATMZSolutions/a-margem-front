"use client";

import BackBtn from "@/components/BackBtn";
import { Mail, Instagram, Phone, AtSign } from "lucide-react";
import ContactItem from "@/components/ContactItem"; // import do subcomponente

export default function ContatoPage() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-white px-4 bg-cover bg-center"
      style={{
        backgroundColor: "#412551",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      {/* Botão fixo no topo */}
      <BackBtn label="Contato" />

      {/* Conteúdo centralizado */}
      <div className="w-full max-w-md flex flex-col items-center mt-16 sm:mt-20">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden mb-4 shadow-lg">
            <img
              src="/amargem-logo-insta.webp"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Lista de contatos */}
          <div className="space-y-3 font-medium">
            <ContactItem
              icon={
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                  <Phone size={18} color="#412551" />
                </span>
              }
              text="+55 (81) 9 8600-9096"
            />
            <ContactItem
              icon={
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                  <Mail size={18} color="#412551" />
                </span>
              }
              text="coletivoamargem1@gmail.com"
            />
            <ContactItem
              icon={
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                  <Instagram size={18} color="#412551" />
                </span>
              }
              text="@amargemcoletivo"
            />
            <ContactItem
              icon={
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
                  <AtSign size={18} color="#412551" />
                </span>
              }
              text="@coletivoamargem"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
