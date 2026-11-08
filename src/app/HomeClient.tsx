"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import Main from "@/components/home/Main";
import Sobre from "@/components/home/Sobre";
import Contato from "@/components/home/Contato";
import AgendaHome from "@/components/home/Agenda";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ContactChannel, HomeSectionKey, HomeSettings } from "@/lib/siteContent";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function HomeClient({ settings, contacts }: { settings: HomeSettings; contacts: ContactChannel[] }) {
  const [atBottom, setAtBottom] = useState(false);
  const sections: Record<HomeSectionKey, ReactNode> = {
    main: <Main settings={settings} />,
    agenda: <AgendaHome settings={settings.agenda} />,
    sobre: <Sobre settings={settings.sobre} />,
    contato: <Contato contacts={contacts} titulo={settings.tituloContato} fundo={settings.fundoContato} />,
  };
  const visibleSections = [...settings.secoes]
    .filter((section) => section.ativa)
    .sort((a, b) => a.ordem - b.ordem)
    .map((section) => section.chave);

  useEffect(() => {
    let frame = 0;
    let previousValue = false;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const nextValue = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 10;
        if (nextValue !== previousValue) {
          previousValue = nextValue;
          setAtBottom(nextValue);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="font-sans relative">
      {visibleSections.map((key, index) => (
        <motion.div
          key={key}
          custom={index}
          variants={fadeUp}
          initial={index === 0 ? { opacity: 1, y: 0 } : "hidden"}
          whileInView={index === 0 ? {} : "visible"}
          viewport={{ once: true, amount: 0.15 }}
        >
          {sections[key]}
        </motion.div>
      ))}

      {!atBottom && <motion.div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-bounce text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}><ChevronDown size={28} /></motion.div>}
      {atBottom && <motion.button className="fixed bottom-28 right-8 z-50 rounded-full bg-site-accent p-3 text-site-primary shadow-lg transition-transform hover:scale-110" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} aria-label="Voltar ao topo"><ChevronUp size={24} /></motion.button>}
    </div>
  );
}
