import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import AgendaClient from "./AgendaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agenda cultural no Recife",
  description: "Confira apresentações, encontros e atividades culturais do Coletivo À Margem.",
  alternates: { canonical: "/agenda" },
  openGraph: { title: "Agenda | Coletivo À Margem", description: "Próximos eventos e atividades culturais.", url: "https://www.amargem.com.br/agenda" },
};

export default async function AgendaPage() {
  const events = await prisma.agenda.findMany({ orderBy: { data: "asc" } });
  return <AgendaClient initialEvents={events.map((event) => ({ ...event, data: event.data.toISOString(), createdAt: event.createdAt.toISOString() }))} />;
}
