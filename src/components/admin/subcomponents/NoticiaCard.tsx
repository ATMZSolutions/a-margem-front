"use client";
import React from "react";
import { Button } from "antd";
import { NoticiaItem } from "../Noticia";

interface NoticiaCardProps {
  noticia: NoticiaItem;
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
  isEditing,
  loading,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSubmit,
  onDelete,
}) => {
  return (
    <li className="bg-black/30 px-4 py-3 rounded-lg flex-1">
      {isEditing ? (
        <form onSubmit={onEditSubmit} className="space-y-2">
          <input
            required
            placeholder="Título"
            value={noticia.titulo}
            onChange={(e) => onEditChange({ titulo: e.target.value })}
            className="w-full p-2 border border-white rounded text-white bg-transparent"
          />
          <textarea
            required
            placeholder="Adicione o conteúdo ..."
            value={noticia.conteudo}
            onChange={(e) => onEditChange({ conteudo: e.target.value })}
            className="w-full p-2 border border-white rounded text-white bg-transparent"
            rows={3}
          />
          <input
            placeholder="Link"
            required
            type='url'
            value={noticia.link || ""}
            onChange={(e) => onEditChange({ link: e.target.value })}
            className="w-full p-2 border border-white rounded text-white bg-transparent"
          />

          <div className="flex gap-2">
            <Button
              htmlType="submit"
              loading={loading}
              style={{
                padding: 10,
                fontSize: "16px",
                borderRadius: "4px",
                backgroundColor: "green",
                borderColor: "green",
              }}
            >
              Salvar
            </Button>
            <Button
              type="default"
              onClick={onEditCancel}
              style={{
                padding: 10,
                fontSize: "16px",
                borderRadius: "4px",
                backgroundColor: "gray",
                borderColor: "gray",
                color: "white",
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-between items-center w-full">
          <div className="w-2/3">
            <div className="font-semibold text-sm">{noticia.titulo}</div>
            <div className="text-gray-300 text-xs truncate line-clamp-2">{noticia.conteudo}</div>
            {noticia.link && (
              <a href={noticia.link} className="text-blue-500 truncate block hover:underline">
                {noticia.link}
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onEditStart(noticia)}
              style={{
                fontSize: "14px",
                borderRadius: "4px",
                backgroundColor: "blue",
                borderColor: "blue",
                color: 'white'
              }}
            >
              Editar
            </Button>
            <Button
              onClick={() => onDelete(noticia.id)}
              style={{
                fontSize: "14px",
                borderRadius: "4px",
                backgroundColor: "red",
                borderColor: "red",
                color: 'white'
              }}
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
