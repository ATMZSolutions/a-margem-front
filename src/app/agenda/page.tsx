"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import BackBtn from "@/components/BackBtn";

interface EventItem {
  date?: Date;
  time?: string;
  title: string;
  address?: string;
  city: string;
}

interface AgendaPageProps {
  bgColor?: string; // cor de fundo base
  bgImage?: string; // caminho da imagem de fundo
}

export default function AgendaPage({
  bgColor = "#5C1E0F",
  bgImage = "/images/padrao1.webp",
}: AgendaPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1)); // Outubro 2025

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  // Eventos reais
  const events: EventItem[] = [
    {
      date: new Date(2025, 9, 19),
      time: "19:00",
      title: "Sarau A Margem",
      address: "Rua do Bom Jesus, 123, Recife Antigo",
      city: "Recife | PE",
    },
    {
      date: new Date(2025, 9, 20),
      time: "16:00",
      title: "Oficina de Poesia",
      address: "Praça do Carmo, s/n, Carmo",
      city: "Olinda | PE",
    },
    {
      date: new Date(2025, 9, 25),
      time: "18:30",
      title: "Lançamento de Livro",
      address: "Livraria Cultura, Shopping RioMar",
      city: "Recife | PE",
    },
    {
      date: new Date(2025, 9, 28),
      time: "20:00",
      title: "Encontro de Escritores",
      address: "Casa da Cultura, Rua Floriano Peixoto, 200",
      city: "Recife | PE",
    },
    {
      date: new Date(2025, 9, 30),
      time: "15:00",
      title: "Roda de Conversa: Literatura Marginal",
      address: "Biblioteca Pública de Olinda",
      city: "Olinda | PE",
    },
  ];

  // Agrupamento por cidade
  const eventsByCity = events.reduce<Record<string, EventItem[]>>((acc, event) => {
    if (!acc[event.city]) acc[event.city] = [];
    acc[event.city].push(event);
    return acc;
  }, {});

  return (
    <div
      className="min-h-screen w-full flex justify-center py-24 relative"
      style={{ backgroundColor: bgColor }}
    >
        {bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-5 pointer-events-none"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        )}

        {/* Conteúdo central */}
      <div className="relative w-full max-w-md text-white font-sans mx-4 z-10">
        <BackBtn label="Agenda" />

        {/* Calendário */}
        <div className="bg-[#F38901] rounded-lg p-4 shadow-lg mb-6">
          {/* Cabeçalho do calendário */}
          <div className="flex justify-between items-center mb-3">
            <button type="button" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="text-[#5C1E0F]" />
            </button>
            <span className="uppercase font-bold text-lg text-[#5C1E0F]">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button type="button" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="text-[#5C1E0F]" />
            </button>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold bg-[#5C1E0F] px-4 text-white py-1 rounded">
            {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grade de dias */}
          <div className="grid grid-cols-7 gap-2 text-center mt-2 relative border-2 border-[#5C1E0F] p-4">
            {(() => {
              const firstDayOfWeek = start.getDay();
              const blanksBefore = Array(firstDayOfWeek).fill(null);
              const allDays = [...blanksBefore, ...days];
              const totalCells = Math.ceil(allDays.length / 7) * 7;
              const blanksAfter = Array(totalCells - allDays.length).fill(null);
              const calendarCells = [...allDays, ...blanksAfter];

              return calendarCells.map((day, idx) => {
                if (!day) return <div key={`blank-${idx}`} className="h-7 w-7" />;

                const dayNum = day.getDate();
                const hasEvent = events.some(
                  (ev) => ev.date && format(ev.date, "dd/MM/yyyy") === format(day, "dd/MM/yyyy")
                );

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative flex items-center justify-center h-7 w-7 rounded-full
                      ${isToday(day) ? "bg-[#5C1E0F] text-white font-bold" : "text-[#5C1E0F]"}
                      ${!isSameMonth(day, currentDate) ? "opacity-30" : ""}
                      ${hasEvent ? "border-2 border-[#5C1E0F]" : ""}
                    `}
                  >
                    <span>{dayNum}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Lista de eventos agrupados por cidade */}
        <div className="space-y-8">
          {Object.entries(eventsByCity).map(([city, cityEvents]) => (
            <div key={city}>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-[#F38901] text-[#5C1E0F] font-bold px-3 py-1 rounded">
                  {city}
                </span>
              </div>
              <div className="space-y-4">
                {cityEvents.map((event: EventItem, i: number) => (
                  <div key={i} className="w-full border-b-3 border-white/20 pb-2 flex justify-start">
                    <div className="flex items-center gap-3">
                      {event.date && (
                        <div className="text-[#F38901] font-bold text-lg flex flex-col items-end leading-tight gap-0">
                          {format(event.date, "dd MMM", { locale: ptBR }).toUpperCase()}
                          {event.time && (
                          <div className="font-light text-[12px] text-white/80 mt-[-2px]">{event.time}</div>
                          )}
                        </div>
                      )}
                      <div className="border-l-3 border-white/20 pl-3">
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.address && (
                          <p className="text-xs flex items-center gap-1 opacity-80">
                            <MapPin size={12} /> {event.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
