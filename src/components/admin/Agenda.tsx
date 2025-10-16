"use client"
import { useEffect, useState } from "react";

type AgendaItem = {
    id?: number;
    titulo: string;
    data: string;
    local?: string;
    cidade?: string;
};

const AdminAgenda = () => {
    const [agendas, setAgendas] = useState<AgendaItem[]>([]);
    const [newAgenda, setNewAgenda] = useState<AgendaItem>({
        titulo: "",
        data: "",
        local: "",
        cidade: "",
    });
    const [agendaTime, setAgendaTime] = useState<string>("19:00"); // horário padrão
    const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
    const [editingAgendaTime, setEditingAgendaTime] = useState<string>("19:00");

    async function load() {
        const a = await fetch("/api/admin/agenda").then((r) => r.json());
        setAgendas(a || []);
    }

    useEffect(() => {
        load();
    }, []);

    async function createAgenda(e: React.FormEvent) {
        e.preventDefault();
        // Combinar data e hora no fuso horário local
        const dateTimeString = `${newAgenda.data}T${agendaTime}:00`;
        const localDate = new Date(dateTimeString);
        const isoString = localDate.toISOString();

        const agendaToCreate = {
            ...newAgenda,
            data: isoString,
        };

        await fetch("/api/admin/agenda", {
            method: "POST",
            body: JSON.stringify(agendaToCreate),
            headers: { "Content-Type": "application/json" },
        });
        setNewAgenda({ titulo: "", data: "", local: "", cidade: "" });
        setAgendaTime("19:00");
        load();
    }

    async function deleteAgenda(id?: number) {
        if (!id) return;
        await fetch("/api/admin/agenda?id=" + id, { method: "DELETE" });
        load();
    }

    function startEditAgenda(agenda: AgendaItem) {
        setEditingAgenda(agenda);
        // Extrair hora da data ISO
        const date = new Date(agenda.data);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        setEditingAgendaTime(`${hours}:${minutes}`);
    }

    function cancelEditAgenda() {
        setEditingAgenda(null);
        setEditingAgendaTime("19:00");
    }

    async function updateAgenda(e: React.FormEvent) {
        e.preventDefault();
        if (!editingAgenda) return;

        // Combinar data e hora no fuso horário local
        const currentDate = new Date(editingAgenda.data);
        const dateOnly = currentDate.toISOString().split("T")[0];
        const dateTimeString = `${dateOnly}T${editingAgendaTime}:00`;
        const localDate = new Date(dateTimeString);
        const isoString = localDate.toISOString();

        const agendaToUpdate = {
            ...editingAgenda,
            data: isoString,
        };

        await fetch("/api/admin/agenda", {
            method: "PUT",
            body: JSON.stringify(agendaToUpdate),
            headers: { "Content-Type": "application/json" },
        });
        setEditingAgenda(null);
        setEditingAgendaTime("19:00");
        load();
    }

    return (
        <section className="mb-8">
            <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
                Agendas
            </h2>
            <form
                onSubmit={createAgenda}
                className="flex flex-col gap-2 my-3 text-white"
            >
                <input
                    required
                    placeholder="Título"
                    value={newAgenda.titulo}
                    onChange={(e) =>
                        setNewAgenda({ ...newAgenda, titulo: e.target.value })
                    }
                    className="p-2 border border-white rounded"
                />
                <div className="flex gap-2 w-full">
                    <input
                        required
                        type="date"
                        value={newAgenda.data}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, data: e.target.value })
                        }
                        className="p-2 border border-white rounded flex-1 min-w-0"
                    />
                    <input
                        type="time"
                        value={agendaTime}
                        onChange={(e) => setAgendaTime(e.target.value)}
                        className="p-2 border border-white rounded flex-1 min-w-0"
                    />
                </div>
                <input
                    placeholder="Cidade"
                    value={newAgenda.cidade}
                    onChange={(e) =>
                        setNewAgenda({ ...newAgenda, cidade: e.target.value })
                    }
                    className="p-2 border border-white rounded"
                />
                <input
                    placeholder="Local"
                    value={newAgenda.local}
                    onChange={(e) =>
                        setNewAgenda({ ...newAgenda, local: e.target.value })
                    }
                    className="p-2 border border-white rounded"
                />
                <button className="bg-orange-500 px-3 rounded py-2 mb-4 hover:cursor-pointer active:bg-orange-700">
                    Adicionar
                </button>
            </form>

            {agendas.length > 0 && (
                <h3 className="text-lg mt-4 my-2">Agendas cadastradas: </h3>
            )}
            <ul className="space-y-2">
                {agendas.map((a) => (
                    <li key={a.id} className="bg-black/30 px-4 py-2 rounded">
                        {editingAgenda?.id === a.id && editingAgenda ? (
                            <form onSubmit={updateAgenda} className="space-y-2">
                                <input
                                    required
                                    placeholder="Título"
                                    value={editingAgenda.titulo}
                                    onChange={(e) =>
                                        setEditingAgenda({
                                            ...editingAgenda,
                                            titulo: e.target.value,
                                            data: editingAgenda.data || "",
                                            local: editingAgenda.local || "",
                                        })
                                    }
                                    className="w-full p-2 border border-white rounded text-white"
                                />
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="date"
                                        value={
                                            new Date(editingAgenda.data)
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        onChange={(e) =>
                                            setEditingAgenda({
                                                ...editingAgenda,
                                                data: e.target.value,
                                                titulo: editingAgenda.titulo || "",
                                                local: editingAgenda.local || "",
                                            })
                                        }
                                        className="flex-1 p-2 border border-white rounded text-white"
                                    />
                                    <input
                                        type="time"
                                        value={editingAgendaTime}
                                        onChange={(e) => setEditingAgendaTime(e.target.value)}
                                        className="flex-1 p-2 border border-white rounded text-white"
                                    />
                                </div>
                                <input
                                    placeholder="Cidade"
                                    value={editingAgenda.cidade || ""}
                                    onChange={(e) =>
                                        setEditingAgenda({
                                            ...editingAgenda,
                                            cidade: e.target.value,
                                            titulo: editingAgenda.titulo || "",
                                            local: editingAgenda.local || "",
                                            data: editingAgenda.data || "",
                                        })
                                    }
                                    className="w-full p-2 border border-white rounded text-white"
                                />
                                <input
                                    placeholder="Local"
                                    value={editingAgenda.local || ""}
                                    onChange={(e) =>
                                        setEditingAgenda({
                                            ...editingAgenda,
                                            local: e.target.value,
                                            titulo: editingAgenda.titulo || "",
                                            data: editingAgenda.data || "",
                                        })
                                    }
                                    className="w-full p-2 border border-white rounded text-white"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEditAgenda}
                                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{a.titulo}</div>
                                    <div className="text-sm text-gray-300">
                                        {new Date(a.data).toLocaleString("pt-BR")} — {a.local} — {a.cidade}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditAgenda(a)}
                                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => deleteAgenda(a.id)}
                                        className="bg-red-600 px-2 rounded hover:bg-red-700"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    )
}
export default AdminAgenda;