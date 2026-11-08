"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TransversalSettings } from "@/lib/siteContent";

const SiteTextContext = createContext<TransversalSettings["textos"] | null>(null);

export function SiteTextProvider({ textos, children }: { textos: TransversalSettings["textos"]; children: ReactNode }) {
  return <SiteTextContext.Provider value={textos}>{children}</SiteTextContext.Provider>;
}

export function useSiteTexts() {
  return useContext(SiteTextContext);
}
