"use client"
import { useEffect, useState } from "react";

type NoticiaItem = {
    id?: number;
    titulo: string;
    conteudo: string;
    link: string;
};

const AdminNoticia = () => {
    const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
    const [newNoticia, setNewNoticia] = useState<NoticiaItem>({
        titulo: "",
        conteudo: "",
        link: "",
    });
    const [editingNoticia, setEditingNoticia] = useState<NoticiaItem | null>(
        null
    );

    async function load() {
        const n = await fetch("/api/admin/noticias").then((r) => r.json());
        setNoticias(n || []);
    }

    useEffect(() => {
        load();
    }, []);

    async function createNoticia(e: React.FormEvent) {
        e.preventDefault();
        await fetch("/api/admin/noticias", {
            method: "POST",
            body: JSON.stringify(newNoticia),
            headers: { "Content-Type": "application/json" },
        });
        setNewNoticia({ titulo: "", conteudo: "", link: "" });
        load();
    }

    async function deleteNoticia(id?: number) {
        if (!id) return;
        await fetch("/api/admin/noticias?id=" + id, { method: "DELETE" });
        load();
    }

    function startEditNoticia(noticia: NoticiaItem) {
        setEditingNoticia(noticia);
    }

    function cancelEditNoticia() {
        setEditingNoticia(null);
    }

    async function updateNoticia(e: React.FormEvent) {
        e.preventDefault();
        if (!editingNoticia) return;

        await fetch("/api/admin/noticias", {
            method: "PUT",
            body: JSON.stringify(editingNoticia),
            headers: { "Content-Type": "application/json" },
        });
        setEditingNoticia(null);
        load();
    }

    return (
        <section>
            <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
                Notícias
            </h2>
            <form
                onSubmit={createNoticia}
                className="flex gap-2 my-3 flex-col text-white"
            >
                <input
                    required
                    placeholder="Título"
                    value={newNoticia.titulo}
                    onChange={(e) =>
                        setNewNoticia({ ...newNoticia, titulo: e.target.value })
                    }
                    className="p-2 border border-white rounded"
                />
                <textarea
                    required
                    placeholder="Adicione o conteúdo ..."
                    value={newNoticia.conteudo}
                    onChange={(e) =>
                        setNewNoticia({ ...newNoticia, conteudo: e.target.value })
                    }
                    className="p-2 border border-white rounded"
                />
                <input
                    placeholder="Link"
                    value={newNoticia.link || ""}
                    onChange={(e) =>
                        setNewNoticia({ ...newNoticia, link: e.target.value })
                    }
                    className="p-2 border border-white rounded"
                />
                <button className="bg-orange-500 px-3 rounded py-2 mb-4 hover:cursor-pointer active:bg-orange-700">
                    Adicionar
                </button>
            </form>

            {noticias.length > 0 && (
                <h3 className="text-lg mt-4 my-2">Notícias cadastradas: </h3>
            )}
            <ul className="space-y-2">
                {noticias.map((n) => (
                    <li key={n.id} className="bg-black/30 p-2 rounded">
                        {editingNoticia?.id === n.id && editingNoticia ? (
                            <form onSubmit={updateNoticia} className="space-y-2">
                                <input
                                    required
                                    placeholder="Título"
                                    value={editingNoticia.titulo}
                                    onChange={(e) =>
                                        setEditingNoticia({
                                            ...editingNoticia,
                                            titulo: e.target.value,
                                            conteudo: editingNoticia.conteudo || "",
                                            link: editingNoticia.link || "",
                                        })
                                    }
                                    className="w-full p-2 border border-white rounded text-white"
                                />
                                <textarea
                                    required
                                    placeholder="Adicione o conteúdo ..."
                                    value={editingNoticia.conteudo}
                                    onChange={(e) =>
                                        setEditingNoticia({
                                            ...editingNoticia,
                                            conteudo: e.target.value,
                                            titulo: editingNoticia.titulo || "",
                                            link: editingNoticia.link || "",
                                        })
                                    }
                                    className="w-full p-2 border border-white rounded text-white"
                                    rows={3}
                                />
                                <input
                                    placeholder="Link"
                                    value={editingNoticia.link || ""}
                                    onChange={(e) =>
                                        setEditingNoticia({
                                            ...editingNoticia,
                                            link: e.target.value,
                                            titulo: editingNoticia.titulo || "",
                                            conteudo: editingNoticia.conteudo || "",
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
                                        onClick={cancelEditNoticia}
                                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{n.titulo}</div>
                                    <div className="text-sm text-gray-300 line-clamp-2">
                                        {n.conteudo}
                                    </div>
                                    {n.link && (
                                        <a
                                            href={n.link}
                                            className="text-blue-500 hover:underline"
                                        >
                                            {n.link}
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditNoticia(n)}
                                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => deleteNoticia(n.id)}
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
export default AdminNoticia;