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
      .split(/\.(\s+)/)
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
        <div className="text-white">Carregando livros...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex justify-center py-24 relative"
      style={{ backgroundColor: bgColor }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 pointer-events-none"
          style={{ backgroundImage: bgImage.startsWith("var(") ? bgImage : `url(${bgImage})` }}
        />
      )}
      <BackBtn label="Livros" textKey="tituloIndicacoes" />

      <div className="relative w-full max-w-6xl text-white font-sans mx-4 z-10 mt-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-site-accent mb-2">{textos?.tituloIndicacoes ?? "Nossa Biblioteca"}</h1>
          <p className="text-lg text-white/80">Livros Recomendados</p>
        </div>

        {livros.length === 0 ? (
          <div className="text-center text-white/70 py-16">
            <p className="text-xl">{textos?.livrosVazios ?? "Nenhum livro disponível no momento."}</p>
            <p className="text-sm mt-2">Em breve teremos novos títulos para você!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {livros.map((livro) => (
              <div
                key={livro.id}
                className="bg-black/20 backdrop-blur-sm rounded-t-lg border-b-3 border-site-accent hover:bg-black/30 transition-all duration-300 flex flex-col items-center p-4 sm:p-6 max-w-xs mx-auto"
              >
                <div className="mb-4 flex justify-center w-full">
                  <Image
                    src={livro.imageUrl || livro.imagem || "/padrao2.webp"}
                    alt={livro.titulo}
                    width={160}
                    height={224}
                    sizes="(max-width: 640px) 160px, 128px"
                    className="w-40 h-56 sm:w-32 sm:h-44 object-cover rounded-lg shadow-lg"
                  />
                </div>
                <div className="text-end flex flex-col flex-1 w-full">
                  <h3 className="font-bold text-lg sm:text-xl text-site-accent mb-1 sm:mb-2">
                    {livro.titulo}
                  </h3>
                  <p className="text-white/90 font-medium text-xs sm:text-sm text-end mb-4">
                    {livro.autor}
                  </p>
                  <p className="text-white/70 text-justify indent-4 text-sm leading-tight line-clamp-5">
                    {livro.descricao}
                  </p>
                  <div className="mt-auto pt-4 flex flex-col items-center w-full">
                    <button
                      className="text-sm w-full text-site-accent rounded-2xl border border-site-accent px-3 py-1 sm:px-4 sm:py-1"
                      onClick={() => openDrawer(livro)}
                    >
                      {textos?.saibaMais ?? "Saiba mais"}
                    </button>
                  </div>
                </div>
              </div>
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
