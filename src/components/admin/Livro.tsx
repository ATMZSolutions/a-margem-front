import { BufferData } from "@/app/admin/AdminClient";
import { useEffect, useState } from "react";

type LivroItem = {
    id?: number;
    titulo: string;
    autor: string;
    descricao: string;
    imagem?: string;
    imageData?: BufferData;
    imagemTipo?: string;
};

const AdminLivro = () => {
    const [livros, setLivros] = useState<LivroItem[]>([]);
    const [newLivro, setNewLivro] = useState<LivroItem>({
        titulo: "",
        autor: "",
        descricao: "",
        imagem: "",
    });
    const [editingLivro, setEditingLivro] = useState<LivroItem | null>(null);
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);

    async function load() {
        const l = await fetch("/api/admin/livros").then((r) => r.json());

        // Para livros e sobre, converter as imagens para URLs da API se existem
        const livrosWithImageUrls = (l || []).map((livro: LivroItem) => ({
            ...livro,
            imagem: livro.imagem ? `/api/image/livro/${livro.id}` : null
        }));

        setLivros(livrosWithImageUrls);
    }

    useEffect(() => {
        load();
    }, []);

    // Livro functions
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                setNewLivro({
                    ...newLivro,
                    imagem: data.previewUrl, // Para mostrar preview
                    imageData: data.imageData, // Dados para salvar no banco
                    imagemTipo: data.imagemTipo
                });
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploadingImage(false);
        }
    }

    async function createLivro(e: React.FormEvent) {
        e.preventDefault();
        await fetch("/api/admin/livros", {
            method: "POST",
            body: JSON.stringify(newLivro),
            headers: { "Content-Type": "application/json" },
        });
        setNewLivro({ titulo: "", autor: "", descricao: "", imagem: "" });
        load();
    }

    async function deleteLivro(id?: number) {
        if (!id) return;
        await fetch("/api/admin/livros?id=" + id, { method: "DELETE" });
        load();
    }

    function startEditLivro(livro: LivroItem) {
        setEditingLivro(livro);
    }

    function cancelEditLivro() {
        setEditingLivro(null);
    }

    async function updateLivro(e: React.FormEvent) {
        e.preventDefault();
        if (!editingLivro) return;

        await fetch("/api/admin/livros", {
            method: "PUT",
            body: JSON.stringify(editingLivro),
            headers: { "Content-Type": "application/json" },
        });
        setEditingLivro(null);
        load();
    }

    async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !editingLivro) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                setEditingLivro({
                    ...editingLivro,
                    imagem: data.previewUrl, // Para mostrar preview
                    imageData: data.imageData, // Dados para salvar no banco
                    imagemTipo: data.imagemTipo
                });
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploadingImage(false);
        }
    }

    return (
        <section>
            <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
                Livros
            </h2>
            <form onSubmit={createLivro} className="space-y-3 my-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                        required
                        placeholder="Título"
                        value={newLivro.titulo}
                        onChange={(e) =>
                            setNewLivro({ ...newLivro, titulo: e.target.value })
                        }
                        className="p-2 text-white rounded border border-white"
                    />
                    <input
                        required
                        placeholder="Autor"
                        value={newLivro.autor}
                        onChange={(e) =>
                            setNewLivro({ ...newLivro, autor: e.target.value })
                        }
                        className="p-2 text-white rounded border border-white"
                    />
                </div>
                <textarea
                    required
                    placeholder="Descrição"
                    value={newLivro.descricao}
                    onChange={(e) =>
                        setNewLivro({ ...newLivro, descricao: e.target.value })
                    }
                    className="w-full p-2 text-white rounded border border-white"
                    rows={3}
                />
                <div className="flex gap-3 items-center">
                    <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="p-2 text-white bg-gray-700 rounded"
                    />
                    {uploadingImage && (
                        <span className="text-yellow-400">Enviando...</span>
                    )}
                    {newLivro.imagem && (
                        <img
                            src={newLivro.imagem}
                            alt="Preview"
                            className="w-12 h-12 object-cover rounded"
                        />
                    )}
                </div>
                <button
                    type="submit"
                    className="bg-orange-500 px-3 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
                    disabled={uploadingImage}
                >
                    Criar Livro
                </button>
            </form>

            {livros.length > 0 && (
                <h3 className="text-lg mt-4 my-2">Livros cadastrados: </h3>
            )}
            <ul className="space-y-2">
                {livros.map((l) => (
                    <li key={l.id} className="bg-black/30 p-2 rounded">
                        {editingLivro?.id === l.id && editingLivro ? (
                            <form onSubmit={updateLivro} className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        required
                                        placeholder="Título"
                                        value={editingLivro.titulo}
                                        onChange={(e) =>
                                            setEditingLivro({
                                                ...editingLivro,
                                                titulo: e.target.value,
                                                autor: editingLivro.autor || "",
                                                descricao: editingLivro.descricao || "",
                                            })
                                        }
                                        className="p-2 text-white rounded border border-white"
                                    />
                                    <input
                                        required
                                        placeholder="Autor"
                                        value={editingLivro.autor}
                                        onChange={(e) =>
                                            setEditingLivro({
                                                ...editingLivro,
                                                autor: e.target.value,
                                                titulo: editingLivro.titulo || "",
                                                descricao: editingLivro.descricao || "",
                                            })
                                        }
                                        className="p-2 text-white rounded border border-white"
                                    />
                                </div>
                                <textarea
                                    required
                                    placeholder="Descrição"
                                    value={editingLivro.descricao}
                                    onChange={(e) =>
                                        setEditingLivro({
                                            ...editingLivro,
                                            descricao: e.target.value,
                                            titulo: editingLivro.titulo || "",
                                            autor: editingLivro.autor || "",
                                        })
                                    }
                                    className="w-full p-2 text-white rounded border border-white"
                                    rows={3}
                                />
                                <div className="flex gap-3 items-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageUpload}
                                        disabled={uploadingImage}
                                        className="p-2 text-white bg-gray-700 rounded"
                                    />
                                    {uploadingImage && (
                                        <span className="text-yellow-400">Enviando...</span>
                                    )}
                                    {editingLivro.imagem && (
                                        <img
                                            src={editingLivro.imagem}
                                            alt="Preview"
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                                        disabled={uploadingImage}
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEditLivro}
                                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start flex-1">
                                    {l.imagem && (
                                        <img
                                            src={l.imagem}
                                            alt={l.titulo}
                                            className="w-16 h-20 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold">{l.titulo}</div>
                                        <div className="text-sm text-gray-300">
                                            por {l.autor}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {l.descricao}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditLivro(l)}
                                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => deleteLivro(l.id)}
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
export default AdminLivro;