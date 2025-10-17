"use client"
import { BufferData } from "@/app/admin/AdminClient";
import { useEffect, useMemo, useRef, useState } from "react";
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

    // --- Estados ---
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [modal, contextHolder] = Modal.useModal();
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [processingEdit, setProcessingEdit] = useState(false);
    const pageSize = 2;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // --- Lógica de Filtro e Paginação ---
    const filteredLivros = useMemo(() => {
        if (!filter.trim()) return livros;
        return livros.filter((livro) =>
            livro.titulo.toLowerCase().includes(filter.toLowerCase().trim())
        );
    }, [livros, filter]);

    const currentLivros = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredLivros.slice(startIndex, startIndex + pageSize);
    }, [filteredLivros, currentPage]);

    // --- Carregamento de Dados ---
    async function load() {
        setLoading(true);
        try {
            const l = await fetch("/api/admin/livros").then((r) => r.json());
            const livrosWithImageUrls = (l || []).map((livro: LivroItem) => ({
                ...livro,
                imagem: livro.imagem ? `/api/image/livro/${livro.id}?${new Date().getTime()}` : undefined
            }));
            setLivros(livrosWithImageUrls);
        } catch (error) {
            console.error("Falha ao carregar livros:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar livros." });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    // --- Upload de Imagem ---
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação básica de tipo de arquivo
        if (!file.type.startsWith('image/')) {
            modal.error({ title: "Erro", content: "Por favor, selecione um arquivo de imagem." });
            return;
        }

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", { method: "POST", body: formData });
            if (!response.ok) throw new Error("Upload falhou");

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

    // --- CRUD Operations ---
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

            // Limpa o input de arquivo usando ref
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível criar o livro." });
        } finally {
            setLoading(false);
        }
    }

    async function deleteLivro(id?: number) {
        if (!id) return;

        modal.confirm({
            title: "Confirmar exclusão",
            content: "Tem certeza que deseja excluir este livro?",
            okText: "Sim",
            cancelText: "Cancelar",
            onOk: async () => {
                try {
                    const res = await fetch("/api/admin/livros?id=" + id, { method: "DELETE" });
                    if (!res.ok) throw new Error("Falha ao excluir livro");
                    // Verifica se vai ficar sem itens na página atual após exclusão
                    const willBeEmptyPage = currentLivros.length === 1 && currentPage > 1;

                    await load();

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }
                    modal.success({ title: "Sucesso", content: "Livro excluído com sucesso!" });
                } catch (err) {
                    modal.error({ title: "Erro", content: "Não foi possível excluir o livro." });
                }
            }
        });
    }

    async function updateLivro(e: React.FormEvent) {
        e.preventDefault();
        if (!editingLivro) return;
        setProcessingEdit(true);

        const payload = { ...editingLivro };
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
            // Limpa o input de arquivo usando ref
            if (editFileInputRef.current) {
                editFileInputRef.current.value = '';
            }
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível atualizar o livro." });
        } finally {
            setProcessingEdit(false);
        }
    }

    const clearFilter = () => {
        setFilter("");
        setCurrentPage(1);
    };

    return (
        <section className="mb-8 w-auto gap-20 bg-black/50 p-4 rounded">
            {contextHolder}
            <ConfigProvider
                theme={{
                    components: {
                        Pagination: {
                            itemBg: "#ffffff20",
                            itemActiveBg: "#FF6900",
                            colorPrimary: "#ffffffff",
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

                {/* Formulário de criação */}
                <form onSubmit={createLivro} className="space-y-3 my-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                            required
                            placeholder="Título"
                            value={newLivro.titulo}
                            onChange={(e) => setNewLivro({ ...newLivro, titulo: e.target.value })}
                            className="p-2 text-white rounded border border-white bg-transparent placeholder:text-white/45"
                        />
                        <input
                            required
                            placeholder="Autor"
                            value={newLivro.autor}
                            onChange={(e) => setNewLivro({ ...newLivro, autor: e.target.value })}
                            className="p-2 text-white rounded border border-white bg-transparent placeholder:text-white/45"
                        />
                    </div>
                    <textarea
                        required
                        placeholder="Descrição"
                        value={newLivro.descricao}
                        onChange={(e) => setNewLivro({ ...newLivro, descricao: e.target.value })}
                        className="w-full p-2 text-white rounded border border-white bg-transparent placeholder:text-white/45"
                        rows={3}
                    />
                    <div className="flex gap-3 items-center">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            required
                            onChange={(e) => handleImageUpload(e, 'new')}
                            disabled={uploadingImage}
                            className="w-full p-2 border border-white rounded text-white bg-transparent file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                        />
                        {uploadingImage && <span className="text-yellow-400">Enviando...</span>}
                        {newLivro.imagem && (
                            <img src={newLivro.imagem} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        )}
                    </div>
                    <Button
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px', width: '100%' }}
                        htmlType="submit"
                        loading={loading || uploadingImage}
                    >
                        Adicionar Livro
                    </Button>
                </form>

                {/* Lista de livros */}
                {livros.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Livros cadastrados:</h3>
                            {filter && (
                                <Button
                                    size="small"
                                    onClick={clearFilter}
                                    className="text-xs"
                                >
                                    Limpar filtro
                                </Button>
                            )}
                        </div>
                        <Input.Search
                            placeholder="Filtrar por título..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white/60 hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de livros */}
                {currentLivros.length > 0 ? (
                    <ul className="space-y-4">
                        {currentLivros.map((l) => (
                            <LivroCard
                                key={l.id}
                                editFileRef={editFileInputRef}
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
                ) : (
                    <div className="text-center py-8 text-white/60">
                        {filter ? "Nenhum livro encontrado para o filtro aplicado." : "Nenhum livro cadastrado."}
                    </div>
                )}

                {/* Paginação */}
                {filteredLivros.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredLivros.length}
                            responsive
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                            className="custom-pagination"
                            itemRender={(page, type, originalElement) => {
                                const el = originalElement as React.ReactElement<any>;
                                const isActive = el.props?.className?.includes("ant-pagination-item-active");
                                const classes = `text-white hover:text-white ${isActive ? "font-bold" : ""}`;
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