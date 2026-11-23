import type { Metadata } from "next";
import { getPublishedPremio } from "@/lib/publicContent";
import BackBtn from "@/components/BackBtn";
import { notFound } from "next/navigation";
import Image from "next/image";
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
            className="relative flex min-h-screen flex-col bg-site-primary bg-cover bg-center px-4 pb-10 text-white"
            style={{
                backgroundImage: "var(--site-background-image)",
            }}
        >
            <BackBtn label="Prêmios" textKey="tituloPremios" />

            <div className="mx-auto mt-36 w-full max-w-7xl sm:mt-40 lg:px-4">
                <header className="mb-6 border-b border-white/15 pb-5 md:mb-8 md:pb-7">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-site-accent">
                        Reconhecimento · {premio.year}
                    </p>
                    <h1 className="max-w-4xl font-zen-dots text-2xl font-bold leading-tight text-white sm:text-3xl">
                        {premio.title}
                    </h1>
                    {premio.evento && (
                        <p className="mt-3 text-sm font-medium tracking-wide text-white/75 sm:text-base">
                            {premio.evento}
                        </p>
                    )}
                </header>

                <div className="grid items-center gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-8 lg:gap-10">
                    {premio.img && (
                        <figure className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-xl sm:h-52 md:h-56">
                            <Image
                                src={premio.img}
                                alt={`Registro de ${premio.title}`}
                                fill
                                sizes="(max-width: 768px) calc(100vw - 2rem), 352px"
                                className="object-cover"
                                priority
                            />
                        </figure>
                    )}
                    <div className="max-w-3xl border-l-2 border-site-accent pl-4 sm:pl-6">
                        <p className="whitespace-pre-line text-justify text-base leading-7 text-white/90 [hyphens:auto]">
                            {premio.description}
                        </p>
                    </div>
                </div>
            </div>

        </section>
    );
}

export default PremioDetalhes
