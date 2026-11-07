import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Integrantes",
  description: "Conheça as pessoas artistas e educadoras que formam o Coletivo À Margem.",
  alternates: { canonical: "/coletivo" },
  openGraph: { title: "Integrantes | Coletivo À Margem", description: "Artistas e educadores do coletivo.", url: "https://www.amargem.com.br/coletivo" },
};

export default function ColetivoLayout({ children }: { children: ReactNode }) {
  return children;
}
