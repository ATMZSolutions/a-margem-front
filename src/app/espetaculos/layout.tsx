import type { ReactNode } from "react";
import { getPageMetadata } from "@/lib/siteMetadata";

export function generateMetadata() { return getPageMetadata("/espetaculos", "Espetáculos de teatro hip-hop", "Conheça os espetáculos e trabalhos cênicos do Coletivo À Margem, em Pernambuco."); }

export default function EspetaculosLayout({ children }: { children: ReactNode }) {
  return children;
}
