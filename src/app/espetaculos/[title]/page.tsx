import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BackBtn from '@/components/BackBtn';
import { formatDescription } from '@/utils/helpers';
import CarouselWithInfo, { type ImageInfo } from '@/components/CarouselWithInfo';
import { getPublishedEspetaculo } from '@/lib/publicContent';
import { getEntityMetadata, isPublicSitePage } from '@/lib/siteMetadata';

type EspetaculosDetalhesProps = {
    params: Promise<{ title: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EspetaculosDetalhesProps): Promise<Metadata> {
    const { title } = await params;
    if (!await isPublicSitePage(`/espetaculos/${title}`)) return { title: 'Espetáculo não encontrado' };
    const show = await getPublishedEspetaculo(title);
    if (!show) return { title: 'Espetáculo não encontrado' };
    const description = show.sections[0]?.texto.slice(0, 155) || `Conheça ${show.title}, espetáculo do Coletivo À Margem.`;
    return getEntityMetadata(`/espetaculos/${show.slug}`, show.title, description, show.seo);
}


export default async function EspetaculosDetalhes({ params }: EspetaculosDetalhesProps) {
    const { title } = await params;
    if (!await isPublicSitePage(`/espetaculos/${title}`)) notFound();

    const showData = await getPublishedEspetaculo(title);

    if (!showData) notFound();

    // O admin salva a capa separada da galeria; incluí-la no carrossel do detalhe.
    const ehEbo = showData.title.trim().toLocaleLowerCase("pt-BR") === "ebó pra consciência";
    const ehBrechas = showData.title.trim().toLocaleLowerCase("pt-BR") === "brechas da muximba";
    const capa = ehEbo ? "/espetaculos/ebo-pra-consciencia.webp" : showData.img;
    const imagensGaleria = showData.imgs.filter((imagem) => !ehEbo || imagem.img !== showData.img);
    const capaDisponivel = Boolean(capa && capa !== "/padrao2.webp");
    const capaJaNaGaleria = imagensGaleria.some((imagem) => imagem.img === capa);
    const imagensDetalhe: ImageInfo[] = capaDisponivel && !capaJaNaGaleria
        ? [{ descricao: "", data: "", img: capa, textoAlternativo: `Capa do espetáculo ${showData.title}` }, ...imagensGaleria]
        : imagensGaleria;
    if (ehBrechas) {
        imagensDetalhe.unshift({
            descricao: "Cartaz das apresentações de novembro — CEPOMA, Casa da Cultura e Compaz Dom Helder Câmara",
            data: "",
            img: "/espetaculos/muximba/cartaz-novembro.jpg",
            textoAlternativo: "Cartaz de Brechas da Muximba com três apresentações em novembro",
            ajusteImagem: "conter",
        });
    }
    const [apresentacao, ...demaisSecoes] = showData.sections;
    const renderizarSecao = (secao: typeof showData.sections[number]) => (
        <section key={secao.id} className="min-w-0">
            <h2 className="mb-4 border-l-4 border-site-accent pl-3 font-sedgwick text-2xl font-normal leading-tight text-white sm:text-3xl">
                {secao.titulo}
            </h2>
            <p className="whitespace-pre-wrap text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
                {secao.titulo.includes('Trajetória') || secao.titulo.includes('Ficha')
                    ? formatDescription(secao.texto)
                    : secao.texto}
            </p>
        </section>
    );

    return (
        <section
            className={`relative min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center`}
            style={{
                backgroundImage: "var(--site-background-image)",
                backgroundColor: showData.bgColor ?? "var(--site-primary)",
            }}
        >
            <BackBtn label={showData.title} />


            <div className="mx-auto mt-40 w-full max-w-7xl lg:px-4">
                <h1 className="sr-only">{showData.title}</h1>
                <div className="grid items-start gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-8">
                    <div className="w-full max-w-[22rem]" style={{ aspectRatio: "3 / 4" }}>
                        <CarouselWithInfo imagesInfo={imagensDetalhe} frameClassName="rounded-xl border border-white/10 bg-black/40" />
                    </div>
                    {apresentacao && <div className="min-w-0 lg:pt-2">{renderizarSecao(apresentacao)}</div>}
                </div>
                {demaisSecoes.length > 0 && (
                    <div className="mt-12 grid gap-10 border-t border-white/15 pt-10 md:grid-cols-2 lg:mt-14 lg:gap-14">
                        {demaisSecoes.map(renderizarSecao)}
                    </div>
                )}
            </div>
        </section>
    );
}
