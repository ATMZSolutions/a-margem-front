"use client";

import { useState, useEffect } from "react";
import BackBtn from "@/components/BackBtn";

interface LivroItem {
  id: number;
  titulo: string;
  autor: string;
  descricao: string;
  imagem?: string;
  imageUrl?: string;
  createdAt: string;
}

interface LivrosPageProps {
  bgColor?: string;
  bgImage?: string;
}

export default function IndicacoesPage({
  bgColor = "#5C1E0F",
  bgImage = "/padrao2.webp",
}: LivrosPageProps) {
  const [livros, setLivros] = useState<LivroItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLivros() {
      try {
        const response = await fetch('/api/livros');
        const data = await response.json();
        setLivros(data || []);
      } catch (error) {
        console.error('Erro ao carregar livros:', error);
        setLivros([]);
      } finally {
        setLoading(false);
      }
    }

    loadLivros();
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex justify-center items-center"
        style={{ backgroundColor: bgColor }}
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
          className="absolute inset-0 bg-cover bg-center opacity-5 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      <BackBtn label="Livros" />

      <div className="relative w-full max-w-4xl text-white font-sans mx-4 z-10 mt-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#F38901] mb-2">
            Nossa Biblioteca
          </h1>
          <p className="text-lg text-white/80">
            Livros Recomendados
          </p>
        </div>

        {livros.length === 0 ? (
          <div className="text-center text-white/70 py-16">
            <p className="text-xl">Nenhum livro disponível no momento.</p>
            <p className="text-sm mt-2">Em breve teremos novos títulos para você!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {livros.map((livro) => (
              <div
                key={livro.id}
                className="bg-black/20 backdrop-blur-sm rounded-lg p-6 hover:bg-black/30 transition-all duration-300"
              >
                {livro.imageUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={livro.imageUrl}
                      alt={livro.titulo}
                      className="w-32 h-44 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="font-bold text-xl text-[#F38901] mb-2">
                    {livro.titulo}
                  </h3>
                  
                  <p className="text-white/90 font-medium mb-3">
                    por {livro.autor}
                  </p>
                  
                  <p className="text-white/70 text-sm leading-relaxed">
                    {livro.descricao}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-white/50">
                      Publicado em {new Date(livro.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}