import React from 'react';
import { notFound } from 'next/navigation';
import Title from 'antd/es/typography/Title';
import Paragraph from 'antd/es/typography/Paragraph';
import BackBtn from '@/components/BackBtn';
import { formatDescription, slugify } from '@/utils/helpers';
import CarouselWithInfo from '@/components/CarouselWithInfo';
import { shows } from '@/data/espetaculos';

type EspetaculosDetalhesProps = {
    params: Promise<{ title: string }>;
};


export default async function EspetaculosDetalhes({ params }: EspetaculosDetalhesProps) {
    const { title } = await params;

    // Encontra o espetáculo correto no array
    const showData = shows.find((show) => slugify(show.title) == title);

    if (!showData) notFound();

    return (
        <section
            className={`relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center`}
            style={{
                backgroundImage: "url('/padrao1.webp')",
                backgroundColor: showData.bgColor,
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
                        <React.Fragment key={section.subtitle}>
                            <Title className='font-sedgwick border-l-4 border-[#F38901] pl-2' level={3} style={{ color: 'white', width: '70%', fontWeight: 'normal' }}>
                                {section.subtitle}
                            </Title>
                            <Paragraph style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', color: 'white' }}>
                                {   // Adiciona bold apenas às descrições das seções de Ficha Técnica e Trajetória
                                    section.subtitle.includes('Trajetória') || section.subtitle.includes("Ficha")
                                        ? formatDescription(section.description)
                                        : section.description
                                }
                            </Paragraph>
                        </React.Fragment>
                    ))}
                </section>
            </div>
        </section>
    );
}
