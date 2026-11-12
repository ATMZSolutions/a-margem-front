"use client";

import { useState, type FormEvent } from "react";
import { Button } from "antd";
import { Eye, EyeOff, Lock } from "lucide-react";
import ModalAdmin from "./ModalAdmin";

export interface ModalConfirmarSenhaProps {
  aberto: boolean;
  titulo?: string;
  descricao?: string;
  textoBotaoConfirmar?: string;
  aoFechar: () => void;
  aoConfirmar: () => Promise<void> | void;
}

export default function ModalConfirmarSenha({
  aberto,
  titulo = "Confirmação de segurança",
  descricao = "Esta ação altera configurações globais ou sensíveis do sistema. Digite a senha administrativa para prosseguir.",
  textoBotaoConfirmar = "Confirmar alteração",
  aoFechar,
  aoConfirmar,
}: ModalConfirmarSenhaProps) {
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  function fechar() {
    setSenha("");
    setErro("");
    setMostrarSenha(false);
    aoFechar();
  }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (!senha.trim()) {
      setErro("Digite a senha administrativa.");
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/auth/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "Senha administrativa incorreta.");
      }
      await aoConfirmar();
      fechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Senha administrativa incorreta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ModalAdmin
      aberto={aberto}
      aoFechar={fechar}
      titulo={titulo}
      descricao={descricao}
      larguraMaxima="max-w-xl"
    >
      <form onSubmit={(e) => void submeter(e)} className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Lock className="size-5 shrink-0 text-[#F38901]" aria-hidden="true" />
          <span>Área protegida: necessária autenticação para aplicar alterações.</span>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
            {erro}
          </p>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Senha administrativa
          <div className="relative">
            <input
              required
              autoFocus
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha de administrador"
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 pr-11 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-[#412551]"
              aria-label={mostrarSenha ? "Ocultar senha" : "Exibir senha"}
            >
              {mostrarSenha ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </label>

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
          <Button onClick={fechar} disabled={carregando} className="min-h-11">
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={carregando}
            className="min-h-11 px-5 font-semibold"
          >
            {textoBotaoConfirmar}
          </Button>
        </div>
      </form>
    </ModalAdmin>
  );
}
