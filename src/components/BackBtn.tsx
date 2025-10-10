"use client";

import { useRouter } from "next/navigation";
import { CircleArrowLeft } from "lucide-react";

interface BackBtnProps {
  label?: string;
  color?: string;
}

/**
 * Botão de voltar padrão, usado em headers ou páginas internas.
 * - Mostra ícone e texto opcionais.
 * - Usa `router.back()` para retornar à página anterior.
 */
export default function BackBtn({ label, color }: BackBtnProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`absolute top-24 md:left-40 left-4 flex flex-row items-center gap-2 text-white/90 ${color}!`}
      aria-label="Voltar"
    >
      <CircleArrowLeft size={25} strokeWidth={2.5} />
      <span className="font-sedgwick text-2xl font-medium uppercase tracking-widest">
        {label}
      </span>
    </button>
  );
}
