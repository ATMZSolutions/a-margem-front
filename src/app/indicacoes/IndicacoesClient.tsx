"use client";

import { useState } from "react";
import Image from "next/image";
import BackBtn from "@/components/BackBtn";
import AppDrawer from "@/components/AppDrawer";
import { useSiteTexts } from "@/components/SiteTextProvider";

interface LivroItem {
  id: number;
  titulo: string;
  autor: string;
  descricao: string;
  imagem?: string | null;
  imageUrl?: string | null;
  createdAt: string;
}

interface LivrosPageProps {
  bgColor?: string;
  bgImage?: string;
  initialBooks: LivroItem[];
}

export default function IndicacoesPage({
  bgColor = "var(--site-primary)",
  bgImage = "var(--site-background-image)",
  initialBooks,
}: LivrosPageProps) {
  const textos = useSiteTexts();
  const [livros] = useState<LivroItem[]>(initialBooks);
  const loading = false;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState<string[]>([]);
  const [drawerTitle, setDrawerTitle] = useState("");

  const openDrawer = (livro: LivroItem) => {
    const paragraphs = livro.descricao
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    setDrawerTitle(livro.titulo);
    setDrawerContent(paragraphs);
    setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex justify-center items-center"
        style={{ backgroundColor: bgColor, backgroundImage: bgImage.startsWith("var(") ? bgImage : `url(${bgImage})` }}
      >
        <div className="text-white">{textos?.carregando ?? "Carregando…"}</div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen w-full justify-center px-4 py-24"
      style={{ backgroundColor: bgColor }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 pointer-events-none"
          style={{ backgroundImage: bgImage.startsWith("var(") ? bgImage : `url(${bgImage})` }}
        />
      )}
      <BackBtn label="Livros" textKey="tituloIndicacoes" />

      <div className="relative z-10 mx-auto mt-16 w-full max-w-7xl font-sans text-white lg:px-4">
        <header className="mb-8 border-b border-white/15 pb-6 sm:mb-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-site-accent">{textos?.tituloIndicacoes ?? "Nossa Biblioteca"}</p>
          <h1 className="font-sedgwick text-3xl font-normal leading-tight text-white sm:text-4xl">{textos?.livrosSubtitulo ?? "Livros Recomendados"}</h1>
        </header>

        {livros.length === 0 ? (
          <div className="text-center text-white/70 py-16">
            <p className="text-xl">{textos?.livrosVazios ?? "Nenhum livro disponível no momento."}</p>
            <p className="text-sm mt-2">{textos?.livrosComplementoVazio ?? "Em breve teremos novos títulos para você!"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {livros.map((livro) => (
              <article
                key={livro.id}
                className="flex min-w-0 items-start gap-4 rounded-xl border border-white/15 bg-black/30 p-4 shadow-lg transition-colors hover:border-site-accent/50 hover:bg-black/40 sm:gap-5 sm:p-5"
              >
                <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg bg-white/10 shadow-md sm:w-32 lg:w-36">
                  <Image
                    src={livro.imageUrl || livro.imagem || "/padrao2.webp"}
                    alt={livro.titulo}
                    fill
                    sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 144px"
                    className="object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col self-stretch">
                  <h2 className="mb-2 text-base font-bold leading-snug text-white sm:text-lg">
                    {livro.titulo}
                  </h2>
                  <p className="mb-3 text-xs font-medium text-site-accent sm:text-sm">
                    {livro.autor}
                  </p>
                  <p className="line-clamp-3 text-sm leading-6 text-white/80 sm:line-clamp-4">
                    {livro.descricao}
                  </p>
                  <div className="mt-auto pt-4">
                    <button
                      type="button"
                      className="min-h-11 rounded-full border border-site-accent px-4 text-sm font-semibold text-site-accent transition hover:bg-site-accent hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent"
                      onClick={() => openDrawer(livro)}
                    >
                      {textos?.saibaMais ?? "Saiba mais"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerTitle}
        contents={drawerContent}
      />
    </div>
  );
}
