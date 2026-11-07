"use client";
import React, { useState } from "react";
import PhotoCarousel from "./PhotoCarousel";

export interface ImageInfo {
  descricao: string;
  data: string;
  img: string;
}

interface CarouselWithInfoProps {
  imagesInfo: ImageInfo[];
}

export default function CarouselWithInfo({ imagesInfo }: CarouselWithInfoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="w-full h-full">
      {/* Passa o callback para o PhotoCarousel */}
      <PhotoCarousel
        images={imagesInfo.map((i) => i.img)}
        onIndexChange={(index) => setCurrentIndex(index)}
      />

      {/* Renderiza a info abaixo */}
      {imagesInfo.length > 0 && (
        <div className="w-full flex flex-col items-end mt-2">
          <span className="text-white italic text-xs font-bold">
            {imagesInfo[currentIndex].data.length > 0 ? (
              new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(imagesInfo[currentIndex].data))
            ) : ''}
          </span>
          <span className="text-white italic text-xs font-bold">
            {imagesInfo[currentIndex].descricao}
          </span>
        </div>
      )}
    </div>
  );
}
