import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedIntegrante } from "@/lib/publicContent";
import IntegranteClient from "./IntegranteClient";
import { getEntityMetadata, isPublicSitePage } from "@/lib/siteMetadata";

type Props = { params: Promise<{ nome: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nome } = await params;
  if (!await isPublicSitePage(`/coletivo/integrante/${nome}`)) return { title: "Integrante não encontrado" };
  const integrante = await getPublishedIntegrante(nome);
  if (!integrante) return { title: "Integrante não encontrado" };
  return getEntityMetadata(`/coletivo/integrante/${integrante.slug}`, integrante.nome, integrante.biografia.slice(0, 155), integrante.seo);
}

export default async function IntegrantePage({ params }: Props) {
  const { nome } = await params;
  if (!await isPublicSitePage(`/coletivo/integrante/${nome}`)) notFound();
  const integrante = await getPublishedIntegrante(nome);
  if (!integrante) notFound();
  return <IntegranteClient integrante={integrante} />;
}
