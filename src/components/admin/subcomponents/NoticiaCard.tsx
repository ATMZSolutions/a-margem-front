"use client";
import React from "react";
import { Button } from "antd";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { NoticiaItem } from "../Noticia";

export interface NoticiaCardProps {
  noticia: NoticiaItem;
  processingEdit?: boolean;
  onEditStart: (noticia: NoticiaItem) => void;
  onDelete: (id?: number) => void;
}

const NoticiaCard: React.FC<NoticiaCardProps> = ({
  noticia,
  processingEdit,
  onEditStart,
  onDelete,
}) => {
  return (
    <li className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
      <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-10">
            <FileText className="size-5 2xl:size-[18px]" />
          </span>
          <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-bold text-[#19121d]">{noticia.titulo}</h3>
            <div className="mt-1 line-clamp-2 break-words text-sm text-slate-600">{noticia.conteudo}</div>
            {noticia.link && (
              <div className="mt-2 min-w-0 max-w-full">
                <a
                  href={noticia.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={noticia.link}
                  className="inline-block max-w-full truncate text-sm text-[#412551] underline decoration-[#F38901]/60 underline-offset-2 hover:text-[#681A01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
                >
                  {noticia.link}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </div>
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
    </li>
  );
};

export default NoticiaCard;
