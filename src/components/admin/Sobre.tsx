import { BufferData } from "@/app/admin/AdminClient";
import { useEffect, useState } from "react";

type SobreItem = {
    ano: number;
    imagem?: string;
    descricao: string;
    imageData?: BufferData;
    imagemTipo?: string;
};

const AdminSobre = () => {
    const [sobres, setSobres] = useState<SobreItem[]>([]);

    // Estados para Sobre
    const [newSobre, setNewSobre] = useState<SobreItem>({
        ano: new Date().getFullYear(),
        imagem: "",
        descricao: "",
    });
    const [editingSobre, setEditingSobre] = useState<SobreItem | null>(null);
    const [uploadingSobreImage, setUploadingSobreImage] =
        useState<boolean>(false);

    async function load() {
        const s = await fetch("/api/admin/sobre").then((r) => r.json());


        const sobresWithImageUrls = (s || []).map((sobre: SobreItem) => ({
            ...sobre,
            imagem: sobre.imagem ? `/api/image/sobre/${sobre.ano}` : null
        }));

        setSobres(sobresWithImageUrls);
    }

    useEffect(() => {
        load();
    }, []);

    // Funções para Sobre
    async function handleSobreImageUpload(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingSobreImage(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "sobre");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                setNewSobre({
                    ...newSobre,
                    imagem: data.previewUrl, // Para mostrar preview
                    imageData: data.imageData, // Dados para salvar no banco
                    imagemTipo: data.imagemTipo
                });
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploadingSobreImage(false);
        }
    }

    async function createSobre(e: React.FormEvent) {
        e.preventDefault();
        await fetch("/api/admin/sobre", {
            method: "POST",
            body: JSON.stringify(newSobre),
            headers: { "Content-Type": "application/json" },
        });
        setNewSobre({
            ano: new Date().getFullYear(),
            imagem: "",
            descricao: "",
        });
        load();
    }

    async function deleteSobre(ano: number) {
        await fetch("/api/admin/sobre?ano=" + ano, { method: "DELETE" });
        load();
    }

    function startEditSobre(sobre: SobreItem) {
        setEditingSobre(sobre);
    }

    function cancelEditSobre() {
        setEditingSobre(null);
    }

    async function updateSobre(e: React.FormEvent) {
        e.preventDefault();
        if (!editingSobre) return;

        await fetch("/api/admin/sobre", {
            method: "PUT",
            body: JSON.stringify(editingSobre),
            headers: { "Content-Type": "application/json" },
        });
        setEditingSobre(null);
        load();
    }

    async function handleEditSobreImageUpload(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const file = e.target.files?.[0];
        if (!file || !editingSobre) return;

        setUploadingSobreImage(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "sobre");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                setEditingSobre({
                    ...editingSobre,
                    imagem: data.previewUrl, // Para mostrar preview
                    imageData: data.imageData, // Dados para salvar no banco
                    imagemTipo: data.imagemTipo
                });
            }
        } catch (error) {
            console.error("Upload failed:", error);
        } finally {
            setUploadingSobreImage(false);
        }
    }

    return (
        <section>
            <h2 className="text-xl border-l-4 my-8 border-orange-500 pl-2 font-semibold">
                Sobre
            </h2>
            <form onSubmit={createSobre} className="space-y-3 my-3">
                <input
                    required
                    type="number"
                    placeholder="Ano"
                    value={newSobre.ano}
                    onChange={(e) =>
                        setNewSobre({ ...newSobre, ano: parseInt(e.target.value) })
                    }
                    className="w-full p-2 text-white rounded border border-white"
                />
                <textarea
                    required
                    placeholder="Descrição"
                    value={newSobre.descricao}
                    onChange={(e) =>
                        setNewSobre({ ...newSobre, descricao: e.target.value })
                    }
                    className="w-full p-2 text-white rounded border border-white"
                    rows={3}
                />
                <div className="space-y-2">
                    <label className="block text-sm font-medium">Imagem:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleSobreImageUpload}
                        className="w-full p-2 border border-white rounded text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                    />
                    {uploadingSobreImage && (
                        <p className="text-sm text-gray-300">Enviando imagem...</p>
                    )}
                    {newSobre.imagem && (
                        <div className="mt-2">
                            <img
                                src={newSobre.imagem}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded border"
                            />
                        </div>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={uploadingSobreImage}
                    className="bg-orange-500 px-3 rounded py-2 mb-4 hover:cursor-pointer active:bg-orange-700 disabled:bg-gray-500"
                >
                    Adicionar Sobre
                </button>
            </form>

            {sobres.length > 0 && (
                <h3 className="text-lg mt-4 my-2">Sobre cadastrados:</h3>
            )}
            <ul className="space-y-2">
                {sobres.map((s) => (
                    <li key={s.ano} className="border border-gray-600 rounded p-3">
                        {editingSobre && editingSobre.ano === s.ano ? (
                            <form onSubmit={updateSobre} className="space-y-2">
                                <input
                                    required
                                    type="number"
                                    value={editingSobre.ano}
                                    onChange={(e) =>
                                        setEditingSobre({
                                            ...editingSobre,
                                            ano: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full p-2 text-white rounded border border-white"
                                />
                                <textarea
                                    required
                                    value={editingSobre.descricao}
                                    onChange={(e) =>
                                        setEditingSobre({
                                            ...editingSobre,
                                            descricao: e.target.value,
                                        })
                                    }
                                    className="w-full p-2 text-white rounded border border-white"
                                    rows={3}
                                />
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">
                                        Imagem:
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={handleEditSobreImageUpload}
                                        className="w-full p-2 border border-white rounded text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                                    />
                                    {uploadingSobreImage && (
                                        <p className="text-sm text-gray-300">
                                            Enviando imagem...
                                        </p>
                                    )}
                                    {editingSobre.imagem && (
                                        <div className="mt-2">
                                            <img
                                                src={editingSobre.imagem}
                                                alt="Preview"
                                                className="w-32 h-32 object-cover rounded border"
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={uploadingSobreImage}
                                        className="bg-green-600 px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-500"
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEditSobre}
                                        className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-start flex-1">
                                    {s.imagem && (
                                        <img
                                            src={s.imagem}
                                            alt={`Sobre ${s.ano}`}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold">Ano {s.ano}</div>
                                        <div className="text-sm text-gray-300 mt-1">
                                            {s.descricao}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => startEditSobre(s)}
                                        className="bg-blue-600 px-2 rounded hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => deleteSobre(s.ano)}
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
export default AdminSobre;