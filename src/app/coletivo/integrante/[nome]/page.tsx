import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedIntegrante } from "@/lib/publicContent";
import IntegranteClient from "./IntegranteClient";

type Props = { params: Promise<{ nome: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nome } = await params;
  const integrante = await getPublishedIntegrante(nome);
  if (!integrante) return { title: "Integrante não encontrado" };
  return {
    title: integrante.nome,
    description: integrante.biografia.slice(0, 155),
    alternates: { canonical: `/coletivo/integrante/${integrante.slug}` },
    openGraph: {
      title: `${integrante.nome} | Coletivo À Margem`,
      description: integrante.biografia.slice(0, 155),
      url: `https://www.amargem.com.br/coletivo/integrante/${integrante.slug}`,
    },
  };
}

export default async function IntegrantePage({ params }: Props) {
  const { nome } = await params;
  const integrante = await getPublishedIntegrante(nome);
  if (!integrante) notFound();
  return <IntegranteClient integrante={integrante} />;
}
