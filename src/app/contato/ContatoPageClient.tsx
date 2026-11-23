"use client";

import BackBtn from "@/components/BackBtn";
import { ArrowUpRight, Mail, Instagram } from "lucide-react";
import { TikTokOutlined, WhatsAppOutlined } from "@ant-design/icons";
import Image from "next/image";
import type { ContactChannel, ContactPageSettings } from "@/lib/siteContent";

function IconeContato({ tipo }: { tipo: string }) {
  if (tipo === "whatsapp") return <WhatsAppOutlined />;
  if (tipo === "email") return <Mail size={18} />;
  if (tipo === "instagram") return <Instagram size={18} />;
  if (tipo === "tiktok") return <TikTokOutlined />;
  return <span aria-hidden="true">↗</span>;
}

function nomeCanal(tipo: string) {
  if (tipo === "whatsapp") return "WhatsApp";
  if (tipo === "email") return "E-mail";
  if (tipo === "instagram") return "Instagram";
  if (tipo === "tiktok") return "TikTok";
  return "Contato";
}

export default function ContatoPageClient({ pagina, contatos }: { pagina: ContactPageSettings; contatos: ContactChannel[] }) {
  return (
    <section className="relative flex min-h-screen flex-col bg-cover bg-center px-4 pb-16 text-white" style={{ backgroundColor: "var(--site-primary)", backgroundImage: `url('${pagina.fundo.url ?? "/padrao2.webp"}')` }}>
      <div className="pointer-events-none absolute inset-0 bg-site-primary/80" />
      <BackBtn label={pagina.titulo} />
      <div className="relative z-10 mx-auto mt-40 w-full max-w-4xl lg:my-auto lg:py-16">
        <header className="mb-6 flex justify-center border-b border-white/20 pb-6 sm:mb-8">
          <h1 className="sr-only">{pagina.titulo}</h1>
          <div className="size-24 shrink-0 overflow-hidden rounded-full border-2 border-white/70 shadow-lg sm:size-28">
            <Image src={pagina.logo.url ?? "/amargem-logo-insta.webp"} alt={pagina.logo.alt || "Logo do Coletivo À Margem"} width={160} height={160} unoptimized className="size-full object-cover" />
          </div>
        </header>
        <nav aria-label="Canais de contato" className="grid w-full gap-3 sm:grid-cols-2 sm:gap-4">
          {contatos.map((contact) => (
            <a key={contact.id} href={contact.url} target={contact.url.startsWith("http") ? "_blank" : undefined} rel={contact.url.startsWith("http") ? "noopener noreferrer" : undefined} className="group flex min-h-24 min-w-0 items-center gap-4 rounded-xl border border-white/15 bg-black/30 p-4 text-white shadow-lg transition-colors hover:border-site-accent/60 hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent sm:p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-site-accent text-black"><IconeContato tipo={contact.tipo} /></span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-site-accent">{nomeCanal(contact.tipo)}</span>
                <span className={`block break-words text-sm font-medium leading-5 text-white ${contact.tipo === "email" ? "" : "sm:text-base"}`}>{contact.rotulo}</span>
              </span>
              <ArrowUpRight aria-hidden="true" size={18} className="shrink-0 text-white/60 transition-colors group-hover:text-site-accent" />
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
