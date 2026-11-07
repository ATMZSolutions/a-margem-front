import React from "react"
import { premios } from "@/data/premios";
import type { Metadata } from "next";
import { slugify } from "@/utils/helpers";
import Premio from "@/components/Premio";
import BackBtn from "@/components/BackBtn";
import { notFound } from "next/navigation";
import Image from "next/image";
import Paragraph from "antd/es/typography/Paragraph";

interface PremioDetalhesProps {
    params: Promise<{ title: string, year: string; }>;
}

export async function generateMetadata({ params }: PremioDetalhesProps): Promise<Metadata> {
    const { title, year } = await params;
    const premio = premios.find((item) => slugify(item.title) === title && item.year === year);
    if (!premio) return { title: "Prêmio não encontrado" };
    const description = premio.description.slice(0, 155);
    return {
        title: `${premio.title} (${premio.year})`,
        description,
        alternates: { canonical: `/premios/${slugify(premio.title)}/${premio.year}` },
        openGraph: { title: `${premio.title} | Coletivo À Margem`, description, url: `https://www.amargem.com.br/premios/${slugify(premio.title)}/${premio.year}` },
    };
}

const PremioDetalhes = async ({ params }: PremioDetalhesProps) => {
    const { title, year } = await params;

    const premio = premios.find((p) => slugify(p.title) + `/${p.year}` == title + `/${year}`);

    if (!premio) return notFound();

    return (
        <section
            className="relative bg-[#A41904] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
            style={{
                backgroundImage: "url('/padrao2.webp')",
            }}
        >
            <BackBtn label="Prêmios" />

            <div className="flex max-w-xl text-white flex-col items-center mt-40 mx-2 justify-center gap-10 ">
                <Premio
                    key={`${title}` + `/${year}`}
                    title={premio.title}
                    evento={premio.evento}
                    year={premio.year}
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
