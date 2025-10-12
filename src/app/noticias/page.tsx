"use client";

import { useState, useEffect } from "react";
import BackBtn from "@/components/BackBtn";
import NewsCard, { NewsItem } from "@/components/NewsCard";

const newsData: NewsItem[] = [
  {
    id: 1,
    title: "Revista Ogrito",
    source: "Revista Ogrito",
    description:
      "Xirê, peça do coletivo À Margem, marca o retorno do projeto Terça em Cena, trazendo uma abordagem inovadora sobre cultura e resistência.",
    image: "https://picsum.photos/400?random=1",
    link: "#",
  },
  {
    id: 2,
    title: "Diário de Pernambuco",
    source: "Diário de Pernambuco",
    description:
      "Peça 'Xirê' marca o retorno do projeto Terça em Cena, na UFPE, reunindo artistas e espectadores em uma celebração da arte local.",
    image: "https://picsum.photos/400?random=2",
    link: "#",
  },
  // ... restante do mock
];

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNoticias() {
      try {
        const response = await fetch('/api/noticias');
        const data = await response.json();
        setNoticias(Array.isArray(data) && data.length ? data : newsData); // fallback para mock
      } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        setNoticias(newsData);
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

