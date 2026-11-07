import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Espetáculos de teatro hip-hop",
  description: "Conheça os espetáculos e trabalhos cênicos do Coletivo À Margem, em Pernambuco.",
  alternates: { canonical: "/espetaculos" },
  openGraph: { title: "Espetáculos | Coletivo À Margem", description: "Teatro hip-hop e criações do coletivo.", url: "https://www.amargem.com.br/espetaculos" },
};

export default function EspetaculosLayout({ children }: { children: ReactNode }) {
  return children;
}
