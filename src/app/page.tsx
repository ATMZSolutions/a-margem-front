"use client";

import { motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";
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
    transition: {
      delay: i * 0.1,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1], // curva "easeOut"
    },
  }),
};

const sections = [
  { component: <Main />, animate: true },
  { component: <Agenda />, animate: true },
  { component: <Sobre />, animate: true },
  { component: <Contato />, animate: true },
];

export default function Home() {
  const [atBottom, setAtBottom] = useState(false);

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

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

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
            {component}
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
