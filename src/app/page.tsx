"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import Main from "@/components/home/Main";
import Sobre from "@/components/home/Sobre";
import Agenda from "@/components/home/Agenda";
import Contato from "@/components/home/Contato";
import { ChevronDown, ChevronUp } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const sections = [
  { component: <Main />, animate: true },
  { component: <Agenda eventos={[]} loading={false} />, animate: true },
  { component: <Sobre />, animate: true },
  { component: <Contato />, animate: true },
];

interface AgendaItem {
  id: number;
  titulo: string;
  data: string;
  local?: string;
  createdAt: string;
}

export default function Home() {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  // fetch agenda
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/agenda");
        const data = await res.json();
        setAgenda(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar agenda:", error);
        setAgenda([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // scroll detection
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.scrollHeight;
      setAtBottom(scrollTop + windowHeight >= fullHeight - 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="font-sans relative">
      {sections.map(({ component, animate }, idx) =>
        animate ? (
          <motion.div
            key={idx}
            custom={idx}
            variants={fadeUp}
            initial={idx === 0 ? { opacity: 1, y: 0 } : "hidden"}
            whileInView={idx === 0 ? {} : "visible"}
            viewport={{ once: true, amount: 0.15 }}
          >
            {/* Passa a agenda carregada para o componente */}
            {component.type === Agenda ? (
              <Agenda eventos={agenda.slice(0, 5)} loading={loading} />
            ) : (
              component
            )}
          </motion.div>
        ) : (
          <div key={idx}>{component}</div>
        )
      )}

      {/* ↓ seta de scroll */}
      {!atBottom && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white z-50 animate-bounce"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
        >
          <ChevronDown size={28} />
        </motion.div>
      )}

      {/* ↑ botão voltar ao topo */}
      {atBottom && (
        <motion.button
          className="fixed bottom-28 right-8 bg-[#F5A623] text-[#5C1E0F] p-3 rounded-full z-50 shadow-lg hover:scale-110 transition-transform"
          onClick={scrollToTop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </div>
  );
}
