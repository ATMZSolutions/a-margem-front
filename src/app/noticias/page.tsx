"use client";

import BackBtn from "@/components/BackBtn";

interface NewsItem {
  id: number;
  title: string;
  source: string;
  description: string;
  image: string;
  link: string;
}

const newsData: NewsItem[] = [
  {
    id: 1,
    title: "Revista Ogrito",
    source: "Revista Ogrito",
    description:
      "Xirê, peça do coletivo À Margem, marca o retorno do projeto Terça em Cena, trazendo uma abordagem inovadora sobre cultura e resistência. O espetáculo promete emocionar o público com sua narrativa envolvente e performances marcantes.",
    image: "https://picsum.photos/200?random=1",
    link: "#",
  },
  {
    id: 2,
    title: "Diário de Pernambuco",
    source: "Diário de Pernambuco",
    description:
      "Peça 'Xirê' marca o retorno do projeto Terça em Cena, na UFPE, reunindo artistas e espectadores em uma celebração da arte local. O evento destaca a importância do teatro como ferramenta de transformação social.",
    image: "https://picsum.photos/200?random=2",
    link: "#",
  },
  {
    id: 3,
    title: "Folha de Pernambuco",
    source: "Folha de Pernambuco",
    description:
      "Projeto Terça em Cena é retomado na UFPE com a peça Xirê, que explora temas contemporâneos e valoriza a diversidade cultural. A iniciativa reforça o compromisso da universidade com a promoção das artes cênicas.",
    image: "https://picsum.photos/200?random=3",
    link: "#",
  },
  {
    id: 4,
    title: "Agenda Cultural",
    source: "Agenda Cultural",
    description:
      "Peça 'Xirê' marca o retorno do projeto Terça em Cena, na UFPE, oferecendo ao público uma experiência teatral única. O espetáculo destaca-se pela originalidade e pelo engajamento dos artistas envolvidos.",
    image: "https://picsum.photos/200?random=4",
    link: "#",
  },
];

export default function NoticiasPage() {
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
        {newsData.map((item) => (
            <article
            key={item.id}
            className="relative bg-black/50 w-full rounded-t-xl border-b-4 border-b-[#F5A623] overflow-hidden flex flex-col sm:flex-row items-center gap-6 p-5 hover:scale-[1.02] transition-transform duration-200 h-[350px] sm:h-[220px]"
            >
            {/* Blur background */}
            <div className="absolute inset-0 z-0 backdrop-blur-md" aria-hidden="true" />
            {/* Imagem */}
            <img
              src={item.image}
              alt={item.title}
              className="w-full sm:w-60 h-40 sm:h-full object-cover rounded-md z-10"
            />

            {/* Texto */}
            <div className="flex flex-col justify-between w-full sm:w-3/5 h-full z-10">
              <div className="overflow-hidden">
              <h2 className="text-[#F5A623] font-semibold text-lg sm:text-xl leading-tight">
                {item.source}
              </h2>
              <p className="text-sm sm:text-base text-justify text-gray-200 mt-1 line-clamp-3">
                {item.description}
              </p>
              </div>

              <a
              href={item.link}
              className="self-end mt-3 px-4 py-1 bg-[#f1f1f1] text-black text-xs sm:text-sm font-semibold rounded-lg"
              >
              SAIBA MAIS
              </a>
            </div>
            </article>
        ))}
      </div>
    </section>
  );
}
