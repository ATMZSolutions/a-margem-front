"use client";

import BackBtn from "@/components/BackBtn";
import NewsCard, { NewsItem } from "@/components/NewsCard";
import { useSiteTexts } from "@/components/SiteTextProvider";

interface NoticiaFromAPI {
  id: number;
  titulo: string;
  conteudo: string;
  link: string;
}

export default function NoticiasClient({ items }: { items: NoticiaFromAPI[] }) {
  const textos = useSiteTexts();
  const noticias: NewsItem[] = items.map((item) => ({
    id: item.id,
    title: item.titulo,
    description: item.conteudo,
    link: item.link,
  }));

  return (
    <section
      className="relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{ backgroundColor: "var(--site-primary)", backgroundImage: "var(--site-background-image)" }}
    >
      <BackBtn label="Notícias" textKey="tituloNoticias" />
      <div className="w-full max-w-5xl mt-40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {noticias.map((item, idx) => <NewsCard key={item.id} item={item} index={idx} />)}
      </div>
      {noticias.length === 0 && (
        <div className="text-center text-white/70 py-8">
          <p>{textos?.noticiasVazias ?? "Nenhuma notícia encontrada."}</p>
        </div>
      )}
    </section>
  );
}
