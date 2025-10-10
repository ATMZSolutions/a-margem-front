"use client";

import React, { useState, useEffect } from "react";

const images = [
  "/home/img1.jpg",
  "/home/img2.jpg",
  "/home/img3.jpg",
];

const Main = () => {
  const [currentBg, setCurrentBg] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // inicia fade-out da imagem
      setTimeout(() => {
        setCurrentBg((prev) => (prev + 1) % images.length);
        setFade(true); // inicia fade-in da nova imagem
      }, 500); // duração do fade
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen w-full flex justify-center items-center relative">
      {/* Imagem de fundo com fade */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
        style={{
          backgroundImage: `url(${images[currentBg]})`,
          opacity: fade ? 1 : 0,
        }}
      />

      {/* Overlay preto fixo */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Logo centralizado */}
      <div className="relative z-10 flex items-center justify-center w-full px-4">
        <img
          src="/grito-de-guerra.svg"
          alt="Grito de Guerra"
          className="max-w-[30vh] w-full h-auto mx-auto"
        />
      </div>
    </section>
  );
};

export default Main;
