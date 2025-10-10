import React from "react";
import PhotoCarousel from "../PhotoCarousel";

const randomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
];

const Sobre = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Imagem de fundo atrás de tudo */}
      <img
        src="/exu-bg.svg"
        alt="Background Exu"
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />

      {/* Overlay preto com opacidade */}
      <div className="absolute inset-0 bg-black/70 -z-5" />

      <div className="relative flex flex-col md:flex-row w-4/5 md:w-3/5 gap-8 md:gap-16 z-10 text-white items-stretch">
        {/* Carousel */}
        <div className="flex-1 flex items-center">
          <PhotoCarousel images={randomImages} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-end font-sedgwick uppercase tracking-widest text-3xl md:text-5xl font-bold text-[#F38901]">
            Sobre nós
          </h2>
          <p className="mt-4 text-justify indent-4">
            O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop.
          </p>
          <button className="flex items-center justify-center w-full mt-4 py-1 border text-[#F38901] border-[#F38901] rounded-xl">
            Conheça nossa história
          </button>
        </div>
      </div>
    </section>
  );
};

export default Sobre;
