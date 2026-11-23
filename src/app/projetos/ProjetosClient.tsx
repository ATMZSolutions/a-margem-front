"use client";
import React, { useState, useEffect } from "react";
import { Typography, Skeleton } from "antd";
import AppDrawer from "@/components/AppDrawer";
import { YearStepper } from "@/components/YearStepper";
import BackBtn from "@/components/BackBtn";
import CarouselWithInfo from "@/components/CarouselWithInfo";
import { projectImgs } from "@/data/projetos";
import type { ProjectPageSettings, ProjectPhoto } from "@/lib/siteContent";
import { useSiteTexts } from "@/components/SiteTextProvider";

interface TimelineItem {
  data: string;
  descricao: string;
  id: number;
}

export default function ProjetosClient({ initialData, pagina, fotos, usarGaleriaAdministrada }: { initialData: TimelineItem[]; pagina: ProjectPageSettings; fotos: ProjectPhoto[]; usarGaleriaAdministrada: boolean }) {
  const textos = useSiteTexts();
  const currentYear = new Date().getFullYear();
  const newestProjectYear = initialData.reduce(
    (year, item) => Math.max(year, new Date(item.data).getFullYear()),
    0,
  ) || currentYear;
  const oldestProjectYear = initialData.reduce(
    (year, item) => Math.min(year, new Date(item.data).getFullYear()),
    newestProjectYear,
  );
  const [filteredItems, setFilteredItems] = useState<TimelineItem[]>(() =>
    initialData.filter((item) => new Date(item.data).getFullYear() === newestProjectYear),
  );
  const [selectedYear, setSelectedYear] = useState(newestProjectYear);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const lastProjectYear = newestProjectYear;
  const loading = false;
  const [data] = useState<TimelineItem[]>(initialData);

  const showDrawer = (item: TimelineItem) => setSelectedItem(item);
  const onCloseDrawer = () => setSelectedItem(null);

  const initialYear = newestProjectYear;
  const fotosAdministradas = fotos.map((foto) => ({
    descricao: foto.legenda,
    data: foto.dataEditorial ?? "",
    img: foto.url,
    textoAlternativo: foto.textoAlternativo,
  }));
  const imagesInfo = (usarGaleriaAdministrada ? fotosAdministradas : projectImgs)
    .slice()
    .sort((a, b) => (a.data ? new Date(a.data).getTime() : 0) - (b.data ? new Date(b.data).getTime() : 0));

  useEffect(() => {
    const filtered: TimelineItem[] = data
      .filter((value: TimelineItem) => {
        const year = new Date(value.data).getFullYear();
        return year == selectedYear;
      })
      .sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      );
    setFilteredItems(filtered);
  }, [selectedYear, data]);

  return (
    <section
      className="relative bg-site-primary min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: `url('${pagina.fundo.url ?? "/padrao2.webp"}')`,
      }}
    >
      <BackBtn label="Projetos" textKey="tituloProjetos" />
      <div className="mx-auto mt-40 w-full max-w-7xl lg:px-4">
        <section className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="lg:pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-site-accent lg:tracking-[0.24em]">
              Arte-educação · pesquisa · circulação
            </p>
            <Typography.Title
              level={1}
              className="sr-only lg:!mb-5 lg:not-sr-only font-sedgwick lg:!text-4xl lg:!leading-tight"
              style={{ color: "white", fontWeight: "normal" }}
            >
              Projetos
            </Typography.Title>
            <p className="max-w-3xl text-base leading-7 text-white/90 sm:text-lg sm:leading-8">
              {pagina.introducao}
            </p>
          </div>

          {imagesInfo.length > 0 && <div
            className="mx-auto mb-6 w-full max-w-[22rem] lg:col-start-2 lg:row-start-1 lg:mb-0 lg:justify-self-end lg:rounded-2xl lg:bg-black/20 lg:shadow-2xl"
            style={{ aspectRatio: "3 / 4", height: "min(calc((100vw - 3rem) * 4 / 3), 29.333rem)" }}
          >
            <CarouselWithInfo imagesInfo={imagesInfo} />
          </div>}
        </section>

        <div className="mt-10 flex flex-col gap-4 border-b border-white/15 pb-5 lg:mt-20 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <Typography.Title
            className="font-sedgwick !mt-0 !mb-0 !text-2xl md:!text-3xl border-l-4 border-site-accent pl-2 lg:!text-4xl"
            style={{
              color: "#ffffff",
              fontWeight: "normal",
            }}
          >
            {pagina.tituloTrajetoria}
          </Typography.Title>
          <YearStepper
            minYear={oldestProjectYear}
            maxYear={lastProjectYear}
            initialYear={initialYear}
            onYearChange={(year) => setSelectedYear(year)}
          />
        </div>

        {loading ? (
          <div className="mt-10 space-y-6 w-full">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : (
          <>
            {filteredItems.length > 0 ? (
              <div>
                <ol className="relative mt-6 space-y-5 border-l border-white/25 pl-5 lg:hidden">
                  {filteredItems.map((item) => {
                    const date = new Date(item.data);
                    return (
                      <li key={item.id} className="relative">
                        <span aria-hidden="true" className="absolute -left-[1.625rem] top-1 h-3 w-3 rounded-full border-2 border-site-accent bg-site-primary" />
                        <time dateTime={date.toISOString()} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-site-accent">
                          {new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date)}
                        </time>
                        <article className="rounded-xl border border-white/10 bg-black/35 p-4 shadow-lg">
                          <p className="line-clamp-5 text-sm leading-6 text-white/90">{item.descricao}</p>
                          {item.descricao.length > 200 && (
                            <button type="button" onClick={() => showDrawer(item)} className="mt-3 min-h-11 text-sm font-semibold text-site-accent underline underline-offset-4">
                              {textos?.mostrarMais ?? "Ler detalhes"}
                            </button>
                          )}
                        </article>
                      </li>
                    );
                  })}
                </ol>

                <div className="relative hidden lg:block max-w-5xl mx-auto py-8">
                  <div aria-hidden="true" className="absolute left-[10.5rem] top-10 bottom-10 border-l border-white/20" />
                  <ol className="space-y-5">
                    {filteredItems.map((item) => {
                      const date = new Date(item.data);
                      const dateLabel = new Intl.DateTimeFormat("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      }).format(date);
                      const showDetails = item.descricao.length > 240;

                      return (
                        <li key={item.id} className="relative grid grid-cols-[9rem_minmax(0,1fr)] items-start gap-12">
                          <time dateTime={date.toISOString()} className="pt-5 text-right text-sm font-semibold uppercase tracking-wide text-site-accent">
                            {dateLabel}
                          </time>
                          <article className="relative rounded-xl border border-white/10 bg-black/35 px-6 py-5 shadow-lg transition-colors hover:border-site-accent/50 hover:bg-black/45 before:absolute before:-left-[1.875rem] before:top-6 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-site-accent before:bg-site-primary">
                            <p className="line-clamp-4 text-[15px] leading-7 text-white/90">
                              {item.descricao}
                            </p>
                            {showDetails && (
                              <button
                                type="button"
                                onClick={() => showDrawer(item)}
                                className="mt-3 inline-flex items-center text-sm font-semibold text-site-accent underline decoration-site-accent/40 underline-offset-4 transition hover:text-white"
                              >
                                {textos?.mostrarMais ?? "Ler detalhes"}
                              </button>
                            )}
                          </article>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <AppDrawer
                  open={selectedItem !== null}
                  onClose={onCloseDrawer}
                  title={textos?.detalhes ?? "Detalhes"}
                  bgColor="var(--site-accent)"
                  contents={selectedItem ? [selectedItem.descricao] : []}
                />
              </div>
            ) : (
              <section className="h-auto flex-grow flex w-full">
                <span className="mx-auto">
                  {textos?.projetosAnoVazio ?? "Nenhum projeto encontrado para o ano selecionado."}
                </span>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
