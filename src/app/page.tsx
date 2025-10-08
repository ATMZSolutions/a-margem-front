"use client";

import { useState, useEffect } from "react";
import Main from "@/components/home/Main";
import Sobre from "@/components/home/Sobre";
import Agenda from "@/components/home/Agenda";
import Contato from "@/components/home/Contato";

interface AgendaItem {
  id: number;
  titulo: string;
  data: string;
  local?: string;
  createdAt: string;
}

interface NoticiaItem {
  id: number;
  titulo: string;
  conteudo: string;
  link: string;
  createdAt: string;
}

export default function Home() {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [agendaResponse, noticiasResponse] = await Promise.all([
          fetch('/api/agenda'),
          fetch('/api/noticias')
        ]);
        
        const agendaData = await agendaResponse.json();
        const noticiasData = await noticiasResponse.json();
        
        setAgenda(agendaData || []);
        setNoticias(noticiasData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="font-sans">
      <Main noticias={noticias.slice(0, 3)} /> {/* Mostrar últimas 3 notícias */}
      <Sobre />
      <Agenda eventos={agenda.slice(0, 5)} loading={loading} /> {/* Mostrar próximos 5 eventos */}
      <Contato />
    </div>
  );
}
