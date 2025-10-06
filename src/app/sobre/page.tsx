"use client";
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { ConfigProvider, Timeline, Typography } from 'antd';
import AppDrawer from '../../components/AppDrawer';
import BackBtn from '@/components/BackBtn';

interface TimelineItem {
  year: string;
  text: string;
  img: string;
}

const items: TimelineItem[] = [
    {
        year: "2022",
        text: "O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop. O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop.",
        img: "https://picsum.photos/200?random=1"
    },
    {
        year: "2023",
        text: "O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop.",
        img: "https://picsum.photos/200?random=2"
    },
    {
        year: "2024",
        text: "O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop. O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop. O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop.",
        img: "https://picsum.photos/200?random=3"
    },
    {
        year: "2025",
        text: "O Coletivo À Margem é o primeiro grupo de teatro hip-hop de Pernambuco. Entre a arte e a educação, o grupo cria espetáculos e oficinas para diferentes públicos, traduzindo a palavra “margem” em potência criativa e pertencimento, reafirmando a função social do teatro hip-hop.",
        img: "https://picsum.photos/200?random=4"
    }
];

export default function SobrePage() {
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isTruncated, setIsTruncated] = useState<Record<number, boolean>>({});

  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [paddingTops, setPaddingTops] = useState<Record<number, number>>({});
  const [windowWidth, setWindowWidth] = useState(0);

  /* Calcula com base na nova width da tela se é necessário
     mostrar o botão de 'saiba mais' */
  useEffect(() => {
    setIsTruncated({});
  }, [windowWidth]);

  const showDrawer = (item: TimelineItem) => { setSelectedItem(item); };
  const onCloseDrawer = () => { setSelectedItem(null); };


  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efeito para medir a altura dos títulos e definir o padding
  // O padding é usado para manter a imagem e o card de texto no mesmo nível verticalmente
  useLayoutEffect(() => {
    const newPaddingTops: Record<number, number> = {};
    labelRefs.current.forEach((labelDiv, index) => {
      if (labelDiv) {
        const h2 = labelDiv.querySelector('h2');
        if (h2) newPaddingTops[index] = h2.offsetHeight;
      }
    });

    if (JSON.stringify(newPaddingTops) !== JSON.stringify(paddingTops)) {
      setPaddingTops(newPaddingTops);
    }
  }, [items, windowWidth]);

  const timelineItems = items.map((item, index) => ({
    key: index,
    color: "#f38901",
    label: (
      <div ref={el => { labelRefs.current[index] = el; }} className="flex flex-col min-h-[200px] text-white">
        <h2 className="text-lg md:text-xl pb-6">{item.year}</h2>
        <img src={item.img} alt={`Evento de ${item.year}`} className="rounded-t-xl border-b-4 h-[200px] border-b-[#F5A623] w-auto object-cover" />
      </div>
    ),
    children: (
      <div style={{ paddingTop: paddingTops[index] ? `${paddingTops[index]}px` : 0 }}>
        <div className="bg-[#f38901] flex flex-col text-left max-w-2xl h-[200px] text-roxo p-4 rounded-lg">
          <Typography.Paragraph
            key={`${index}-${windowWidth}`}
            className="flex-grow"
            ellipsis={{
              rows: 6,
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
            <button onClick={() => showDrawer(item)} className="text-white cursor-pointer w-full bg-[#681A01] rounded-full font-semibold mt-auto">
              Mostrar mais
            </button>
          )}
        </div>
      </div>
    ),
  }));

  return (
    <section
      className="relative bg-[#681A01] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/padrao1.webp')",
      }}
    >
      <BackBtn label="Sobre Nós" />
      <div className=' max-w-3xl mt-40 mx-2'>
        <ConfigProvider theme={{ components: { Timeline: { dotBg: '#f38901', tailColor: '#f38901', itemPaddingBottom: 40 } } }}>
          <Timeline mode="alternate" items={timelineItems} />
        </ConfigProvider>
      </div>
      <AppDrawer open={selectedItem !== null} onClose={onCloseDrawer} title={`Detalhes de ${selectedItem?.year || ''}`} contents={selectedItem ? [selectedItem.text] : []} />
    </section>
  );
}