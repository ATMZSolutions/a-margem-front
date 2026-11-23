"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useSiteTexts } from "@/components/SiteTextProvider";

interface TopButtonProps {
  show?: boolean;
  href?: string;
  label?: string;
}

interface PhotoCarouselProps {
  images?: string[];
  imageAlts?: string[];
  imageFits?: Array<"conter" | "conter-no-desktop" | undefined>;
  frameClassName?: string;
  topButton?: TopButtonProps;
    onIndexChange?: (index: number) => void; // callback opcional
}

export default function PhotoCarousel({ images = [], imageAlts = [], imageFits = [], frameClassName, topButton, onIndexChange }: PhotoCarouselProps) {
  const textos = useSiteTexts();
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
            className="bg-site-accent/70 text-black font-semibold text-sm px-2 py-1 rounded hover:bg-opacity-70 transition"
          >
            {topButton.label}
          </Link>
        </div>
      )}

      {/* Botão esquerdo */}
      {images.length > 1 && <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/75 text-2xl text-white shadow-lg sm:h-12 sm:w-12 sm:text-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-site-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label={textos?.slideAnterior ?? "Slide anterior"}
      >
        <LeftOutlined />
      </button>}

      {/* Imagem */}
      <div className={`relative h-full w-full overflow-hidden ${frameClassName ?? "border-b-8 border border-site-accent/70"}`}>
        <Image
          src={images[currentIndex]}
          alt={imageAlts[currentIndex] || `Fotografia do Coletivo À Margem, slide ${currentIndex + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, 60vw"
          unoptimized
          priority={currentIndex === 0}
          className={
            imageFits[currentIndex] === "conter"
              ? "object-contain"
              : imageFits[currentIndex] === "conter-no-desktop"
                ? "object-cover lg:object-contain"
                : "object-cover"
          }
        />
      </div>

      {/* Botão direito */}
      {images.length > 1 && <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/75 text-2xl text-white shadow-lg sm:h-12 sm:w-12 sm:text-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-site-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label={textos?.proximoSlide ?? "Próximo slide"}
      >
        <RightOutlined />
      </button>}
    </div>
  );
}
