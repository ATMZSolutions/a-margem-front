import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { integrantes } from "@/data/integrantes";
import IntegranteClient from "./IntegranteClient";

type Props = { params: Promise<{ nome: string }> };

export function generateStaticParams() {
  return integrantes.map(({ id }) => ({ nome: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nome } = await params;
  const integrante = integrantes.find((person) => person.id === nome);
  if (!integrante) return { title: "Integrante não encontrado" };
  return {
    title: integrante.nome,
    description: integrante.biografia.slice(0, 155),
    alternates: { canonical: `/coletivo/integrante/${integrante.id}` },
    openGraph: {
      title: `${integrante.nome} | Coletivo À Margem`,
      description: integrante.biografia.slice(0, 155),
      url: `https://www.amargem.com.br/coletivo/integrante/${integrante.id}`,
    },
  };
}

export default async function IntegrantePage({ params }: Props) {
  const { nome } = await params;
  const integrante = integrantes.find((person) => person.id === nome);
  if (!integrante) notFound();
  return <IntegranteClient integrante={integrante} />;
}
