"use client";

import BackBtn from "@/components/BackBtn";

interface BookItem {
  id: number;
  title: string;
  author: string;
  description: string;
  image: string;
}

const booksData: BookItem[] = [
  {
    id: 1,
    title: "Quarto de Despejo",
    author: "Carolina Maria de Jesus",
    description:
      "Relato impactante do cotidiano na favela do Canindé, em São Paulo. A obra traz uma visão crua e poética da luta pela sobrevivência e dignidade.",
    image: "/coletivo/cas.webp",
  },
  {
    id: 2,
    title: "Torto Arado",
    author: "Itamar Vieira Junior",
    description:
      "Duas irmãs descobrem um segredo familiar que muda suas vidas. Uma narrativa potente sobre ancestralidade, resistência e identidade.",
    image: "/coletivo/cas.webp",
  },
];

export default function IndicacoesPage() {
  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundColor: "#5C1E0F",
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      {/* Botão voltar */}
      <BackBtn label="Indicações" />

      {/* Lista de livros */}
      <div className="w-full max-w-xl mt-32 grid sm:grid-cols-2 lg:grid-cols-2 gap-6 place-items-center">
        {booksData.map((book) => (
          <article
            key={book.id}
            className="bg-black/50 w-full rounded-t-xl border-b-4 border-b-[#F5A623] flex flex-col items-center p-4 hover:scale-[1.02] transition-transform duration-200"
          >
            {/* Imagem ajustada */}
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-72 object-cover rounded shadow-md"
            />

            {/* Texto */}
            <div className="mt-3 text-center">
              <h2 className="text-[#F5A623] font-semibold text-lg leading-tight">
                {book.title}
              </h2>
              <p className="text-sm italic text-gray-300 mb-1">
                {book.author}
              </p>
              <p className="text-sm text-gray-200 line-clamp-4">
                {book.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
