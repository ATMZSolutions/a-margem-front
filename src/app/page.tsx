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

export default function Home() {
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [agendaResponse] = await Promise.all([fetch("/api/agenda")]);

        const agendaData = await agendaResponse.json();

        setAgenda(agendaData || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="font-sans">
      <Main />
      <Agenda
        eventos={Array.isArray(agenda) ? agenda.slice(0, 5) : []}
        loading={loading}
      />
      <Sobre />
      <Contato />
    </div>
  );
}
