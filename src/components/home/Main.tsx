"use client";

import React, { useState, useEffect } from "react";

const images = ["/home/img1.jpg", "/home/img2.jpg", "/home/img3.jpg"];

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
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500`}
        style={{
          backgroundImage: `url(${images[currentBg]})`,
          opacity: fade ? 1 : 0,
        }}
      />

      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Logo centralizado com animação */}
      <div className="relative z-10 flex items-center justify-center w-full px-4">
        <img
          src="/grito-de-guerra.svg"
          alt="Grito de Guerra"
          className={`max-w-[30vh] w-full h-auto mx-auto transition-all duration-1000 ease-out
            ${showLogo ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-5"}`}
        />
      </div>
    </section>
  );
};

export default Main;
