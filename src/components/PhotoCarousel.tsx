"use client";

import { useState } from "react";
import Link from "next/link";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

interface TopButtonProps {
  show?: boolean;
  href?: string;
  label?: string;
}

interface PhotoCarouselProps {
  images?: string[];
  topButton?: TopButtonProps;
}

export default function PhotoCarousel({ images = [], topButton }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) return null;

  return (
    <div className="relative max-w-md mx-auto flex items-center">
      {/* Botão opcional no topo */}
      {topButton?.show && (
        <div className="absolute top-4 left-4 z-10">
          <Link
            href={topButton.href || "#"}
            className="bg-[#00000080] text-white text-sm px-2 py-1 rounded hover:bg-opacity-70 transition"
          >
            {topButton.label}
          </Link>
        </div>
      )}

      {/* Botão esquerdo - fora da imagem */}
      <button
        onClick={prevSlide}
        className="absolute -left-14 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white text-3xl z-20 focus:outline-none"
        aria-label="Previous slide"
      >
        <LeftOutlined />
      </button>

      {/* Imagem atual */}
      <div className="overflow-hidden border-b-8 border-[#F38901] w-full rounded-t-lg">
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Botão direito - fora da imagem */}
      <button
        onClick={nextSlide}
        className="absolute -right-14 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white text-3xl z-20 focus:outline-none"
        aria-label="Next slide"
      >
        <RightOutlined />
      </button>
    </div>
  );
}
