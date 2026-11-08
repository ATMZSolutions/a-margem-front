import type { ReactNode } from "react";
import { getPageMetadata } from "@/lib/siteMetadata";

export function generateMetadata() { return getPageMetadata("/coletivo", "Integrantes", "Conheça as pessoas artistas e educadoras que formam o Coletivo À Margem."); }

export default function ColetivoLayout({ children }: { children: ReactNode }) {
  return children;
}
