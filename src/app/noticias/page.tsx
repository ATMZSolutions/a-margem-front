"use client";

import { useState, useEffect } from "react";
import BackBtn from "@/components/BackBtn";

interface NewsItem {
  id: number;
  titulo: string;
  conteudo: string;
  createdAt: string;
}

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch news from API
  useEffect(() => {
    async function loadNoticias() {
      try {
        const response = await fetch('/api/noticias');
        const data = await response.json();
        setNoticias(data || []);
      } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        setNoticias([]);
      } finally {
        setLoading(false);
      }
    }

    loadNoticias();
  }, []);

  if (loading) {
    return (
      <section
        className="relative min-h-screen flex items-center justify-center text-white"
        style={{
          backgroundColor: "#2C3852",
          backgroundImage: "url('/padrao2.webp')",
        }}
      >
        <div className="text-white">Carregando notícias...</div>
      </section>
    );
  }
  return (
    <section
      className="relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundColor: "#2C3852",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      {/* Botão de voltar fixo no topo */}
      <BackBtn label="Notícias" />

      {/* Lista de notícias */}
      <div className="w-full max-w-3xl mt-40 flex flex-col items-center gap-6">
        {noticias.map((item) => {
          const createdDate = new Date(item.createdAt);
          const formattedDate = createdDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });
          
          return (
            <article
              key={item.id}
              className="relative bg-black/50 w-full rounded-t-xl border-b-4 border-b-[#F5A623] overflow-hidden flex flex-col sm:flex-row items-center gap-6 p-5 hover:scale-[1.02] transition-transform duration-200 h-[350px] sm:h-[220px]"
            >
              {/* Blur background */}
              <div className="absolute inset-0 z-0 backdrop-blur-md" aria-hidden="true" />
              
              {/* Imagem placeholder */}
              <div className="w-full sm:w-60 h-40 sm:h-full bg-gradient-to-br from-[#F5A623] to-[#2C3852] rounded-md z-10 flex items-center justify-center">
                <span className="text-white font-bold text-sm">À MARGEM</span>
              </div>

              {/* Texto */}
              <div className="flex flex-col justify-between w-full sm:w-3/5 h-full z-10">
                <div className="overflow-hidden">
                  <h2 className="text-[#F5A623] font-semibold text-lg sm:text-xl leading-tight">
                    {item.titulo}
                  </h2>
                  <p className="text-xs text-white/60 mb-2">{formattedDate}</p>
                  <p className="text-sm sm:text-base text-justify text-gray-200 mt-1 line-clamp-3">
                    {item.conteudo}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
        
        {noticias.length === 0 && (
          <div className="text-center text-white/70 py-8">
            <p>Nenhuma notícia encontrada.</p>
          </div>
        )}
      </div>
    </section>
  );
}
