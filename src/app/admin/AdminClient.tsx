"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, CalendarDays, FolderKanban, Info, LogOut, Newspaper } from "lucide-react";
import AdminAgenda from "@/components/admin/Agenda";
import AdminLivro from "@/components/admin/Livro";
import AdminNoticia from "@/components/admin/Noticia";
import AdminProjeto from "@/components/admin/Projeto";
import AdminSobre from "@/components/admin/Sobre";
import { limparCacheAdministrativo } from "@/lib/cache-administrativo";

export type BufferData = string;

type AreaAdministrativa = "agenda" | "noticias" | "livros" | "projetos" | "sobre";

const areasAdministrativas: {
  id: AreaAdministrativa;
  titulo: string;
  descricao: string;
  Icone: typeof CalendarDays;
  Componente: ComponentType;
}[] = [
  { id: "agenda", titulo: "Agenda", descricao: "Eventos e apresentações", Icone: CalendarDays, Componente: AdminAgenda },
  { id: "noticias", titulo: "Notícias", descricao: "Publicações e novidades", Icone: Newspaper, Componente: AdminNoticia },
  { id: "livros", titulo: "Livros", descricao: "Obras e referências", Icone: BookOpen, Componente: AdminLivro },
  { id: "projetos", titulo: "Projetos", descricao: "Ações do coletivo", Icone: FolderKanban, Componente: AdminProjeto },
  { id: "sobre", titulo: "Sobre", descricao: "História e trajetória", Icone: Info, Componente: AdminSobre },
];

export default function AdminClient() {
  const [areaAtiva, setAreaAtiva] = useState<AreaAdministrativa>("noticias");
  const areaSelecionada = areasAdministrativas.find((area) => area.id === areaAtiva)!;
  const ConteudoAtivo = areaSelecionada.Componente;

  async function logout() {
    limparCacheAdministrativo();
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => undefined);
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-slate-900">
      <header className="sticky top-0 z-40 border-b-4 border-[#F38901] bg-[#321d3b] text-white">
        <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:h-[72px] xl:px-8 min-[1440px]:h-[76px] min-[1440px]:px-10 2xl:h-[72px] 2xl:px-10">
          <Link href="/admin" className="flex items-center gap-3" aria-label="À Margem, painel administrativo">
            <Image src="/logo-branca.png" alt="Coletivo À Margem" width={150} height={83} priority className="h-10 w-auto object-contain sm:h-11 xl:h-12 2xl:h-10" />
            <span className="hidden border-l border-white/35 pl-3 text-sm font-semibold text-white/90 sm:inline xl:text-base 2xl:text-sm">Painel Administrativo</span>
          </Link>
          <button
            onClick={logout}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/70 px-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FECA55] xl:min-h-11 xl:px-4"
          >
            <LogOut className="size-4 xl:size-5" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1920px] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] min-[1440px]:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-72px)] bg-[#2e1a37] px-3 py-7 text-white lg:block xl:px-4 min-[1440px]:min-h-[calc(100vh-76px)] min-[1440px]:px-5 2xl:min-h-[calc(100vh-72px)] 2xl:px-4" aria-label="Navegação do painel">
          <p className="mb-4 px-3 text-sm font-semibold uppercase tracking-[0.08em] text-white/70 xl:px-4 min-[1440px]:text-base 2xl:text-sm">Conteúdo</p>
          <nav className="space-y-1.5">
            {areasAdministrativas.map(({ id, titulo, descricao, Icone }) => {
              const ativo = areaAtiva === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={ativo ? "page" : undefined}
                  onClick={() => setAreaAtiva(id)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-l-4 px-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F38901] xl:min-h-[64px] xl:gap-3 xl:px-3 min-[1440px]:min-h-[70px] min-[1440px]:gap-4 min-[1440px]:px-4 2xl:min-h-[64px] 2xl:px-3 ${ativo ? "border-[#F38901] bg-[#563765] text-white" : "border-transparent text-white/85 hover:bg-white/10"}`}
                >
                  <Icone aria-hidden="true" className={`size-5 shrink-0 xl:size-5 min-[1440px]:size-6 2xl:size-5 ${ativo ? "text-[#F38901]" : "text-white/90"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold xl:text-base min-[1440px]:text-base 2xl:text-sm">{titulo}</span>
                    <span className={`block truncate text-xs xl:text-sm min-[1440px]:text-sm 2xl:text-xs ${ativo ? "text-white/80" : "text-white/65"}`}>{descricao}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-8 min-[1440px]:px-10 2xl:max-w-[1540px] 2xl:px-8">
          <label className="mb-4 flex flex-col gap-1 text-sm font-medium text-slate-700 lg:hidden">
              <span>Área de conteúdo</span>
              <select
                value={areaAtiva}
                onChange={(evento) => setAreaAtiva(evento.target.value as AreaAdministrativa)}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
              >
                {areasAdministrativas.map((area) => <option key={area.id} value={area.id}>{area.titulo}</option>)}
              </select>
          </label>
          <ConteudoAtivo />
        </main>
      </div>
    </div>
  );
}
