"use client"
import { BufferData } from "@/app/admin/AdminClient";
import { useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import LivroCard from "./subcomponents/LivroCard"; 

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

    // --- Novos Estados ---
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [modal, contextHolder] = Modal.useModal();
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 2;
    const [processingEdit, setProcessingEdit] = useState(false);

    // --- Lógica de Filtro e Paginação ---
    const filteredLivros = useMemo(() => {
        if (!filter) return livros;
        return livros.filter((livro) =>
            livro.titulo.toLowerCase().includes(filter.toLowerCase())
        );
    }, [livros, filter]);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentLivros = filteredLivros.slice(startIndex, endIndex);

    // --- Carregamento de Dados ---
    async function load() {
        try {
            const l = await fetch("/api/admin/livros").then((r) => r.json());
            const livrosWithImageUrls = (l || []).map((livro: LivroItem) => ({
                ...livro,
                imagem: livro.imagem ? `/api/image/livro/${livro.id}?${new Date().getTime()}` : undefined
            }));
            setLivros(livrosWithImageUrls);
        } catch (error) {
            console.error("Falha ao carregar livros:", error);
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                const imageUpdates = {
                    imagem: data.previewUrl,
                    imageData: data.imageData,
                    imagemTipo: data.imagemTipo
                };
                if (target === 'new') {
                    setNewLivro(prev => ({ ...prev, ...imageUpdates }));
                } else if (target === 'edit' && editingLivro) {
                    setEditingLivro(prev => prev ? { ...prev, ...imageUpdates } : null);
                }
            }
        } catch (error) {
            console.error("Upload failed:", error);
            modal.error({ title: "Erro de Upload", content: "Não foi possível enviar a imagem." });
        } finally {
            setUploadingImage(false);
        }
    }

    async function createLivro(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/livros", {
                method: "POST",
                body: JSON.stringify(newLivro),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Falha ao criar livro");
            setNewLivro({ titulo: "", autor: "", descricao: "", imagem: "" });
            await load();
            modal.success({ title: "Sucesso", content: "Livro criado com sucesso!" });
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível criar o livro." });
        } finally {
            setLoading(false);
        }
    }

    async function deleteLivro(id?: number) {
        if (!id) return;

        try {
            const res = await fetch("/api/admin/livros?id=" + id, { method: "DELETE" });
            if (!res.ok) throw new Error("Falha ao excluir livro");
            await load();
            modal.success({ title: "Sucesso", content: "Livro excluído com sucesso!" });
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível excluir o livro." });
        }
    }

    async function updateLivro(e: React.FormEvent) {
        e.preventDefault();
        if (!editingLivro) return;
        setProcessingEdit(true)

        const payload = { ...editingLivro };

        // Se não há nova imagem, não envia o campo 'imagem' com a URL de preview.
        if (!payload.imageData) {
            delete payload.imagem;
        }

        try {
            const res = await fetch("/api/admin/livros", {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Falha ao atualizar livro");
            setEditingLivro(null);
            await load();
            modal.success({ title: "Sucesso", content: "Livro atualizado com sucesso!" });
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível atualizar o livro." });
        } finally {
            setProcessingEdit(false);
        }
    }

    return (
        <section className="mb-8 w-auto gap-20 bg-black/50 p-4 rounded">
            {contextHolder}
            <ConfigProvider
                theme={{
                    components: {
                        Pagination: {
                            itemBg: "#ffffff20",
                            itemActiveBg: "#FF6900",
                            colorPrimary: "#FF6900",
                            colorText: "white", 
                            colorPrimaryHover: "#ffa366",
                            colorTextDisabled: "rgba(255,255,255,0.3)",
                            itemLinkBg: "transparent",
                        },
                        Button: {
                            defaultBg: "#FF6900",
                            defaultBorderColor: "#FF6900",
                            defaultHoverBg: "#e05900",
                            defaultHoverBorderColor: "#e05900",
                            defaultHoverColor: "white",
                            defaultColor: "white",
                        },
                        Input: {
                            colorText: 'white',
                            colorTextPlaceholder: 'rgba(255, 255, 255, 0.45)',
                        }
                    },
                }}
            >
                <h2 className="text-xl border-l-4 my-4 border-orange-500 pl-2 font-semibold">
                    Livros
                </h2>
                <form onSubmit={createLivro} className="space-y-3 my-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input required placeholder="Título" value={newLivro.titulo} onChange={(e) => setNewLivro({ ...newLivro, titulo: e.target.value })} className="p-2 text-white rounded border border-white" />
                        <input required placeholder="Autor" value={newLivro.autor} onChange={(e) => setNewLivro({ ...newLivro, autor: e.target.value })} className="p-2 text-white rounded border border-white" />
                    </div>
                    <textarea required placeholder="Descrição" value={newLivro.descricao} onChange={(e) => setNewLivro({ ...newLivro, descricao: e.target.value })} className="w-full p-2 text-white rounded border border-white" rows={3} />
                    <div className="flex gap-3 items-center">
                        <input type="file" accept="image/*" required onChange={(e) => handleImageUpload(e, 'new')} disabled={uploadingImage} className="p-2 text-white bg-gray-700 rounded text-sm" />
                        {uploadingImage && <span className="text-yellow-400">Enviando...</span>}
                        {newLivro.imagem && <img src={newLivro.imagem} alt="Preview" className="w-12 h-12 object-cover rounded" />}
                    </div>
                    <Button
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px', width: '100%' }}
                        htmlType="submit" loading={loading || uploadingImage}>Criar Livro</Button>
                </form>

                {livros.length > 0 && (
                    <div className="my-4">
                        <h3 className="text-lg mt-4 my-2">Livros cadastrados:</h3>
                        <Input.Search
                            placeholder="Filtrar por título..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white/60 hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                            variant="borderless"
                        />
                    </div>
                )}

                <ul className="space-y-2">
                    {currentLivros.map((l) => (
                        <LivroCard
                            key={l.id}
                            livro={editingLivro?.id === l.id ? editingLivro! : l}
                            isEditing={editingLivro?.id === l.id}
                            processingEdit={processingEdit}
                            uploadingImage={uploadingImage}
                            onEditStart={setEditingLivro}
                            onEditCancel={() => setEditingLivro(null)}
                            onEditChange={(updates) => setEditingLivro(prev => prev ? { ...prev, ...updates } : null)}
                            onEditImageChange={(e) => handleImageUpload(e, 'edit')}
                            onEditSubmit={updateLivro}
                            onDelete={deleteLivro}
                        />
                    ))}
                </ul>

                {filteredLivros.length > pageSize && (
                    <div className="flex mt-4 mb-4 w-full justify-center">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredLivros.length}
                            onChange={(page) => setCurrentPage(page)}
                            itemRender={(page, type, originalElement) => {
                                const el = originalElement as React.ReactElement<any>;
                                const isActive = el.props?.className?.includes("ant-pagination-item-active");
                                const classes = `text-white !text-white hover:text-white ${isActive ? "font-bold !text-white" : ""}`;
                                if (type === "page") return <a className={classes}>{page}</a>;
                                return <a className={classes}>{el.props?.children}</a>;
                            }}
                        />
                    </div>
                )}
            </ConfigProvider>
        </section>
    )
}

export default AdminLivro;