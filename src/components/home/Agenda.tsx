"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar } from "lucide-react";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

interface AgendaItem {
  id: number;
  titulo: string;
  data: string;
  local?: string;
  createdAt: string;
}

interface AgendaProps {
  eventos: AgendaItem[];
  loading: boolean;
}

const agendaVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Agenda = ({ eventos, loading }: AgendaProps) => {
  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-[#681A01] text-white">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8">PRÓXIMOS EVENTOS</h2>
          <p>Carregando eventos...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#681A01] text-white px-4 overflow-hidden">
      {/* Imagem de fundo */}
      <Image
        src="/padrao2.webp"
        alt="Background Padrao2"
        fill // ocupa toda a div pai, equivalente a absolute + w-full + h-full
        className="object-cover z-0"
      />
      <div className="absolute inset-0 bg-[#681A01]/70 z-10 pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative z-20 w-full max-w-4xl flex flex-col items-center">
        <motion.h2
          className="text-4xl md:text-5xl font-sedgwick uppercase tracking-widest font-bold mb-12 text-center"
          variants={agendaVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Próximos Eventos
        </motion.h2>

        {eventos.length === 0 ? (
          <div className="text-center text-white/80">
            <p>Nenhum evento programado no momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {eventos.map((evento) => {
              const eventDate = new Date(evento.data);
              return (
                <motion.div
                  key={evento.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300"
                  variants={agendaVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <div className="flex items-center gap-2 mb-3 text-[#F5A623]">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">
                      {format(eventDate, "dd 'de' MMMM, yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                    {evento.titulo}
                  </h3>

                  {evento.local && (
                    <div className="flex items-center gap-2 text-white/80">
                      <MapPin size={14} />
                      <span className="text-sm">{evento.local}</span>
                    </div>
                  )}

                  <div className="mt-4 text-right">
                    <span className="text-xs text-[#F5A623] font-medium">
                      {format(eventDate, "HH:mm")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {eventos.length > 0 && (
          <div className="text-center mt-8">
            <a
              href="/agenda"
              className="inline-block bg-[#F5A623] text-[#681A01] px-6 py-3 rounded-lg font-semibold hover:bg-[#F5A623]/90 transition-colors"
            >
              Ver toda a agenda
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default Agenda;
