"use client";
import React, { useState, useEffect } from 'react';
import { ConfigProvider, Timeline, Typography } from 'antd';
import AppDrawer from '@/components/AppDrawer';
import { YearStepper } from '@/components/YearStepper';
import BackBtn from '@/components/BackBtn';
import PhotoCarousel from '@/components/PhotoCarousel';
import { fullItems, projetosImgs } from '@/data/projetos';

interface TimelineItem {
  date: string;
  text: string;
}

export default function ProjetosPage() {

  const [filteredItems, setFilteredItems] = useState<TimelineItem[]>([])

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isTruncated, setIsTruncated] = useState<Record<number, boolean>>({});
  const [windowWidth, setWindowWidth] = useState(0);

  // Calcula o ano mais recente que possui um projeto associado
  const years = fullItems.map(item => new Date(item.date).getFullYear());
  const lastProjectYear = Math.max(...years);

  const showDrawer = (item: TimelineItem) => setSelectedItem(item);
  const onCloseDrawer = () => setSelectedItem(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsTruncated({});
  }, [windowWidth]);

  useEffect(() => {
    const filtered: TimelineItem[] = fullItems.filter((value) => {
      const year = new Date(value.date).getFullYear()
      return year == selectedYear;
    })
      .sort((a, b) => new Date(a.date).getMonth() - new Date(b.date).getMonth()); // Ordena por mês
    setFilteredItems(filtered)
  }, [selectedYear])

  const timelineItems = filteredItems.map((item, index) => ({
    key: index,
    color: '#FECA55',
    label: <span className="text-white">
      {new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(item.date))}
    </span>,
    children: (
      <div className="bg-[#00000080] max-w-[400px] max-h-[400px] text-white p-2 flex flex-col items-center justify-center rounded">
        <Typography.Paragraph
          key={`${index}-${windowWidth}`}
          style={{ color: '#ffffff', textAlign: 'left' }}
          className="text-white"
          ellipsis={{
            rows: 5,
            onEllipsis: (ellipsis) => {
              if ((isTruncated[index] || false) !== ellipsis) {
                setIsTruncated(prev => ({ ...prev, [index]: ellipsis }));
              }
            }
          }}
        >
          {item.text}
        </Typography.Paragraph>
        {isTruncated[index] && (
          <button
            onClick={() => showDrawer(item)}
            className="text-[#00000095] cursor-pointer w-full bg-[#FECA55] rounded-full font-semibold mt-auto"
          >
            Mostrar mais
          </button>
        )}
      </div>
    ),
  }));

  return (
    <section
      className="relative bg-[#2F4158] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/padrao2.webp')",
      }}
    >
      <BackBtn label="Projetos" />
      <div className=' max-w-2xl mt-40 mx-2'>
        <section className='flex flex-col gap-8 max-w-xl'>
          <Typography.Paragraph style={{ color: 'white', textAlign: 'justify' }}>
            O Coletivo À Margem também desenvolve ações educacionais. Seus integrantes, professores de teatro, têm como foco a difusão da metodologia do teatro hip-hop em diferentes contextos, como escolas, ONGs e projetos culturais.
          </Typography.Paragraph>
          <div
            className="w-full aspect-[4/3] sm:max-w-xl"
            style={{ height: "clamp(200px, calc(38vw + 70px), 350px)" }}
          >
            <PhotoCarousel images={projetosImgs} />
          </div>
          <Typography.Title className='font-sedgwick !text-2xl md:!text-3xl border-l-4 border-[#F38901] pl-2' 
            style={{
              marginTop: '20px',
              color: '#ffffff',
              fontWeight: 'normal'
            }}>
            Conheça a trajetória
          </Typography.Title>
        </section>
        <YearStepper
          maxYear={lastProjectYear}
          onYearChange={(year) => setSelectedYear(year)}
        />
        {filteredItems.length > 0 ? (
          <div className='flex flex-col mx-2'>
            <ConfigProvider
              theme={{
                components: {
                  Timeline: {
                    dotBg: '#FECA55',
                    tailColor: '#FECA55',
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
              title="Detalhes"
              bgColor='#FECA55'
              contents={selectedItem ? [selectedItem.text] : []}
            />
          </div>
        ) : (
          <section className='h-auto flex-grow flex w-full'>
            <span className='mx-auto'>Nenhum projeto encontrado para o ano selecionado.</span>
          </section>
        )}
      </div>
    </section>
  );
}