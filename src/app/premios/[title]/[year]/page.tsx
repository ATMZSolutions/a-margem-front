import React from "react"
import { premios } from "@/data/premios";
import { slugify } from "@/utils/helpers";
import Premio from "@/components/Premio";
import BackBtn from "@/components/BackBtn";
import { notFound } from "next/navigation";
import Paragraph from "antd/es/typography/Paragraph";

interface PremioDetalhesProps {
    params: Promise<{ title: string, year: string; }>;
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
                <div
                    className="w-full h-64 md:h-72 bg-cover bg-center rounded"
                    style={{ backgroundImage: `url(${premio.img})` }}
                />
                <Paragraph style={{ whiteSpace: 'pre-wrap', color: 'white', textAlign: 'justify' }}>
                    {premio.description}
                </Paragraph>
            </div>

        </section>
    );
}

export default PremioDetalhes