import "./globals.css";
import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-black text-white w-full min-h-screen">
          <Sidebar />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
