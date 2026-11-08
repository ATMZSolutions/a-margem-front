"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from "lucide-react";
import { limparCacheAdministrativo } from "@/lib/cache-administrativo";

export default function LoginPage() {
  const [nomeUsuario, definirNomeUsuario] = useState('');
  const [senha, definirSenha] = useState('');
  const [mostrarSenha, definirMostrarSenha] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);
  const [enviando, definirEnvio] = useState(false);
  const router = useRouter();

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    definirErro(null);
    definirEnvio(true);

    try {
      const resposta = await fetch('/api/admin/auth', {
        method: 'POST',
        body: JSON.stringify({ username: nomeUsuario, password: senha }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (resposta.ok) {
        limparCacheAdministrativo();
        router.push('/admin');
        return;
      }

      const dados = await resposta.json().catch(() => null);
      definirErro(dados?.error || 'Não foi possível entrar. Confira suas credenciais e tente novamente.');
    } catch {
      definirErro('Não foi possível conectar ao painel. Verifique sua conexão e tente novamente.');
    } finally {
      definirEnvio(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-[#321d3b] px-4 py-8 sm:py-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-[#F38901]" />

      <div className="relative w-full max-w-[440px] 2xl:max-w-[420px]">
        <header className="mb-6 flex flex-col items-center text-center sm:mb-7">
          <Image
            src="/logo-branca.png"
            alt="Coletivo À Margem"
            width={180}
            height={99}
            priority
            className="mb-3 h-16 w-auto object-contain sm:h-20"
          />
          <h1 className="font-sans text-sm font-semibold uppercase tracking-[0.16em] text-[#FECA55] sm:text-base sm:tracking-[0.2em]">
            Painel administrativo
          </h1>
        </header>

        <form
          onSubmit={entrar}
          aria-busy={enviando}
          className="space-y-5 rounded-2xl border border-[#e4d8e9] bg-[#fffaf7] p-5 shadow-xl shadow-black/15 sm:p-7 2xl:p-6"
        >
          {erro && (
            <div id="erro-login" role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {erro}
            </div>
          )}

          <label htmlFor="nome-usuario" className="block space-y-1.5 text-sm font-semibold text-[#321342] sm:text-base">
            <span>Nome de usuário</span>
            <span className="flex min-h-12 items-center rounded-lg border border-[#d7c2e2] bg-white transition focus-within:border-[#7a24a1] focus-within:ring-2 focus-within:ring-[#7a24a1]/15">
              <UserRound className="ml-3 size-5 shrink-0 text-[#54216f]" aria-hidden="true" />
              <span aria-hidden="true" className="mx-3 h-6 w-px shrink-0 bg-[#d9cbe1]" />
              <input
                id="nome-usuario"
                required
                autoComplete="username"
                placeholder="Digite seu nome de usuário"
                value={nomeUsuario}
                onChange={(evento) => definirNomeUsuario(evento.target.value)}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? "erro-login" : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 pr-3 text-base font-normal text-slate-900 outline-none placeholder:text-slate-500 focus:ring-0"
              />
            </span>
          </label>

          <label htmlFor="senha" className="block space-y-1.5 text-sm font-semibold text-[#321342] sm:text-base">
            <span>Senha</span>
            <span className="flex min-h-12 items-center rounded-lg border border-[#d7c2e2] bg-white transition focus-within:border-[#7a24a1] focus-within:ring-2 focus-within:ring-[#7a24a1]/15">
              <LockKeyhole className="ml-3 size-5 shrink-0 text-[#54216f]" aria-hidden="true" />
              <span aria-hidden="true" className="mx-3 h-6 w-px shrink-0 bg-[#d9cbe1]" />
              <input
                id="senha"
                required
                type={mostrarSenha ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(evento) => definirSenha(evento.target.value)}
                aria-invalid={Boolean(erro)}
                aria-describedby={erro ? "erro-login" : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base font-normal text-slate-900 outline-none placeholder:text-slate-500 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => definirMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                className="mr-1.5 grid size-9 shrink-0 place-items-center rounded-md text-[#54216f] transition hover:bg-[#f2eaf6] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#7a24a1]"
              >
                {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#F38901] px-4 text-sm font-semibold text-[#241c26] transition hover:bg-[#FECA55] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#54216f] disabled:cursor-wait disabled:opacity-70 sm:text-base"
          >
            <LogIn className="size-4 sm:size-5" aria-hidden="true" />
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/75">
          Entre com suas credenciais administrativas.
        </p>
      </div>
    </main>
  );
}
