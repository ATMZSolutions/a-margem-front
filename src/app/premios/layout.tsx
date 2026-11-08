import type { ReactNode } from "react";
import { getPageMetadata } from "@/lib/siteMetadata";

export function generateMetadata() { return getPageMetadata("/premios", "Prêmios e reconhecimentos", "Prêmios e reconhecimentos recebidos pelo Coletivo À Margem."); }

export default function PremiosLayout({ children }: { children: ReactNode }) {
  return children;
}
