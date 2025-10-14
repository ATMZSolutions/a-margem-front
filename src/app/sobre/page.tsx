"use client";
import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { ConfigProvider, Timeline, Typography } from "antd";
import AppDrawer from "../../components/AppDrawer";
import { motion, Variants } from "framer-motion";
import BackBtn from "@/components/BackBtn";
import { TimelineItem } from "@/data/sobre";
import { items } from "@/data/sobre";

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
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isTruncated, setIsTruncated] = useState<Record<number, boolean>>({});
  const labelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [paddingTops, setPaddingTops] = useState<Record<number, number>>({});
  const [windowWidth, setWindowWidth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    {/* Nao ta funcionando no momento*/ }

    // async function loadAboutUs() {
    //   try {
    //     const response = await fetch("/api/admin/sobre");
    //     console.log(response)
    //     const data = await response.json();
    //     console.log(data)
    //     setAboutUs(Array.isArray(data) ? data : []);
    //   } catch (error) {
    //     console.error("Erro ao carregar Sobre Nós:", error);
    //     setAboutUs([]);
    //   } finally {
    //     setLoading(false);
    //   }
    // }

    // loadAboutUs();

    setTimeout(() => {
      setLoading(false)
    }, 1000)

  }, []);

  useEffect(() => {
    setIsTruncated({});
  }, [windowWidth]);

  const showDrawer = (item: TimelineItem) => setSelectedItem(item);
  const onCloseDrawer = () => setSelectedItem(null);

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
  }, [items, windowWidth, loading]);

  const timelineItems = items.map((item, index) => ({
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
        <img
          src={item.img}
          alt={`Evento de ${item.ano}`}
          className="rounded-t-xl border-b-4 h-[200px] border-b-[#F5A623] w-auto object-cover"
        />
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
            {item.description}
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
        contents={selectedItem ? [selectedItem.description] : []}
      />
    </motion.section>
  );
}