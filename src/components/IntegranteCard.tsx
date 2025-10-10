"use client";

interface IntegranteCardProps {
  nome: string;
  image: string;
  onClick: () => void;
}

export default function IntegranteCard({ nome, image, onClick }: IntegranteCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-md overflow-hidden hover:scale-[1.03] transition-transform duration-200"
    >
      <img
        src={image}
        alt={nome}
        className="w-full h-52 md:h-64 object-cover"
      />
      <div className="absolute bottom-0 w-full bg-[#F38901] text-black text-center font-semibold">
        {nome}
      </div>
    </div>
  );
}
