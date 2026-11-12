"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Award,
  BookOpen,
  CalendarDays,
  Clapperboard,
  FolderArchive,
  FolderKanban,
  History,
  Images,
  Info,
  LogOut,
  Mail,
  Newspaper,
  Users,
} from "lucide-react";
import AdminAgenda from "@/components/admin/Agenda";
import AdminEspetaculos from "@/components/admin/Espetaculos";
import AdminIntegrantes from "@/components/admin/Integrantes";
import AdminLivro from "@/components/admin/Livro";
import AdminNoticia from "@/components/admin/Noticia";
import AdminPremios from "@/components/admin/Premios";
import AdminProjeto from "@/components/admin/Projeto";
import AdminSobre from "@/components/admin/Sobre";
import AdminContatos from "@/components/admin/Contatos";
import AdminHistoria from "@/components/admin/Historia";
import AdminPaginaProjetos from "@/components/admin/PaginaProjetos";
import BibliotecaMidia from "@/components/admin/BibliotecaMidia";
import { limparCacheAdministrativo } from "@/lib/cache-administrativo";

export type BufferData = string;

export type AreaAdministrativa =
  | "noticias"
  | "agenda"
  | "espetaculos"
  | "projetos"
  | "paginaProjetos"
  | "integrantes"
  | "sobre"
  | "premios"
  | "livros"
  | "contatos"
  | "midia";

type GrupoNavegacao = "paginas" | "sistema";

type AreaAdministrativaConfig = {
  id: AreaAdministrativa;
  titulo: string;
  descricao: string;
  grupo: GrupoNavegacao;
  Icone: typeof CalendarDays;
  Componente: ComponentType;
};

const areasAdministrativas: AreaAdministrativaConfig[] = [
  // --- PÁGINAS E CONTEÚDOS PÚBLICOS (nível superior) ---
  { id: "noticias", titulo: "Notícias", descricao: "Publicações e novidades", grupo: "paginas", Icone: Newspaper, Componente: AdminNoticia },
  { id: "agenda", titulo: "Agenda", descricao: "Eventos e apresentações", grupo: "paginas", Icone: CalendarDays, Componente: AdminAgenda },
  { id: "espetaculos", titulo: "Espetáculos", descricao: "Peças, seções e repertório", grupo: "paginas", Icone: Clapperboard, Componente: AdminEspetaculos },
  { id: "projetos", titulo: "Projetos", descricao: "Ações e iniciativas do coletivo", grupo: "paginas", Icone: FolderKanban, Componente: AdminProjeto },
  { id: "paginaProjetos", titulo: "Galeria de projetos", descricao: "Fotos e apresentação pública", grupo: "paginas", Icone: Images, Componente: AdminPaginaProjetos },
  { id: "integrantes", titulo: "Integrantes", descricao: "Perfis e biografias do elenco", grupo: "paginas", Icone: Users, Componente: AdminIntegrantes },
  { id: "sobre", titulo: "História", descricao: "Trajetória e marcos históricos", grupo: "paginas", Icone: Info, Componente: AdminSobre },
  { id: "premios", titulo: "Prêmios", descricao: "Reconhecimentos e registros", grupo: "paginas", Icone: Award, Componente: AdminPremios },
  { id: "livros", titulo: "Livros", descricao: "Obras e referências", grupo: "paginas", Icone: BookOpen, Componente: AdminLivro },
  { id: "contatos", titulo: "Contatos", descricao: "Canais e página de contato", grupo: "paginas", Icone: Mail, Componente: AdminContatos },

  // --- ARQUIVOS E SISTEMA ---
  { id: "midia", titulo: "Biblioteca de imagens", descricao: "Arquivos, nomes e referências", grupo: "sistema", Icone: FolderArchive, Componente: BibliotecaMidia },
];

export default function AdminClient({ editorialAtivo }: { editorialAtivo: boolean }) {
  const [areaAtiva, setAreaAtiva] = useState<AreaAdministrativa>("noticias");
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    function abrirAreaSolicitada(event: Event) {
      const area = (event as CustomEvent<string>).detail;
      if (areasAdministrativas.some((item) => item.id === area)) setAreaAtiva(area as AreaAdministrativa);
    }
    window.addEventListener("amargem:admin-area", abrirAreaSolicitada);
    return () => window.removeEventListener("amargem:admin-area", abrirAreaSolicitada);
  }, []);

  const areasVisiveis = editorialAtivo
    ? areasAdministrativas.map((area) =>
        area.id === "sobre"
          ? { ...area, Componente: AdminHistoria, descricao: "História, marcos e publicação", Icone: History }
          : area
      )
    : areasAdministrativas.filter((area) =>
        !["integrantes", "espetaculos", "premios", "paginaProjetos", "midia", "contatos"].includes(area.id)
      );

  const paginas = areasVisiveis.filter((area) => area.grupo === "paginas");
  const configuracoes = areasVisiveis.filter((area) => area.grupo === "sistema");

  const areaSelecionada = areasVisiveis.find((area) => area.id === areaAtiva) ?? areasVisiveis[0];
  const ConteudoAtivo = areaSelecionada.Componente;

  async function logout() {
    setSaindo(true);
    limparCacheAdministrativo();
    await fetch("/api/admin/auth", { method: "DELETE" }).catch(() => undefined);
    window.location.href = "/admin/login";
  }

  function renderizarBotaoNavegacao({ id, titulo, descricao, Icone }: AreaAdministrativaConfig) {
    const ativo = areaAtiva === id;
    return (
      <button
        key={id}
        type="button"
        aria-current={ativo ? "page" : undefined}
        onClick={() => setAreaAtiva(id)}
        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-l-4 px-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F38901] xl:gap-3 xl:px-3 min-[1440px]:gap-4 min-[1440px]:px-4 2xl:px-3 ${
          ativo ? "border-[#F38901] bg-[#563765] text-white" : "border-transparent text-white/85 hover:bg-white/10"
        }`}
      >
        <Icone
          aria-hidden="true"
          className={`size-5 shrink-0 xl:size-5 min-[1440px]:size-6 2xl:size-5 ${
            ativo ? "text-[#F38901]" : "text-white/90"
          }`}
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold xl:text-base min-[1440px]:text-base 2xl:text-sm">{titulo}</span>
          <span className={`block truncate text-xs xl:text-sm min-[1440px]:text-sm 2xl:text-xs ${ativo ? "text-white/80" : "text-white/65"}`}>
            {descricao}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-[#f7f5f1] text-slate-900">
      <header className="sticky top-0 z-40 border-b-4 border-[#F38901] bg-[#321d3b] text-white">
        <div className="mx-auto flex h-16 w-full max-w-[1920px] items-center justify-between px-4 sm:px-6 lg:px-8 xl:h-[72px] xl:px-8 min-[1440px]:h-[76px] min-[1440px]:px-10 2xl:h-[72px] 2xl:px-10">
          <Link href="/admin" className="flex items-center gap-3" aria-label="À Margem, painel administrativo">
            <Image src="/logo-branca.png" alt="Coletivo À Margem" width={150} height={83} priority className="h-10 w-auto object-contain sm:h-11 xl:h-12 2xl:h-10" />
            <span className="hidden border-l border-white/35 pl-3 text-sm font-semibold text-white/90 sm:inline xl:text-base 2xl:text-sm">Painel Administrativo</span>
          </Link>
          <button
            onClick={logout}
            disabled={saindo}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/70 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FECA55] xl:min-h-11 xl:px-4"
          >
            <LogOut className="size-4 xl:size-5" aria-hidden="true" />
            <span>{saindo ? "Saindo…" : "Sair"}</span>
          </button>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1920px] min-w-0 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] min-[1440px]:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden self-start bg-[#2e1a37] px-3 py-4 text-white lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:overscroll-contain xl:top-[72px] xl:h-[calc(100dvh-72px)] xl:px-4 min-[1440px]:top-[76px] min-[1440px]:h-[calc(100dvh-76px)] min-[1440px]:px-5 2xl:top-[72px] 2xl:h-[calc(100dvh-72px)] 2xl:px-4" aria-label="Navegação do painel">
          <div className="space-y-6">
            {/* GRUPO 1: PÁGINAS E CONTEÚDOS */}
            <div>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.08em] text-white/55 xl:px-4">
                Páginas e Conteúdos
              </p>
              <nav className="space-y-1" aria-label="Navegação de páginas e conteúdos">
                {paginas.map(renderizarBotaoNavegacao)}
              </nav>
            </div>

            {/* GRUPO 2: ARQUIVOS E SISTEMA */}
            {configuracoes.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.08em] text-white/55 xl:px-4">
                  Arquivos e Sistema
                </p>
                <nav className="space-y-1" aria-label="Navegação de arquivos e sistema">
                  {configuracoes.map(renderizarBotaoNavegacao)}
                </nav>
              </div>
            )}
          </div>
        </aside>

        <main className="w-full min-w-0 max-w-full overflow-x-clip px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-8 min-[1440px]:px-10 2xl:max-w-[1540px] 2xl:px-8">
          <label className="mb-4 flex flex-col gap-1 text-sm font-medium text-slate-700 lg:hidden">
            <span>Área do painel</span>
            <select
              aria-label="Selecionar área de conteúdo do painel"
              value={areaAtiva}
              onChange={(evento) => setAreaAtiva(evento.target.value as AreaAdministrativa)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
            >
              <optgroup label="Páginas e Conteúdos">
                {paginas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.titulo}
                  </option>
                ))}
              </optgroup>
              {configuracoes.length > 0 && (
                <optgroup label="Arquivos e Sistema">
                  {configuracoes.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.titulo}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <ConteudoAtivo />
        </main>
      </div>
    </div>
  );
}
