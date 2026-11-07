import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

const siteUrl = "https://www.amargem.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Coletivo À Margem | Teatro hip-hop e cultura no Recife",
    template: "%s | Coletivo À Margem",
  },
  description: "Coletivo À Margem: teatro hip-hop, arte, cultura e ações colaborativas no Recife, Pernambuco.",
  keywords: ["Coletivo À Margem", "teatro hip-hop", "cultura", "Recife", "Pernambuco", "arte-educação"],
  authors: [{ name: "Coletivo À Margem" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Coletivo À Margem",
    description: "Teatro hip-hop, arte e cultura no Recife.",
    url: siteUrl,
    siteName: "Coletivo À Margem",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/amargem-logo-insta.webp", width: 1200, height: 630, alt: "Coletivo À Margem" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coletivo À Margem",
    description: "Teatro hip-hop, arte e cultura no Recife.",
    images: ["/amargem-logo-insta.webp"],
  },
  icons: { icon: "/favicon.ico" },
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
