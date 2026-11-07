"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

interface TopButtonProps {
  show?: boolean;
  href?: string;
  label?: string;
}

interface PhotoCarouselProps {
  images?: string[];
  topButton?: TopButtonProps;
    onIndexChange?: (index: number) => void; // callback opcional
}

export default function PhotoCarousel({ images = [], topButton, onIndexChange }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  const nextSlide = () => {
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    onIndexChange?.(newIndex);
  };

  if (!images.length) return null;

  return (
    <div className="relative mx-auto w-full h-full flex items-center justify-center">
      {/* Botão opcional no topo */}
      {topButton?.show && (
        <div className="absolute top-4 left-4 z-10">
          <Link
            href={topButton.href || "#"}
            className="bg-[#F38901]/70 text-black font-semibold text-sm px-2 py-1 rounded hover:bg-opacity-70 transition"
          >
            {topButton.label}
          </Link>
        </div>
      )}

      {/* Botão esquerdo */}
      <button
        onClick={prevSlide}
        className="absolute left-0 sm:-left-10 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white text-2xl sm:text-3xl z-20 focus:outline-none"
        aria-label="Previous slide"
      >
        <LeftOutlined />
      </button>

      {/* Imagem */}
      <div className="relative overflow-hidden w-full h-full border-b-8 border border-[#F38901]/70">
        <Image
          src={images[currentIndex]}
          alt={`Fotografia do Coletivo À Margem, slide ${currentIndex + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, 60vw"
          className="object-cover"
        />
      </div>

      {/* Botão direito */}
      <button
        onClick={nextSlide}
        className="absolute right-0 sm:-right-10 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white text-2xl sm:text-3xl z-20 focus:outline-none"
        aria-label="Next slide"
      >
        <RightOutlined />
      </button>
    </div>
  );
}
