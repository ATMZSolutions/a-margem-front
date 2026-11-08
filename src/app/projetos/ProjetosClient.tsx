"use client";
import React, { useState, useEffect } from "react";
import { ConfigProvider, Timeline, Typography, Skeleton } from "antd";
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
  const [isTruncated, setIsTruncated] = useState<Record<number, boolean>>({});
  const [windowWidth, setWindowWidth] = useState(0);
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
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsTruncated({});
  }, [windowWidth]);

  useEffect(() => {
    const filtered: TimelineItem[] = data
      .filter((value: TimelineItem) => {
        const year = new Date(value.data).getFullYear();
        return year == selectedYear;
      })
      .sort(
        (a, b) =>
          new Date(a.data).getMonth() - new Date(b.data).getMonth()
      );
    setFilteredItems(filtered);
  }, [selectedYear, data]);

  const timelineItems = filteredItems.map((item, index) => ({
    key: index,
    color: "var(--site-accent)",
    label: (
      <span className="text-white">
        {new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(item.data))}
      </span>
    ),
    children: (
      <div className="bg-[#00000080] max-w-[400px] max-h-[400px] text-white p-2 flex flex-col items-center justify-center rounded">
        <Typography.Paragraph
          key={`${index}-${windowWidth}`}
          style={{ color: "#ffffff", textAlign: "left" }}
          className="text-white"
          ellipsis={{
            rows: 5,
            onEllipsis: (ellipsis) => {
              if ((isTruncated[index] || false) !== ellipsis) {
                setIsTruncated((prev) => ({ ...prev, [index]: ellipsis }));
              }
            },
          }}
        >
          {item.descricao}
        </Typography.Paragraph>
        {isTruncated[index] && (
          <button
            onClick={() => showDrawer(item)}
            className="text-[#00000095] cursor-pointer w-full bg-site-accent rounded-full font-semibold mt-auto"
          >
            {textos?.mostrarMais ?? "Mostrar mais"}
          </button>
        )}
      </div>
    ),
  }));

  return (
    <section
      className="relative bg-site-primary min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: `url('${pagina.fundo.url ?? "/padrao2.webp"}')`,
      }}
    >
      <BackBtn label="Projetos" textKey="tituloProjetos" />
      <div className="max-w-2xl mt-40 mx-2">
        <section className="flex flex-col gap-8 max-w-xl">
          <Typography.Paragraph
            style={{ color: "white", textAlign: "justify" }}
          >
            {pagina.introducao}
          </Typography.Paragraph>

          {imagesInfo.length > 0 && <div
            className="w-full aspect-[4/3] sm:max-w-xl mb-16"
            style={{ height: "clamp(200px, calc(38vw + 70px), 350px)" }}
          >
            <CarouselWithInfo imagesInfo={imagesInfo} />
          </div>}

          <Typography.Title
            className="font-sedgwick !text-2xl md:!text-3xl border-l-4 border-site-accent pl-2"
            style={{
              marginTop: "20px",
              color: "#ffffff",
              fontWeight: "normal",
            }}
          >
            {pagina.tituloTrajetoria}
          </Typography.Title>
        </section>

        {loading ? (
          <div className="mt-10 space-y-6 w-full">
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : (
          <>
            <YearStepper
              minYear={oldestProjectYear}
              maxYear={lastProjectYear}
              initialYear={initialYear}
              onYearChange={(year) => setSelectedYear(year)}
            />

            {filteredItems.length > 0 ? (
              <div className="flex flex-col mx-2">
                <ConfigProvider
                  theme={{
                    components: {
                      Timeline: {
                        dotBg: "var(--site-accent)",
                        tailColor: "var(--site-accent)",
                        itemPaddingBottom: 40,
                      },
                    },
                  }}
                >
                  <Timeline mode="alternate" items={timelineItems} />
                </ConfigProvider>

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
