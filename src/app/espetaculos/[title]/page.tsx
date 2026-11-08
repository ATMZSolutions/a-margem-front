import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Title from 'antd/es/typography/Title';
import Paragraph from 'antd/es/typography/Paragraph';
import BackBtn from '@/components/BackBtn';
import { formatDescription } from '@/utils/helpers';
import CarouselWithInfo from '@/components/CarouselWithInfo';
import { getPublishedEspetaculo } from '@/lib/publicContent';

type EspetaculosDetalhesProps = {
    params: Promise<{ title: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EspetaculosDetalhesProps): Promise<Metadata> {
    const { title } = await params;
    const show = await getPublishedEspetaculo(title);
    if (!show) return { title: 'Espetáculo não encontrado' };
    const description = show.sections[0]?.texto.slice(0, 155) || `Conheça ${show.title}, espetáculo do Coletivo À Margem.`;
    return {
        title: show.title,
        description,
        alternates: { canonical: `/espetaculos/${show.slug}` },
        openGraph: { title: `${show.title} | Coletivo À Margem`, description, url: `https://www.amargem.com.br/espetaculos/${show.slug}` },
    };
}


export default async function EspetaculosDetalhes({ params }: EspetaculosDetalhesProps) {
    const { title } = await params;

    const showData = await getPublishedEspetaculo(title);

    if (!showData) notFound();

    return (
        <section
            className={`relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center`}
            style={{
                backgroundImage: "url('/padrao1.webp')",
                backgroundColor: showData.bgColor ?? undefined,
            }}
        >
            <BackBtn label={showData.title} />


            <div className="max-w-xl lg:max-w-2xl flex flex-col items-center mt-40 mx-2">
                <div
                    className="w-full aspect-[4/3] sm:max-w-xl"
                    style={{ height: "clamp(200px, calc(38vw + 70px), 350px)" }}
                >
                    <CarouselWithInfo imagesInfo={showData.imgs}/>
                </div>
                <section className="flex flex-col mt-12 max-w-xl">
                    {showData.sections.map((section) => (
                        <React.Fragment key={section.id}>
                            <Title className='font-sedgwick border-l-4 border-[#F38901] pl-2' level={3} style={{ color: 'white', width: '70%', fontWeight: 'normal' }}>
                                {section.titulo}
                            </Title>
                            <Paragraph style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', color: 'white' }}>
                                {   // Adiciona bold apenas às descrições das seções de Ficha Técnica e Trajetória
                                    section.titulo.includes('Trajetória') || section.titulo.includes("Ficha")
                                        ? formatDescription(section.texto)
                                        : section.texto
                                }
                            </Paragraph>
                        </React.Fragment>
                    ))}
                </section>
            </div>
        </section>
    );
}
