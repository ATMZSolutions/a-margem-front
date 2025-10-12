"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { EnvironmentOutlined } from '@ant-design/icons';

interface AgendaItem {
  id: number;
  titulo: string;
  data: string;
  local?: string;
  cidade?: string;
  createdAt: string;
}

interface AgendaProps {
  eventos: AgendaItem[];
  loading: boolean;
}

const agendaVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Capitaliza a primeira letra
const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const AgendaHome = ({ eventos, loading }: AgendaProps) => {
  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-[#681A01] text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 font-sedgwick">PRÓXIMOS EVENTOS</h2>
          <p>Carregando eventos...</p>
        </div>
      </section>
    );
  }

  // Agrupa eventos por cidade normalizada
  const groupedEvents: { [key: string]: AgendaItem[] } = eventos.reduce(
    (acc, event) => {
      const cityKey = event.cidade?.trim().toLowerCase() || "outros";
      if (!acc[cityKey]) acc[cityKey] = [];
      acc[cityKey].push(event);
      return acc;
    },
    {} as { [key: string]: AgendaItem[] }
  );

  // Ordena cidades e pega apenas as 2 primeiras
  const sortedCities = Object.keys(groupedEvents).sort().slice(0, 2);

  return (
    <section className="relative min-h-screen max-w-screen flex flex-col justify-center items-center bg-[#681A01] text-white overflow-hidden">
      {/* Fundo fixo e otimizado */}
      <div className="">
        <Image
          src="/padrao2.webp"
          alt="Background"
          fill
          priority
          className="object-cover opacity-25"
        />
        <div className="inset-0 bg-[#681A01]/80" />
      </div>

      {/* Conteúdo */}
      <div className="w-4/5 flex flex-col justify-center md:flex-row gap-16 z-10">
        <motion.h2
          className="text-4xl md:text-5xl text-end font-sedgwick font-extrabold uppercase tracking-widest text-white/80 mb-8 md:mb-0"
          variants={agendaVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Próximos
          <br />
          Eventos
        </motion.h2>

        <div className="w-full md:w-[30%] lg:w-[40%]">
          {sortedCities.length === 0 ? (
            <p className="text-center text-white/80">
              Nenhum evento programado no momento.
            </p>
          ) : (
            sortedCities.map((city) => (
              <div key={city} className="space-y-4">
                <motion.h3
                  className="bg-[#F5A623] text-[#681A01] font-bold text-lg uppercase px-3 rounded inline-block"
                  variants={agendaVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <EnvironmentOutlined className="mr-2" />
                  {capitalize(city)}
                </motion.h3>

                {groupedEvents[city].map((event) => {
                  const eventDate = new Date(event.data);
                  return (
                    <motion.div
                      key={event.id}
                      className="flex flex-row items-center justify-center bg-white/10 rounded-lg px-1 py-2 mb-4"
                      variants={agendaVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                    >
                      {/* Data */}
                      <div className="flex-shrink-0 flex flex-col items-center text-center border-r border-dashed border-white/50 px-2 gap-1">
                        <div className="flex flex-row font-bold gap-[2px] leading-none">
                          <span className="uppercase text-white">
                            {format(eventDate, "dd")}
                          </span>
                          <span className="uppercase text-white">
                            {format(eventDate, "MMM", { locale: ptBR })}
                          </span>
                        </div>
                        <span className="text-[12px] text-white/80 leading-none">
                          {format(eventDate, "HH:mm")}
                        </span>
                      </div>

                      {/* Detalhes */}
                      <div className="flex-1 flex flex-col justify-center text-left leading-none ml-2 gap-1">
                        <p className="text-sm sm:text-base font-medium text-white leading-none">
                          {event.titulo}
                        </p>
                        {(event.local || event.cidade) && (
                          <p className="text-[12px] text-white/80 leading-none">
                            {event.local}{" "}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))
          )}

          {/* Botão 100% largura */}
          {sortedCities.length > 0 && (
            <div className="w-full mt-6">
              <a
                href="/agenda"
                className="block w-full text-center bg-white/80 text-[#681A01] py-2 rounded-lg font-semibold transition-colors text-base"
              >
                Agenda Completa
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AgendaHome;
