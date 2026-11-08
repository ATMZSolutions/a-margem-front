import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPublicAgenda } from "@/lib/publicContent";
import { getPageMetadata, isPublicSitePage } from "@/lib/siteMetadata";
import AgendaClient from "./AgendaClient";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> { return getPageMetadata("/agenda", "Agenda cultural no Recife", "Confira apresentações, encontros e atividades culturais do Coletivo À Margem."); }

export default async function AgendaPage() {
  if (!await isPublicSitePage("/agenda")) notFound();
  const events = await listPublicAgenda();
  return <AgendaClient initialEvents={events.map((event) => ({ ...event, data: event.data.toISOString(), createdAt: event.createdAt.toISOString() }))} />;
}
