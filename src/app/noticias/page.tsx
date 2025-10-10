"use client";

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
  {
    id: 3,
    title: "Folha de Pernambuco",
    source: "Folha de Pernambuco",
    description:
      "Projeto Terça em Cena é retomado na UFPE com a peça Xirê, que explora temas contemporâneos e valoriza a diversidade cultural.",
    image: "https://picsum.photos/400?random=3",
    link: "#",
  },
  {
    id: 4,
    title: "Agenda Cultural",
    source: "Agenda Cultural",
    description:
      "Peça 'Xirê' marca o retorno do projeto Terça em Cena, na UFPE, oferecendo ao público uma experiência teatral única.",
    image: "https://picsum.photos/400?random=4",
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
      <BackBtn label="Notícias" />

      <div className="w-full max-w-5xl mt-40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsData.map((item, idx) => (
          <NewsCard key={item.id} item={item} index={idx} />
        ))}
      </div>
    </section>
  );
}
