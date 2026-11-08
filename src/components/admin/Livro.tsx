"use client"
import { BufferData } from "@/app/admin/AdminClient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import LivroCard from "./subcomponents/LivroCard";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import CampoImagemAdmin from "./campo-imagem-admin";
import { buscarJsonAdministrativo, invalidarDadosCacheados, lerDadosCacheados, obterDadosCacheados } from "@/lib/cache-administrativo";

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
    const dadosIniciais = lerDadosCacheados<LivroItem[]>("admin:livros");
    const [livros, setLivros] = useState<LivroItem[]>(dadosIniciais ?? []);
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
    const pageSize = 3;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
    const load = useCallback(async (forcarAtualizacao = false) => {
        if (forcarAtualizacao) invalidarDadosCacheados("admin:livros");
        try {
            const livrosComImagens = await obterDadosCacheados("admin:livros", async () => {
                const livros = await buscarJsonAdministrativo<LivroItem[]>("/api/admin/livros");
                return (livros || []).map((livro) => ({
                    ...livro,
                    imagem: livro.imagem ? `/api/image/livro/${livro.id}?${Date.now()}` : undefined,
                }));
            });
            setLivros(livrosComImagens || []);
        } catch (error) {
            console.error("Falha ao carregar livros:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar livros." });
        } finally {
            setDataLoading(false)
        }
    }, [modal]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    // --- Upload de Imagem ---
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação básica de tipo de arquivo
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            modal.error({ title: "Erro", content: "Selecione uma imagem JPEG, PNG ou WebP." });
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
                    imagem: URL.createObjectURL(file),
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
            setMostrarFormulario(false);
            await load(true);
            modal.success({ title: "Sucesso", content: "Livro criado com sucesso!" });

            // Limpa o input de arquivo usando ref
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch {
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

                    await load(true);

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }
                    modal.success({ title: "Sucesso", content: "Livro excluído com sucesso!" });
                } catch {
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
            await load(true);

            modal.success({ title: "Sucesso", content: "Livro atualizado com sucesso!" });
            // Limpa o input de arquivo usando ref
            if (editFileInputRef.current) {
                editFileInputRef.current.value = '';
            }
        } catch {
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
        <section className="space-y-4" aria-labelledby="admin-secao-titulo">
            <CabecalhoSecao titulo="Livros" descricao="Cadastre obras e referências ligadas ao coletivo." acao="Novo livro" aberto={mostrarFormulario} aoAlternar={() => setMostrarFormulario((visivel) => !visivel)} />
            <div className="w-full rounded-xl border border-slate-300 bg-white p-4 sm:p-6 2xl:p-5">
            {contextHolder}
            <ConfigProvider
                theme={{
                    components: {
                        Pagination: {
                            itemBg: "#ffffff",
                            itemActiveBg: "#fff1df",
                            colorPrimary: "#412551",
                            colorText: "#334155",
                            colorPrimaryHover: "#681A01",
                            colorTextDisabled: "#94a3b8",
                            itemLinkBg: "#ffffff",
                        },
                        Button: {
                            defaultBg: "#ffffff",
                            defaultBorderColor: "#cbd5e1",
                            defaultHoverBg: "#f8fafc",
                            defaultHoverBorderColor: "#94a3b8",
                            defaultHoverColor: "#0f172a",
                            defaultColor: "#334155",
                            colorPrimary: "#F38901",
                            colorPrimaryHover: "#FECA55",
                            colorTextLightSolid: "#241c26",
                        },
                        Input: {
                            colorText: '#0f172a',
                            colorTextPlaceholder: '#64748b',
                        }
                    },
                }}
            >
                {/* Formulário de criação */}
                {mostrarFormulario && <form onSubmit={createLivro} className="my-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título
                        <input
                            required
                            value={newLivro.titulo}
                            onChange={(e) => setNewLivro({ ...newLivro, titulo: e.target.value })}
                            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Autor
                        <input
                            required
                            value={newLivro.autor}
                            onChange={(e) => setNewLivro({ ...newLivro, autor: e.target.value })}
                            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                    <textarea
                        required
                        value={newLivro.descricao}
                        onChange={(e) => setNewLivro({ ...newLivro, descricao: e.target.value })}
                        className="w-full min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        rows={4}
                    />
                    </label>
                    <CampoImagemAdmin
                        id="imagem-livro"
                        titulo="Capa do livro"
                        ajuda="Escolha uma imagem para identificar a obra."
                        imagem={newLivro.imagem}
                        textoAlternativo="Prévia da capa do livro"
                        aspecto="retrato"
                        obrigatoria
                        enviando={uploadingImage}
                        referencia={fileInputRef}
                        aoSelecionar={(e) => handleImageUpload(e, "new")}
                    />
                    <Button
                        type="primary"
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px', width: '100%' }}
                        htmlType="submit"
                        loading={loading || uploadingImage}
                    >
                        Publicar livro
                    </Button>
                </form>}

                {/* Lista de livros */}
                {livros.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#19121d]">Livros cadastrados</h3>
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
                            aria-label="Buscar livros por título"
                            placeholder="Filtrar por título..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de livros */}
                {currentLivros.length > 0 ? (
                    <ul className="divide-y divide-slate-300 border-t border-slate-300">
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
                    <EstadoLista
                        carregando={dataLoading}
                        buscando={Boolean(filter)}
                        mensagemVazia="Ainda não há livros. Cadastre o primeiro para começar."
                        textoAcao="Cadastrar primeiro livro"
                        aoCriar={() => setMostrarFormulario(true)}
                    />
                )}

                {/* Paginação */}
                {filteredLivros.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            aria-label="Navegação de páginas de livros"
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredLivros.length}
                            responsive
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                            className="custom-pagination"
                        />
                    </div>
                )}
            </ConfigProvider>
            </div>
        </section>
    )
}

export default AdminLivro;
