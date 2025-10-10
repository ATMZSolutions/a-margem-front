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

      <div
        className="
          flex
          flex-wrap
          justify-center
          gap-10
          mt-44
          w-full
          max-w-6xl
          px-4
          mx-auto
        "
      >
        {premios.map((premio, index) => (
          <div key={index} className="flex justify-center">
            <Premio
              title={premio.title}
              evento={premio.evento}
              year={premio.year}
            />
          </div>
        ))}
      </div>
    </section>
  );
}