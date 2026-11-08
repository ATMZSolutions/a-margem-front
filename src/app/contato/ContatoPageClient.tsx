"use client";

import BackBtn from "@/components/BackBtn";
import { Mail, Instagram } from "lucide-react";
import { TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import type { ContactChannel, ContactPageSettings } from "@/lib/siteContent";

const contactVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function IconeContato({ tipo }: { tipo: string }) {
  if (tipo === "whatsapp") return <WhatsAppOutlined />;
  if (tipo === "email") return <Mail size={18} />;
  if (tipo === "instagram") return <Instagram size={18} />;
  if (tipo === "tiktok") return <TikTokOutlined />;
  return <span aria-hidden="true">↗</span>;
}

export default function ContatoPageClient({ pagina, contatos }: { pagina: ContactPageSettings; contatos: ContactChannel[] }) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-cover bg-center px-4 text-white" style={{ backgroundColor: "var(--site-primary)", backgroundImage: `url('${pagina.fundo.url ?? "/padrao2.webp"}')` }}>
      <div className="pointer-events-none absolute inset-0 bg-site-primary/80" />
      <BackBtn label={pagina.titulo} />
      <div className="relative z-10 mt-16 flex w-full max-w-md flex-col items-center text-center sm:mt-20">
        <h1 className="mb-8 text-3xl font-bold uppercase tracking-widest sm:text-4xl">{pagina.titulo}</h1>
        <div className="mb-8 size-36 overflow-hidden rounded-full border-4 border-white shadow-lg sm:size-40">
          <Image src={pagina.logo.url ?? "/amargem-logo-insta.webp"} alt={pagina.logo.alt || "Logo do Coletivo À Margem"} width={160} height={160} unoptimized className="size-full object-cover" />
        </div>
        <div className="flex w-full flex-col items-center space-y-3 font-medium text-white">
          {contatos.map((contact, index) => (
            <motion.a key={contact.id} href={contact.url} target={contact.url.startsWith("http") ? "_blank" : undefined} rel={contact.url.startsWith("http") ? "noopener noreferrer" : undefined} className="flex items-center gap-3 hover:underline" variants={contactVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: index * 0.2 }}>
              <span className="flex size-8 items-center justify-center rounded-full bg-white text-site-primary"><IconeContato tipo={contact.tipo} /></span>
              <span>{contact.rotulo}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
