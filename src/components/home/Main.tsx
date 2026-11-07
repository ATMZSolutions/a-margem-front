"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const images = ["/home/img1.webp", "/home/img2.webp", "/home/img3.webp"];

const Main = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const [fade, setFade] = useState(true);
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Troca automática das imagens com fade
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentBg((prev) => (prev + 1) % images.length);
        setFade(true);
      }, 500);
    }, 5000);

    // Exibe o logo com delay (efeito de entrada)
    const logoTimeout = setTimeout(() => setShowLogo(true), 300);

    return () => {
      clearInterval(interval);
      clearTimeout(logoTimeout);
    };
  }, []);

  return (
    <section className="min-h-screen w-full flex justify-center items-center relative overflow-hidden">
      {/* Fundo dinâmico */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
        <Image
          src={images[currentBg]}
          alt=""
          fill
          sizes="100vw"
          priority={currentBg === 0}
          className="object-cover"
        />
      </div>

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Logo centralizado com animação */}
      <div className="relative z-10 flex items-center justify-center w-full px-4">
        <Image
          src="/grito-de-guerra.webp"
          alt="Grito de Guerra"
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
