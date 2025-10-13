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
import { EnvironmentOutlined } from "@ant-design/icons";

interface EventItem {
  id: number;
  titulo: string;
  data: string;
  local?: string;
  cidade?: string;
  createdAt: string;
}

interface AgendaPageProps {
  bgColor?: string;
  bgImage?: string;
}

export default function AgendaPage({
  bgColor = "#5C1E0F",
  bgImage = "/padrao2.webp",
}: AgendaPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/agenda");
        const data = await response.json();
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

  const eventsByMonthAndLocation = events.reduce<
    Record<string, Record<string, EventItem[]>>
  >((acc, event) => {
    const date = new Date(event.data);
    const monthLabel = format(date, "MMMM yyyy", { locale: ptBR });

    const city = event.cidade?.trim().toLowerCase() || "EVENTO";
    const locationLabel = city.charAt(0).toUpperCase() + city.slice(1);

    if (!acc[monthLabel]) acc[monthLabel] = {};
    if (!acc[monthLabel][locationLabel]) acc[monthLabel][locationLabel] = [];

    acc[monthLabel][locationLabel].push(event);
    return acc;
  }, {});

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
    <section
      className="min-h-screen max-w-screen flex justify-center py-24 relative"
      style={{ backgroundColor: bgColor }}
    >
      {bgImage && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}

      <BackBtn label="Agenda" />

      <div className="relative w-full md:w-[35%] text-white font-sans mx-4 z-10 mt-16 flex flex-col gap-12">
        {/* Calendário */}
        <div className="bg-[#F38901] rounded-lg p-4 shadow-lg">
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

          <div className="grid grid-cols-7 text-center text-xs font-semibold bg-[#5C1E0F] px-4 text-white py-1 rounded">
            {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mt-2 relative border-2 border-[#5C1E0F] p-4">
            {(() => {
              const firstDayOfWeek = start.getDay();
              const blanksBefore = Array(firstDayOfWeek).fill(null);
              const allDays = [...blanksBefore, ...days];
              const totalCells = Math.ceil(allDays.length / 7) * 7;
              const blanksAfter = Array(totalCells - allDays.length).fill(null);
              const calendarCells = [...allDays, ...blanksAfter];

              return calendarCells.map((day, idx) => {
                if (!day)
                  return <div key={`blank-${idx}`} className="h-7 w-7" />;

                const hasEvent = events.some(
                  (ev) =>
                    format(new Date(ev.data), "dd/MM/yyyy") ===
                    format(day, "dd/MM/yyyy")
                );

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
                      ${hasEvent ? "border-2 border-[#5C1E0F]" : ""}`}
                  >
                    <span>{day.getDate()}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Lista de eventos - Card da Home */}
        <div className="flex flex-col gap-8">
          {events.filter((ev) => isSameMonth(new Date(ev.data), currentDate))
            .length > 0 ? (
            Object.entries(
              events
                .filter((ev) => isSameMonth(new Date(ev.data), currentDate))
                .reduce<Record<string, EventItem[]>>((acc, event) => {
                  const city = event.cidade?.trim().toLowerCase() || "EVENTO";
                  const locationLabel =
                    city.charAt(0).toUpperCase() + city.slice(1);
                  if (!acc[locationLabel]) acc[locationLabel] = [];
                  acc[locationLabel].push(event);
                  return acc;
                }, {})
            ).map(([location, locationEvents]) => (
              <div key={location} className="space-y-4">
                <span className="bg-[#F38901] uppercase text-[#681A01] font-bold px-3 py-1 rounded flex items-center gap-2">
                  <EnvironmentOutlined className="mr-2" />
                  {location}
                </span>

                <div className="flex flex-col gap-4">
                  {locationEvents.map((event) => {
                    const eventDate = new Date(event.data);
                    return (
                      <div
                        key={event.id}
                        className="flex flex-row items-center justify-center bg-white/10 rounded-lg px-1 py-2"
                      >
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

                        <div className="flex-1 flex flex-col justify-center text-left leading-none ml-2 gap-1">
                          <p className="text-sm sm:text-base font-medium text-white leading-none">
                            {event.titulo}
                          </p>
                          {(event.local || event.cidade) && (
                            <p className="text-[12px] text-white/80 leading-none flex items-center gap-1">
                              <MapPin size={12} /> {event.local}{" "}
                              {event.cidade && `| ${event.cidade}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/70 py-8">
              Nenhum evento encontrado.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
