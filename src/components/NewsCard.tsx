"use client";

import { motion } from "framer-motion";

export interface NewsItem {
  id: number;
  title: string;
  source: string;
  description: string;
  image: string;
  link: string;
}

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

export default function NewsCard({ item, index }: NewsCardProps) {
  // Animação de fade-in simples, sem deslocamento vertical
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, delay: index * 0.1 },
    },
  };

  return (
    <motion.article
      className="relative bg-black/50 rounded-lg overflow-hidden flex flex-col items-center justify-center aspect-square p-4 hover:scale-[1.03] transition-transform duration-200"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* Blur background */}
      <div className="absolute inset-0 z-0 backdrop-blur-md" aria-hidden="true" />

      {/* Imagem */}
      <img
        src={item.image}
        alt={item.title}
        className="w-full h-3/5 object-cover rounded-md z-10 mb-2"
      />

      {/* Botão flutuante */}
      <a
        href={item.link}
        className="absolute right-6 top-6 px-3 py-1 bg-[#F38901]/70 text-black text-xs sm:text-sm font-semibold rounded-lg z-20 hover:scale-105 transition-transform duration-200"
      >
        SAIBA MAIS
      </a>

      {/* Texto centralizado */}
      <div className="flex flex-col items-center text-center w-full h-2/5 z-10 mt-2">
        <h2 className="text-[#F5A623] font-semibold text-base sm:text-lg">
          {item.source}
        </h2>
        <p className="text-sm text-gray-200 mt-1 line-clamp-3">
          {item.description}
        </p>
      </div>
    </motion.article>
  );
}
