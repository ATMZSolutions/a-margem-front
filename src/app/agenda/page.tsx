"use client";

import { useState, useEffect } from "react";
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
  id: number;
  titulo: string;
  data: string; // ISO date string from API
  local?: string;
  createdAt: string;
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
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  // Fetch events from API
  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/agenda");
        const data = await response.json();
        // garante que events sempre seja um array
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  // Agrupamento por local (substituindo cidade)
  const eventsByLocation = Array.isArray(events)
    ? events.reduce<Record<string, EventItem[]>>((acc, event) => {
        const location = event.local || "Local não informado";
        if (!acc[location]) acc[location] = [];
        acc[location].push(event);
        return acc;
      }, {})
    : {};

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex justify-center items-center"
        style={{ backgroundColor: bgColor }}
      >
        <div className="text-white">Carregando eventos...</div>
      </div>
    );
  }

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
      <BackBtn label="Agenda" />

      {/* Conteúdo central */}
      <div className="relative w-full max-w-md text-white font-sans mx-4 z-10 mt-16">
        {/* Calendário */}
        <div className="bg-[#F38901] rounded-lg p-4 shadow-lg mb-6">
          {/* Cabeçalho do calendário */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="text-[#5C1E0F]" />
            </button>
            <span className="uppercase font-bold text-lg text-[#5C1E0F]">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
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
                const hasEvent =
                  Array.isArray(events) &&
                  events.some((ev) => {
                    const eventDate = new Date(ev.data);
                    return (
                      format(eventDate, "dd/MM/yyyy") ===
                      format(day, "dd/MM/yyyy")
                    );
                  });

                return (
                  <div
                    key={day.toISOString()}
                    className={`relative flex items-center justify-center h-7 w-7 rounded-full
                      ${
                        isToday(day)
                          ? "bg-[#5C1E0F] text-white font-bold"
                          : "text-[#5C1E0F]"
                      }
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

        {/* Lista de eventos agrupados por local */}
        <div className="space-y-8">
          {Object.entries(eventsByLocation).length > 0 ? (
            Object.entries(eventsByLocation).map(([location, locationEvents]) => (
              <div key={location}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-[#F38901] text-[#5C1E0F] font-bold px-3 py-1 rounded">
                    {location}
                  </span>
                </div>
                <div className="space-y-4">
                  {locationEvents.map((event) => {
                    const eventDate = new Date(event.data);
                    return (
                      <div
                        key={event.id}
                        className="w-full border-b-3 border-white/20 pb-2 flex justify-start"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-[#F38901] font-bold text-lg flex flex-col items-end leading-tight gap-0">
                            {format(eventDate, "dd MMM", {
                              locale: ptBR,
                            }).toUpperCase()}
                            <div className="font-light text-[12px] text-white/80 mt-[-2px]">
                              {format(eventDate, "HH:mm")}
                            </div>
                          </div>
                          <div className="border-l-3 border-white/20 pl-3">
                            <p className="text-sm font-medium">{event.titulo}</p>
                            {event.local && (
                              <p className="text-xs flex items-center gap-1 opacity-80">
                                <MapPin size={12} /> {event.local}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/70 py-8">
              <p>Nenhum evento encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
