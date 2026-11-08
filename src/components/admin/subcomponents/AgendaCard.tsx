"use client";
import React from "react";
import { Button } from "antd";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";

export interface AgendaItem {
    id?: number;
    titulo: string;
    data: string;
    local?: string;
    cidade?: string;
}

interface AgendaCardProps {
    agenda: AgendaItem;
    processingEdit: boolean;
    isEditing: boolean;
    editingAgendaTime: string;
    loading?: boolean;
    onEditStart: (agenda: AgendaItem) => void;
    onEditCancel: () => void;
    onEditSubmit: (e: React.FormEvent) => void;
    onEditChange: (updates: Partial<AgendaItem>) => void;
    onTimeChange: (time: string) => void;
    onDelete: (id?: number) => void;
}

const AgendaCard: React.FC<AgendaCardProps> = ({
    agenda,
    processingEdit,
    isEditing,
    editingAgendaTime,
    loading,
    onEditStart,
    onEditCancel,
    onEditSubmit,
    onEditChange,
    onTimeChange,
    onDelete,
}) => {
    return (
        <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
            {isEditing ? (
                <form onSubmit={onEditSubmit} className="space-y-4 rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Editar agenda</h3>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título
                    <input
                        required
                        value={agenda.titulo}
                        onChange={(e) => onEditChange({ titulo: e.target.value })}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Data
                        <input
                            required
                            type="date"
                            value={new Date(agenda.data).toISOString().split("T")[0]}
                            onChange={(e) => onEditChange({ data: e.target.value })}
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Horário
                        <input
                            type="time"
                            value={editingAgendaTime}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Cidade
                    <input
                        value={agenda.cidade || ""}
                        onChange={(e) => onEditChange({ cidade: e.target.value })}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Local
                    <input
                        value={agenda.local || ""}
                        onChange={(e) => onEditChange({ local: e.target.value })}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="min-h-11 2xl:min-h-10"
                        >
                            Salvar alterações
                        </Button>
                        <Button
                            onClick={onEditCancel}
                            disabled={processingEdit}
                            className="min-h-11 2xl:min-h-10"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-10">
                            <CalendarDays className="size-5 2xl:size-[18px]" />
                        </span>
                        <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                        <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[#19121d]">{agenda.titulo}</h3>
                        <div className="mt-1 text-sm text-slate-600">
                            {new Date(agenda.data).toLocaleString("pt-BR")} —{" "}
                            {agenda.local || "Sem local"} — {agenda.cidade || "Sem cidade"}
                        </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 gap-2 sm:pl-4">
                        <Button
                            onClick={() => onEditStart(agenda)}
                            loading={processingEdit}
                            icon={<Pencil size={15} aria-hidden="true" />}
                            className="min-h-11 2xl:min-h-10"
                        >
                            Editar
                        </Button>
                        <Button
                            danger
                            onClick={() => onDelete(agenda.id)}
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

export default AgendaCard;
