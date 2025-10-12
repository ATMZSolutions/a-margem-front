import React from 'react';
import { notFound } from 'next/navigation';
import Title from 'antd/es/typography/Title';
import Paragraph from 'antd/es/typography/Paragraph';
import BackBtn from '@/components/BackBtn';
import PhotoCarousel from '@/components/PhotoCarousel';
import { formatDescription, slugify } from '@/utils/helpers';

type EspetaculosDetalhesProps = {
    params: Promise<{ title: string }>;
};

const shows = [
    {
        title: 'Xirê',
        opening: '2023-06-01T12:00:00Z',
        local: 'Teatro Milton Baccarelli (CAC/UFPE)',
        bgColor: '#681A01',
        sections: [
            {
                subtitle: "Conceito e Dramaturgia",
                description: "XIRÊ nasce das escrevivências dos atores-MCs, refletindo sobre a realidade da juventude periférica por meio de poesias autorais e trechos da biografia da rapper pernambucana BIONE. O espetáculo transforma o palco em uma grande festa de encantamento, onde dores e alegrias se misturam na poética do teatro hip-hop. Traçando uma linha entre o sagrado afro-brasileiro e o urbano, a peça fala dos corpos periféricos, pretos e que existem à margem da sociedade."
            },
            {
                subtitle: "Ficha técnica (estreia)",
                description: `Elenco inicial: Eduarda Ferreira, Francisco Bento, Maria Guerra, Torres ZN, Cas Almeida, Alice Portela, Elaine Cristina
Dramaturgia: Colaborativa
Iluminação: Diniz Luz
Sonoplastia: Yuri Beyle e Ashley Gouveia
Produção: Iná Paz`
            },
            {
                subtitle: "Ficha técnica (atual)",
                description: `Elenco: Cas Almeida, Eduarda Ferreira, Elaine Cristina, Maria Guerra, Torres ZN
Iluminação e sonoplastia: Alice Portela, Francisco Bento
Sonoplastia ao vivo: Torres ZN (batuque no tantã)`
            },
            {
                subtitle: "Trajetória e Apresentações",
                description: `18/10/2023 – XXIV ENEARTE, Belo Horizonte, Sala Preta (EBA/UFMG)
24/08/2024 – Estação da Cultura de Arcoverde/PE (Festival Pernambuco Meu País)
2024 – Circulação XIRÊ (Lei Paulo Gustavo + SIC):
• Museu da Abolição
• MAMAM
• Compaz Eduardo Campos
• Daruê Malungo
• MUAFRO
26/11/2024 – Teatro Hermilo Borba Filho (Festival Recife do Teatro Nacional)
22/01/2025 – Teatro Marco Camarotti, Recife (Festival Janeiro de Grandes Espetáculos)
26 e 27/07/2025 – Mostra Nacional de Teatro Universitário (TUSP), Teatro da USP – São Paulo`
            }
        ]
    },
    {
        title: 'Muximba',
        opening: '2024-03-13T12:00:00Z',
        local: 'Teatro Milton Baccarelli (CAC/UFPE)',
        bgColor: '#412551',
        sections: [
            {
                subtitle: "Conceito e Dramaturgia",
                description: `Brechas da Muximba é o segundo trabalho do Coletivo À Margem e nasce do resultado da disciplina Laboratório de Encenação do curso de Teatro/Licenciatura da Universidade Federal de Pernambuco (UFPE). 
Tendo a palavra “acalanto” como disparador cênico, o espetáculo reflete sobre a ausência e a presença do afeto na realidade das pessoas pretas. 
A montagem combina elementos do teatro hip-hop, das brincadeiras populares e do sagrado afro-brasileiro, transportando o espectador para um quintal de memórias e ancestralidades. 
A poética da cena é construída por meio de recursos visuais e simbólicos, como fotografias de momentos marcantes do elenco espalhadas pelo espaço e o uso de óculos com búzios colados nas lentes. 
Esses elementos dialogam com a cantiga “A chicotada do calango dói”, composta pelo diretor e ator-MC Iná Paz especialmente para o espetáculo.`
            },
            {
                subtitle: "Ficha técnica",
                description: `Direção: Cas Almeida e Iná Paz
Elenco: Mah Carvalho, Letycia Ferraz, Felipe Araújo, Nelba Santos
Produção e colaboração: Coletivo À Margem`
            },
            {
                subtitle: "Trajetória e Apresentações",
                description: `13/03/2024 – Estreia no Teatro Milton Baccarelli (CAC/UFPE)
28/09/2024 – Ítàn do Jovem Preto (Ocupação Espaço O Poste, grupo O Poste: Soluções Luminosas)
Atualmente – Processo de experimentação e criação de novas possibilidades cênicas em sala de ensaio`
            }
        ]
    }
];

const randomImages = [
    "/muximba-coletivo.jpg",
    "/xire-coletivo.jpg",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
];

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


            <div className="max-w-xl lg:max-w-2xl w-full flex flex-col items-center mt-40 mx-2">
                <div className="w-full h-[220px] sm:h-[350px]">
                    <PhotoCarousel images={randomImages} />
                </div>
                <div className="w-full flex flex-col items-end mt-2">
                    <span className="text-white italic text-xs font-bold">
                        {new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        }).format(new Date(showData.opening))}
                    </span>
                    <span className="text-white italic text-xs font-bold">{showData.local}</span>
                </div>
                <section className="flex flex-col mt-12 w-full mx-2">
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
