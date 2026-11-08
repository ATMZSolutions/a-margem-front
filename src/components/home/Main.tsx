"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { HomeSettings } from "@/lib/siteContent";

const Main = ({ settings }: { settings: HomeSettings }) => {
  const images = settings.slides.map((slide) => slide.url).filter((url): url is string => Boolean(url));
  const [currentBg, setCurrentBg] = useState(0);
  const [fade, setFade] = useState(true);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    const logoTimeout = setTimeout(() => setShowLogo(true), 300);
    // Troca automática das imagens com fade
    if (images.length < 2) return () => clearTimeout(logoTimeout);
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentBg((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 500);
    }, settings.intervaloSlidesMs);

    return () => {
      clearInterval(interval);
      clearTimeout(logoTimeout);
    };
  }, [images.length, settings.intervaloSlidesMs]);

  return (
    <section className="min-h-screen w-full flex justify-center items-center relative overflow-hidden">
      {/* Fundo dinâmico */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
        <Image
          src={images[currentBg] ?? "/home/img1.webp"}
          alt={settings.slides[currentBg]?.alt ?? ""}
          fill
          sizes="100vw"
          priority={currentBg === 0}
          unoptimized
          className="object-cover"
        />
      </div>

      {/* Overlay escuro */}
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${settings.opacidadeOverlay})` }} />

      {/* Logo centralizado com animação */}
      <div className="relative z-10 flex items-center justify-center w-full px-4">
        <Image
          src={settings.logoHero.url ?? "/grito-de-guerra.webp"}
          alt={settings.logoHero.alt}
          width={1080}
          height={2000}
          priority
          unoptimized
          className={`max-w-[30vh] w-full h-auto mx-auto transition-all duration-1000 ease-out
            ${showLogo ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-5"}`}
        />
      </div>
    </section>
  );
};

export default Main;
