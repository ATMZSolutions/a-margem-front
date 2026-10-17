"use client";

import Image from "next/image";

interface IntegranteCardProps {
  nome: string;
  image: string;
  onClick: () => void;
}

export default function IntegranteCard({ nome, image, onClick }: IntegranteCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative h-52 md:h-64 cursor-pointer rounded-md overflow-hidden hover:scale-[1.03] transition-transform duration-200"
    >
      <Image
        src={image}
        alt={nome}
        fill
        sizes="(max-width: 640px) 50vw, 33vw"
        className="object-cover"
      />
      <div className="absolute bottom-0 w-full bg-[#F38901] text-black text-center font-semibold">
        {nome}
      </div>
    </div>
  );
}
