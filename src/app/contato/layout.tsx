import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o Coletivo À Margem sobre apresentações, oficinas e parcerias culturais.",
  alternates: { canonical: "/contato" },
  openGraph: { title: "Contato | Coletivo À Margem", description: "Entre em contato com o coletivo.", url: "https://www.amargem.com.br/contato" },
};

export default function ContatoLayout({ children }: { children: ReactNode }) {
  return children;
}
