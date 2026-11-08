import type { ReactNode } from "react";
import { getPageMetadata } from "@/lib/siteMetadata";

export function generateMetadata() { return getPageMetadata("/contato", "Contato", "Fale com o Coletivo À Margem sobre apresentações, oficinas e parcerias culturais."); }

export default function ContatoLayout({ children }: { children: ReactNode }) {
  return children;
}
