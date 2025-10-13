"use client";

import { motion } from "framer-motion";

export interface NewsItem {
  id: number;
  title: string; // mapeado de 'titulo'
  description: string; // mapeado de 'conteudo'
  link: string;
}

interface NewsCardProps {
  item: NewsItem;
  index: number;
}

export default function NewsCard({ item, index }: NewsCardProps) {
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, delay: index * 0.1 },
    },
  };

  return (
    <motion.article
      className="relative bg-black/50 rounded-lg overflow-hidden flex flex-col items-center justify-between p-4 hover:scale-[1.03] transition-transform duration-200"
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {/* Conteúdo */}
      <div className="flex flex-col items-start text-start w-full justify-start z-10">
        <h2 className="text-[#F5A623] font-semibold text-base sm:text-lg mb-2">
          {item.title}
        </h2>
        <p className="text-sm text-gray-200 line-clamp-3">{item.description}</p>
      </div>
      {/* Botão flutuante */}
      <div className="w-full flex itens-end justify-end mt-2">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-[#F38901]/70 text-black/70 text-xs sm:text-sm font-semibold rounded-lg z-20 hover:scale-105 transition-transform duration-200"
        >
          SAIBA MAIS
        </a>
      </div>
    </motion.article>
  );
}
