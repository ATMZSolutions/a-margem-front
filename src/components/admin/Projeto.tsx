import { useEffect, useState } from "react";

type ProjetoItem = {
    id?: number;
    data: string;
    descricao: string;
};

const AdminProjeto = () => {
    const [projetos, setProjetos] = useState<ProjetoItem[]>([]);
    const [newProjeto, setNewProjeto] = useState<ProjetoItem>({
        data: "",
        descricao: "",
    });
    const [editingProjeto, setEditingProjeto] = useState<ProjetoItem | null>(
        null
    );

    async function load() {
        const p = await fetch("/api/admin/projeto").then((r) => r.json());
        setProjetos(p || []);
    }

    useEffect(() => {
        load();
    }, []);

    // Funções para Projeto
    async function createProjeto(e: React.FormEvent) {
        e.preventDefault();
        const dateTimeString = `${newProjeto.data}T00:00:00`;
        const localDate = new Date(dateTimeString);
        const isoString = localDate.toISOString();

        const projetoToCreate = {
            ...newProjeto,
            data: isoString,
        };

        await fetch("/api/admin/projeto", {
            method: "POST",
            body: JSON.stringify(projetoToCreate),
            headers: { "Content-Type": "application/json" },
        });
        setNewProjeto({ data: "", descricao: "" });
        load();
    }

    async function deleteProjeto(id?: number) {
        if (!id) return;
        await fetch("/api/admin/projeto?id=" + id, { method: "DELETE" });
        load();
    }

    function startEditProjeto(projeto: ProjetoItem) {
        setEditingProjeto(projeto);
    }

    function cancelEditProjeto() {
        setEditingProjeto(null);
    }

    async function updateProjeto(e: React.FormEvent) {
        e.preventDefault();
        if (!editingProjeto) return;

        const dateTimeString = `${editingProjeto.data.split("T")[0]}T00:00:00`;
        const localDate = new Date(dateTimeString);
        const isoString = localDate.toISOString();

        const projetoToUpdate = {
            ...editingProjeto,
            data: isoString,
        };

        await fetch("/api/admin/projeto", {
            method: "PUT",
            body: JSON.stringify(projetoToUpdate),
            headers: { "Content-Type": "application/json" },
        });
        setEditingProjeto(null);
        load();
    }

    return (
        <section>
            <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
                Projetos
            </h2>
            <form onSubmit={createProjeto} className="space-y-3 my-3">
                <input
                    required
                    type="date"
                    placeholder="Data"
                    value={newProjeto.data}
                    onChange={(e) =>
                        setNewProjeto({ ...newProjeto, data: e.target.value })
                    }
                    className="w-full p-2 text-white rounded border border-white"
                />
                <textarea
                    required
                    placeholder="Descrição"
                    value={newProjeto.descricao}
                    onChange={(e) =>
                        setNewProjeto({ ...newProjeto, descricao: e.target.value })
                    }
                    className="w-full p-2 text-white rounded border border-white"
                    rows={3}
                />
                <button className="bg-orange-500 px-3 rounded py-2 mb-4 hover:cursor-pointer active:bg-orange-700">
                    Adicionar Projeto
                </button>
            </form>

            {projetos.length > 0 && (
                <h3 className="text-lg mt-4 my-2">Projetos cadastrados:</h3>
            )}
            <ul className="space-y-2">
                {projetos.map((p) => (
                    <li key={p.id} className="border border-gray-600 rounded p-3">
                        {editingProjeto && editingProjeto.id === p.id ? (
                            <form onSubmit={updateProjeto} className="space-y-2">
                                <input
                                    required
                                    type="date"
                                    value={editingProjeto.data.split("T")[0]}
                                    onChange={(e) =>
                                        setEditingProjeto({
                                            ...editingProjeto,
                                            data: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 text-white rounded border border-white"
                                />
                                <textarea
                                    required
                                    value={editingProjeto.descricao}
                                    onChange={(e) =>
                                        setEditingProjeto({
                                            ...editingProjeto,
                                            descricao: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 text-white rounded border border-white"
                                    rows={3}
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
                                        onClick={cancelEditProjeto}
                                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="font-semibold">
                                        {new Date(p.data).toLocaleDateString("pt-BR")}
                                    </div>
                                    <div className="text-sm text-gray-300 mt-1">
                                        {p.descricao}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditProjeto(p)}
                                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => deleteProjeto(p.id)}
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
export default AdminProjeto;