import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Prêmios e reconhecimentos",
  description: "Prêmios e reconhecimentos recebidos pelo Coletivo À Margem.",
  alternates: { canonical: "/premios" },
  openGraph: { title: "Prêmios | Coletivo À Margem", description: "Reconhecimentos do coletivo.", url: "https://www.amargem.com.br/premios" },
};

export default function PremiosLayout({ children }: { children: ReactNode }) {
  return children;
}
