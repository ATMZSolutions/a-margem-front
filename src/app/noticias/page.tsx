"use client";

import { useState, useEffect } from "react";
import BackBtn from "@/components/BackBtn";
import NewsCard, { NewsItem } from "@/components/NewsCard";

// Tipo exato do retorno da API (baseado no model Prisma)
interface NoticiaFromAPI {
  id: number;
  titulo: string;
  conteudo: string;
  link: string;
  createdAt: string;
}

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNoticias() {
      try {
        const response = await fetch("/api/noticias", { cache: "no-store" });
        const data: NoticiaFromAPI[] = await response.json();

        // Mapeia os dados da API para o formato esperado por <NewsCard />
        const formatted: NewsItem[] =
          Array.isArray(data) && data.length
            ? data.map((item) => ({
                id: item.id,
                title: item.titulo,
                description: item.conteudo,
                link: item.link,
              }))
            : [];

        setNoticias(formatted);
      } catch (error) {
        console.error("Erro ao carregar notícias:", error);
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
        <div>Carregando notícias...</div>
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
      <BackBtn label="Notícias" />

      <div className="w-full max-w-5xl mt-40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((item, idx) => (
          <NewsCard key={item.id} item={item} index={idx} />
        ))}
      </div>

      {noticias.length === 0 && (
        <div className="text-center text-white/70 py-8">
          <p>Nenhuma notícia encontrada.</p>
        </div>
      )}
    </section>
  );
}
