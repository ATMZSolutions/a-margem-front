import "./globals.css";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";

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
