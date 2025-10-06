"use client";

import React, { useEffect, useState } from 'react';

type AgendaItem = {
  id?: number;
  titulo: string;
  data: string;
  local?: string;
};

type NoticiaItem = {
  id?: number;
  titulo: string;
  conteudo: string;
};

export default function AdminClient() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);

  const [newAgenda, setNewAgenda] = useState<AgendaItem>({ titulo: '', data: '', local: '' });
  const [agendaTime, setAgendaTime] = useState<string>('19:00'); // horário padrão
  const [newNoticia, setNewNoticia] = useState<NoticiaItem>({ titulo: '', conteudo: '' });

  async function load() {
    const a = await fetch('/api/admin/agenda').then((r) => r.json());
    const n = await fetch('/api/admin/noticias').then((r) => r.json());
    setAgendas(a || []);
    setNoticias(n || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createAgenda(e: React.FormEvent) {
    e.preventDefault();
    // Combinar data e hora no fuso horário local
    const dateTimeString = `${newAgenda.data}T${agendaTime}:00`;
    const localDate = new Date(dateTimeString);
    const isoString = localDate.toISOString();
    
    const agendaToCreate = {
      ...newAgenda,
      data: isoString
    };
    
    await fetch('/api/admin/agenda', { 
      method: 'POST', 
      body: JSON.stringify(agendaToCreate), 
      headers: { 'Content-Type': 'application/json' } 
    });
    setNewAgenda({ titulo: '', data: '', local: '' });
    setAgendaTime('19:00');
    load();
  }

  async function deleteAgenda(id?: number) {
    if (!id) return;
    await fetch('/api/admin/agenda?id=' + id, { method: 'DELETE' });
    load();
  }

  async function createNoticia(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/admin/noticias', { method: 'POST', body: JSON.stringify(newNoticia), headers: { 'Content-Type': 'application/json' } });
    setNewNoticia({ titulo: '', conteudo: '' });
    load();
  }

  async function deleteNoticia(id?: number) {
    if (!id) return;
    await fetch('/api/admin/noticias?id=' + id, { method: 'DELETE' });
    load();
  }

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    // redirect to login
    window.location.href = '/admin/login';
  }

  return (
    <main className="min-h-screen p-20 bg-gray-900 text-white ">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button onClick={logout} className="bg-gray-700 px-3 py-1 rounded">Logout</button>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold">Agendas</h2>
        <form onSubmit={createAgenda} className="flex gap-2 my-3 flex-wrap text-white">
          <input 
            required 
            placeholder="Título" 
            value={newAgenda.titulo} 
            onChange={(e) => setNewAgenda({ ...newAgenda, titulo: e.target.value })} 
            className="p-2 border border-white rounded" 
          />
          <input 
            required 
            type="date" 
            value={newAgenda.data} 
            onChange={(e) => setNewAgenda({ ...newAgenda, data: e.target.value })} 
            className="p-2 border border-white rounded" 
          />
          <input 
            type="time" 
            value={agendaTime} 
            onChange={(e) => setAgendaTime(e.target.value)} 
            className="p-2 border border-white rounded" 
          />
          <input 
            placeholder="Local" 
            value={newAgenda.local} 
            onChange={(e) => setNewAgenda({ ...newAgenda, local: e.target.value })} 
            className="p-2 border border-white rounded" 
          />
          <button className="bg-orange-500 px-3 rounded">Criar</button>
        </form>

        <ul className="space-y-2">
          {agendas.map((a) => (
            <li key={a.id} className="flex justify-between items-center bg-black/30 p-2 rounded">
              <div>
                <div className="font-semibold">{a.titulo}</div>
                <div className="text-sm text-gray-300">
                  {new Date(a.data).toLocaleString('pt-BR')} — {a.local}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deleteAgenda(a.id)} className="bg-red-600 px-2 rounded">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Notícias</h2>
        <form onSubmit={createNoticia} className="flex gap-2 my-3 flex-col sm:flex-row text-white">
          <input required placeholder="Título" value={newNoticia.titulo} onChange={(e) => setNewNoticia({ ...newNoticia, titulo: e.target.value })} className="p-2 border border-white rounded" />
          <textarea required placeholder="Conteúdo" value={newNoticia.conteudo} onChange={(e) => setNewNoticia({ ...newNoticia, conteudo: e.target.value })} className="p-2 border border-white rounded" />
          <button className="bg-orange-500 px-3 rounded">Criar</button>
        </form>

        <ul className="space-y-2">
          {noticias.map((n) => (
            <li key={n.id} className="flex justify-between items-center bg-black/30 p-2 rounded">
              <div>
                <div className="font-semibold">{n.titulo}</div>
                <div className="text-sm text-gray-300 line-clamp-2">{n.conteudo}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => deleteNoticia(n.id)} className="bg-red-600 px-2 rounded">Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
