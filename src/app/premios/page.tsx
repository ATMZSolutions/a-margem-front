"use client";
import BackBtn from '@/components/BackBtn';
import Premio from '@/components/Premio';
import React from 'react';
import { premios } from '@/data/premios';

export default function PremiosPage() {
  return (
    <section
      className="relative bg-[#412551] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Prêmios" />

      <div className="flex flex-col items-center justify-center gap-10 ">
        {premios.map((premio, index) => (
          <Premio
            key={index}
            title={premio.title}
            evento={premio.evento}
            year={premio.year}
          />
        ))}
      </div>
    </section>
  );
}
