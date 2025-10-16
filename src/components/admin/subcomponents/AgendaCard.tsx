"use client";
import React from "react";
import { Button, Input } from "antd";

export interface AgendaItem {
    id?: number;
    titulo: string;
    data: string;
    local?: string;
    cidade?: string;
}

interface AgendaCardProps {
    agenda: AgendaItem;
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
        <li className="bg-black/30 px-4 py-3 rounded-lg flex-1">
            {isEditing ? (
                <form onSubmit={onEditSubmit} className="space-y-2">
                    <input
                        required
                        placeholder="Título"
                        value={agenda.titulo}
                        onChange={(e) => onEditChange({ titulo: e.target.value })}
                        className="w-full p-1 border border-white rounded text-white bg-transparent"
                    />
                    <div className="flex gap-2">
                        <input
                            required
                            type="date"
                            style={{ color: 'white' }}
                            value={new Date(agenda.data).toISOString().split("T")[0]}
                            onChange={(e) => onEditChange({ data: e.target.value })}
                            className="flex-1 p-1 border border-white rounded text-white bg-transparent"
                        />
                        <input
                            type="time"
                            value={editingAgendaTime}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="flex-1 p-1 border border-white rounded text-white bg-transparent"
                        />
                    </div>

                    <input
                        placeholder="Cidade"
                        value={agenda.cidade || ""}
                        onChange={(e) => onEditChange({ cidade: e.target.value })}
                        className="w-full p-1 border border-white rounded text-white bg-transparent"
                    />

                    <input
                        placeholder="Local"
                        value={agenda.local || ""}
                        onChange={(e) => onEditChange({ local: e.target.value })}
                        className="w-full p-1 border border-white rounded text-white bg-transparent"
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
                        <button
                            type="button"
                            onClick={onEditCancel}
                            className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <div className="font-semibold text-sm">{agenda.titulo}</div>
                        <div className="text-gray-300 text-xs">
                            {new Date(agenda.data).toLocaleString("pt-BR")} —{" "}
                            {agenda.local || "Sem local"} — {agenda.cidade || "Sem cidade"}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={() => onEditStart(agenda)}
                            style={{
                                fontSize: "14px",
                                borderRadius: "4px",
                                backgroundColor: "blue",
                                borderColor: "blue",
                            }}
                        >
                            Editar
                        </Button>
                        <Button
                            onClick={() => onDelete(agenda.id)}
                            style={{
                                fontSize: "14px",
                                borderRadius: "4px",
                                backgroundColor: "red",
                                borderColor: "red",
                            }}            >
                            Excluir
                        </Button>
                    </div>
                </div>
            )}
        </li>
    );
};

export default AgendaCard;
