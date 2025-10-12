import React from "react";
import Link from "next/link";
import { slugify } from "@/utils/helpers";
import Image from "next/image";

interface PremioProps {
  title: string;
  evento: string;
  year: string | number;
  isSaibaMais?: boolean;
}

const Premio: React.FC<PremioProps> = ({
  title,
  evento,
  year,
  isSaibaMais = false,
}) => {
  // Transformar o título em maiúsculo
  const titleUpper = title.toUpperCase();
  const href = `/premios/${slugify(title)}/${year}`;

  return (
    <div className="flex flex-col items-center justify-center w-60 md:w-72 text-center">
      <div className="relative flex items-center justify-center">
        <div
          className={`${
            isSaibaMais ? "w-42 md:w-56" : "w-56 md:w-64"
          } relative opacity-60`}
        >
          <Image
            src="/louros.svg"
            alt="Louros"
            fill
            className="object-contain" // mantém proporção
          />
        </div>

        <h1
          className={`absolute text-[#FECA55] font-bold ${
            isSaibaMais ? "text-xl" : "text-2xl"
          } leading-tight drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)]`}
        >
          {titleUpper.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </h1>
      </div>

      <p
        className={`text-white font-semibold tracking-widest text-sm md:text-base drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)]`}
      >
        {evento}
      </p>

      <p
        className={`mb-4 text-white font-semibold ${
          isSaibaMais ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
        } drop-shadow-[1px_1px_2px_rgba(0,0,0,0.6)] tracking-[0.6em] text-center translate-x-[0.3em]`}
      >
        {year}
      </p>

      <Link href={href} className="bg-white w-4/5 rounded text-black mx-2">
        <button
          className={`${
            isSaibaMais ? "hidden" : ""
          } w-full text-black p-1 cursor-pointer`}
        >
          Saiba mais
        </button>
      </Link>
    </div>
  );
};

export default Premio;
