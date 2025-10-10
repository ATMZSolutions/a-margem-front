import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar } from "lucide-react";

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
    <section className="min-h-screen flex items-center justify-center bg-[#681A01] text-white px-4">
      <div className="w-full max-w-4xl">
        <h2 className="text-4xl font-bold text-center mb-12">PRÓXIMOS EVENTOS</h2>
        
        {eventos.length === 0 ? (
          <div className="text-center text-white/80">
            <p>Nenhum evento programado no momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => {
              const eventDate = new Date(evento.data);
              return (
                <div
                  key={evento.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3 text-[#F5A623]">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">
                      {format(eventDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
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
                </div>
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
