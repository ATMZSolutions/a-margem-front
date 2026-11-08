import React from "react"
import type { Metadata } from "next";
import { getPublishedPremio } from "@/lib/publicContent";
import Premio from "@/components/Premio";
import BackBtn from "@/components/BackBtn";
import { notFound } from "next/navigation";
import Image from "next/image";
import Paragraph from "antd/es/typography/Paragraph";
import { getEntityMetadata, isPublicSitePage } from "@/lib/siteMetadata";

interface PremioDetalhesProps {
    params: Promise<{ title: string, year: string; }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PremioDetalhesProps): Promise<Metadata> {
    const { title, year } = await params;
    if (!await isPublicSitePage(`/premios/${title}/${year}`)) return { title: "Prêmio não encontrado" };
    const premio = await getPublishedPremio(title, year);
    if (!premio) return { title: "Prêmio não encontrado" };
    const description = premio.description.slice(0, 155);
    return getEntityMetadata(`/premios/${premio.slug}/${premio.year}`, `${premio.title} (${premio.year})`, description, premio.seo);
}

const PremioDetalhes = async ({ params }: PremioDetalhesProps) => {
    const { title, year } = await params;
    if (!await isPublicSitePage(`/premios/${title}/${year}`)) notFound();

    const premio = await getPublishedPremio(title, year);

    if (!premio) return notFound();

    return (
        <section
            className="relative bg-site-primary min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
            style={{
                backgroundImage: "var(--site-background-image)",
            }}
        >
            <BackBtn label="Prêmios" textKey="tituloPremios" />

            <div className="flex max-w-xl text-white flex-col items-center mt-40 mx-2 justify-center gap-10 ">
                <Premio
                    key={`${title}` + `/${year}`}
                    title={premio.title}
                    evento={premio.evento}
                    year={premio.year}
                    slug={premio.slug}
                    isSaibaMais={true}
                />
                {premio.img && (
                    <div className="relative w-full h-64 md:h-72 rounded overflow-hidden">
                        <Image src={premio.img} alt={`Registro do prêmio ${premio.title}`} fill sizes="(max-width: 768px) 100vw, 640px" className="object-cover" />
                    </div>
                )}
                <Paragraph style={{ whiteSpace: 'pre-wrap', color: 'white', textAlign: 'justify' }}>
                    {premio.description}
                </Paragraph>
            </div>

        </section>
    );
}

export default PremioDetalhes
