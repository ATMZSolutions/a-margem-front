"use client";
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { ConfigProvider, Timeline, Typography } from "antd";
import AppDrawer from "../../components/AppDrawer";
import { motion, Variants } from "framer-motion";
import BackBtn from "@/components/BackBtn";
import Image from "next/image";

export interface Sobre {
  ano: number;
  descricao: string;
  imageUrl: string | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};


export default function SobrePage() {
  const [selectedItem, setSelectedItem] = useState<Sobre | null>(null);
  const [isTruncated, setIsTruncated] = useState<Record<number, boolean>>({});
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [paddingTops, setPaddingTops] = useState<Record<number, number>>({});
  const [windowWidth, setWindowWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const showDrawer = (item: Sobre) => setSelectedItem(item);
  const onCloseDrawer = () => setSelectedItem(null);
  const [data, setData] = useState<Sobre[]>([]);

  // Busca os dados da API
  useEffect(() => {
    fetch("/api/sobre")
      .then((res) => res.json())
      .then((json: Sobre[]) => {
        json.sort((a, b) => a.ano - b.ano) // Ordena do ano mais antigo pro mais recente
        setData(json)
      })
      .catch((err) => console.error("Erro ao carregar dados:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setIsTruncated({});
  }, [windowWidth]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useLayoutEffect(() => {
    if (loading) return;
    const newPaddingTops: Record<number, number> = {};
    labelRefs.current.forEach((labelDiv, index) => {
      if (labelDiv) {
        const h2 = labelDiv.querySelector("h2");
        if (h2) newPaddingTops[index] = h2.offsetHeight;
      }
    });
    if (JSON.stringify(newPaddingTops) !== JSON.stringify(paddingTops)) {
      setPaddingTops(newPaddingTops);
    }
  }, [data, windowWidth, loading]);

  const timelineItems = data.map((item, index) => ({
    key: index,
    color: "#f38901",
    label: (
      <motion.div
        ref={(el) => {
          labelRefs.current[index] = el;
        }}
        className="flex flex-col min-h-[200px] text-white"
        variants={itemVariants}
      >
        <h2 className="text-lg md:text-xl pb-6">{item.ano}</h2>
        {item.imageUrl && (
          <div className="relative h-[200px] w-full">
            <img
              src={item.imageUrl}
              alt={`Evento de ${item.ano} - Coletivo À Margem`}
              className="rounded-t-xl border-b-4 border-b-[#F5A623] object-cover transition-opacity duration-500 h-full w-full"
            />
          </div>
        )}
      </motion.div>
    ),
    children: (
      <motion.div
        style={{
          paddingTop: paddingTops[index] ? `${paddingTops[index]}px` : 0,
        }}
        variants={itemVariants}
      >
        <div className="bg-[#f38901] flex flex-col text-left max-w-2xl h-[200px] text-roxo p-4 rounded-lg">
          <Typography.Paragraph
            key={`${index}-${windowWidth}`}
            className="flex-grow"
            ellipsis={{
              rows: 6,
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
              className="text-white cursor-pointer w-full bg-[#681A01] rounded-full font-semibold mt-auto"
            >
              Mostrar mais
            </button>
          )}
        </div>
      </motion.div>
    ),
  }));

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex justify-center items-center"
        style={{ backgroundColor: '#681A01' }}
      >
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <motion.section
      className="relative bg-[#681A01] min-h-screen flex flex-col items-center text-white px-4 pb-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/padrao2.webp')",
      }}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <BackBtn label="Sobre Nós" />
      <div className=' max-w-3xl mt-48 mx-2'>
        <ConfigProvider theme={{ components: { Timeline: { dotBg: '#f38901', tailColor: '#f38901', itemPaddingBottom: 40 } } }}>
          <Timeline mode="alternate" items={timelineItems} />
        </ConfigProvider>
      </div>
      <AppDrawer
        open={selectedItem !== null}
        onClose={onCloseDrawer}
        title={`Detalhes de ${selectedItem?.ano || ""}`}
        contents={selectedItem ? [selectedItem.descricao] : []}
      />
    </motion.section>
  );
}