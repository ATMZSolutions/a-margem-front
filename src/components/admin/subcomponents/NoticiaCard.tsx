"use client";
import React from "react";
import { Button } from "antd";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { NoticiaItem } from "../Noticia";

interface NoticiaCardProps {
  noticia: NoticiaItem;
  processingEdit?: boolean;
  isEditing: boolean;
  loading?: boolean;
  onEditStart: (noticia: NoticiaItem) => void;
  onEditCancel: () => void;
  onEditChange: (updates: Partial<NoticiaItem>) => void;
  onEditSubmit: (e: React.FormEvent) => void;
  onDelete: (id?: number) => void;
}

const NoticiaCard: React.FC<NoticiaCardProps> = ({
  noticia,
  processingEdit,
  isEditing,
  loading,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSubmit,
  onDelete,
}) => {
  return (
    <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
      {isEditing ? (
        <form onSubmit={onEditSubmit} className="space-y-4 rounded-lg bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Editar notícia</h3>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título
          <input
            required
            value={noticia.titulo}
            onChange={(e) => onEditChange({ titulo: e.target.value })}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
          />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Conteúdo
          <textarea
            required
            value={noticia.conteudo}
            onChange={(e) => onEditChange({ conteudo: e.target.value })}
            className="min-h-36 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
            rows={6}
          />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Link
          <input
            required
            type='url'
            value={noticia.link || ""}
            onChange={(e) => onEditChange({ link: e.target.value })}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
          />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="min-h-11"
            >
              Salvar alterações
            </Button>
            <Button
              onClick={onEditCancel}
              disabled={processingEdit}
              className="min-h-11"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-10">
              <FileText className="size-5 2xl:size-[18px]" />
            </span>
            <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#19121d]">{noticia.titulo}</h3>
              <div className="mt-1 line-clamp-2 text-sm text-slate-600">{noticia.conteudo}</div>
              {noticia.link && (
                <a href={noticia.link} target="_blank" rel="noreferrer" className="mt-2 block truncate text-sm text-[#412551] underline decoration-[#F38901]/60 underline-offset-2 hover:text-[#681A01]">
                  {noticia.link}
                </a>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:pl-4">
            <Button
              onClick={() => onEditStart(noticia)}
              loading={processingEdit}
              icon={<Pencil size={15} aria-hidden="true" />}
              className="min-h-11 2xl:min-h-10"
            >
              Editar
            </Button>
            <Button
              danger
              onClick={() => onDelete(noticia.id)}
              icon={<Trash2 size={15} aria-hidden="true" />}
              className="min-h-11 2xl:min-h-10"
            >
              Excluir
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};

export default NoticiaCard;
