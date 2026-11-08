"use client";

import { useRouter } from "next/navigation";
import { CircleArrowLeft } from "lucide-react";
import { useSiteTexts } from "@/components/SiteTextProvider";
import type { TransversalSettings } from "@/lib/siteContent";

interface BackBtnProps {
  label?: string;
  color?: string;
  textKey?: keyof TransversalSettings["textos"];
}

/**
 * Botão de voltar padrão, usado em headers ou páginas internas.
 * - Mostra ícone e texto opcionais.
 * - Usa `router.back()` para retornar à página anterior.
 */
export default function BackBtn({ label, color, textKey }: BackBtnProps) {
  const router = useRouter();
  const textos = useSiteTexts();
  const labelConfigurado = textKey && textos ? textos[textKey] : label;

  return (
    <button
      onClick={() => router.back()}
      className={`absolute top-24 md:left-40 left-4 flex flex-row items-center gap-2 text-white/90 ${color}!`}
      aria-label={textos?.voltar ?? "Voltar"}
    >
      <CircleArrowLeft size={25} strokeWidth={2.5} style={{ cursor: 'pointer' }}/>
      <span className="font-sedgwick text-2xl font-medium uppercase tracking-widest">
        {labelConfigurado}
      </span>
    </button>
  );
}
