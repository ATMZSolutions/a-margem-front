import "./globals.css";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

// SEO GLOBAL
export const metadata: Metadata = {
  title: "À MARGEM | amargem.com.br",
  description:
    "À Margem — arte, cultura e resistência. Produções, eventos e ações colaborativas no Recife.",
  keywords: [
    "à margem",
    "hip hop",
    "teatro",
    "resistência",
    "arte",
    "cultura",
    "recife",
    "projetos sociais",
    "eventos culturais",
  ],
  authors: [{ name: "à Margem" }],
  openGraph: {
    title: "À Margem",
    description: "Conheça o Coletivo À Margem, o primeiro grupo de teatro hip-hop de Pernambuco.",
    url: "https://www.amargem.com.br",
    siteName: "À Margem",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://www.amargem.com.br/amargem-logo-insta.webp",
        width: 1200,
        height: 630,
        alt: "À Margem - imagem de capa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "À Margem",
    description: "Arte, cultura e resistência em movimento.",
    images: ["https://www.amargem.com.br/amargem-logo-insta.webp"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white w-full min-h-screen">
        <Sidebar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
