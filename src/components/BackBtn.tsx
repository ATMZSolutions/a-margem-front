"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * Botão de voltar padrão, usado em headers ou páginas internas.
 * - Mostra ícone e texto opcionais.
 * - Usa `router.back()` para retornar à página anterior.
 */
export default function BackBtn({ label }: { label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="absolute top-20 md:left-40 left-4 flex flex-row items-center"
      aria-label="Voltar"
    >
      <ChevronLeft size={22} strokeWidth={2.5} />
      <span className="text-2xl font-medium">{label}</span>
    </button>
  );
}
