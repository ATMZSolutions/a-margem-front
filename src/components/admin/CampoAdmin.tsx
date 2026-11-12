"use client";

import { useId, useMemo, type ChangeEvent } from "react";
import { AlertCircle } from "lucide-react";

export interface CampoAdminProps {
  id?: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  tipo?: "text" | "textarea" | "url" | "number" | "date" | "time" | "year";
  placeholder?: string;
  required?: boolean;
  minLen?: number;
  maxLen?: number;
  proibirHtml?: boolean;
  linhas?: number;
  min?: number;
  max?: number;
  ajuda?: string;
  erroExterno?: string;
  className?: string;
}

export function validarCampo(
  valorStr: string,
  opcoes: {
    tipo?: CampoAdminProps["tipo"];
    required?: boolean;
    minLen?: number;
    maxLen?: number;
    proibirHtml?: boolean;
    min?: number;
    max?: number;
  }
): string | null {
  const { tipo = "text", required, minLen, maxLen, proibirHtml = true, min, max } = opcoes;
  const texto = valorStr.trim();

  if (required && texto.length === 0) {
    return "Este campo é obrigatório.";
  }

  if (texto.length === 0) {
    return null;
  }

  // Validação de caracteres proibidos em texto (HTML tags)
  if (proibirHtml && /[<>]/.test(valorStr)) {
    return "Caracteres especiais < e > não são permitidos.";
  }

  // Validação de comprimento mínimo e máximo
  if (minLen !== undefined && valorStr.length < minLen) {
    return `Mínimo de ${minLen} caracteres (atual: ${valorStr.length}).`;
  }
  if (maxLen !== undefined && valorStr.length > maxLen) {
    return `Limite de ${maxLen} caracteres excedido (atual: ${valorStr.length}).`;
  }

  // Validação por tipo
  if (tipo === "url") {
    if (/\s/.test(valorStr)) {
      return "URLs não podem conter espaços em branco.";
    }
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(valorStr)) {
      return "URL deve iniciar com https://, http://, mailto:, tel: ou /";
    }
  }

  if (tipo === "year") {
    if (!/^\d{4}$/.test(texto)) {
      return "Ano deve conter exatamente 4 dígitos numéricos (ex: 2026).";
    }
    const anoNum = Number(texto);
    if (anoNum < 1900 || anoNum > 2100) {
      return "Ano deve estar entre 1900 e 2100.";
    }
  }

  if (tipo === "number") {
    const num = Number(valorStr);
    if (Number.isNaN(num)) {
      return "Informe um número válido.";
    }
    if (min !== undefined && num < min) {
      return `O valor mínimo permitido é ${min}.`;
    }
    if (max !== undefined && num > max) {
      return `O valor máximo permitido é ${max}.`;
    }
  }

  return null;
}

export default function CampoAdmin({
  id: idProp,
  label,
  value,
  onChange,
  tipo = "text",
  placeholder,
  required = false,
  minLen,
  maxLen,
  proibirHtml = true,
  linhas = 4,
  min,
  max,
  ajuda,
  erroExterno,
  className = "",
}: CampoAdminProps) {
  const autoId = useId();
  const inputId = idProp || autoId;
  const valorStr = value === null || value === undefined ? "" : String(value);

  const erroValidacao = useMemo(() => {
    return validarCampo(valorStr, { tipo, required, minLen, maxLen, proibirHtml, min, max });
  }, [valorStr, tipo, required, minLen, maxLen, proibirHtml, min, max]);

  const erroFinal = erroExterno || erroValidacao;
  const temErro = Boolean(erroFinal);

  const contadorCor = useMemo(() => {
    if (!maxLen) return "text-slate-400";
    const proporcao = valorStr.length / maxLen;
    if (proporcao > 1) return "text-red-600 font-bold";
    if (proporcao >= 0.9) return "text-amber-600 font-medium";
    return "text-slate-400";
  }, [valorStr.length, maxLen]);

  const classeBase =
    "w-full rounded-lg border bg-white px-3 py-2 text-base text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500";
  const classeEstado = temErro
    ? "border-red-500 text-red-900 focus:border-red-600 focus:ring-red-200"
    : "border-slate-300 focus:border-[#412551] focus:ring-[#412551]/20";

  const inputType = tipo === "year" ? "text" : tipo;
  const ariaDescribedby = temErro ? `${inputId}-erro` : ajuda ? `${inputId}-ajuda` : undefined;

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
            {label}
          </label>
          {required && (
            <span className="text-red-500 font-bold text-xs" aria-hidden="true">
              *
            </span>
          )}
        </div>
        {maxLen !== undefined && (
          <span className={`text-xs tabular-nums ${contadorCor}`} aria-live="polite">
            {valorStr.length} / {maxLen}
          </span>
        )}
      </div>

      {tipo === "textarea" ? (
        <textarea
          id={inputId}
          rows={linhas}
          value={valorStr}
          placeholder={placeholder}
          required={required}
          onChange={handleChange}
          aria-invalid={temErro}
          aria-describedby={ariaDescribedby}
          className={`${classeBase} ${classeEstado} min-h-24`}
        />
      ) : (
        <input
          id={inputId}
          type={inputType}
          value={valorStr}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          onChange={handleChange}
          aria-invalid={temErro}
          aria-describedby={ariaDescribedby}
          className={`${classeBase} ${classeEstado} min-h-11`}
        />
      )}

      {temErro ? (
        <p
          id={`${inputId}-erro`}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{erroFinal}</span>
        </p>
      ) : ajuda ? (
        <p id={`${inputId}-ajuda`} className="text-xs text-slate-500">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}
