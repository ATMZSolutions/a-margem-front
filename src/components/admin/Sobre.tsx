import { BufferData } from "@/app/admin/AdminClient";
import { useEffect, useState, useMemo, useRef } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import SobreCard from "./subcomponents/SobreCard";

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
    const [uploadingSobreImage, setUploadingSobreImage] = useState<boolean>(false);

    // --- Estados ---
    const [loading, setLoading] = useState(false);
    const [modal, contextHolder] = Modal.useModal();
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [processingEdit, setProcessingEdit] = useState(false);
    const pageSize = 3;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // --- Lógica de Filtro e Paginação ---
    const filteredSobres = useMemo(() => {
        if (!filter.trim()) return sobres;
        return sobres.filter((sobre) =>
            sobre.descricao.toLowerCase().includes(filter.toLowerCase().trim()) ||
            sobre.ano.toString().includes(filter.trim())
        );
    }, [sobres, filter]);

    const currentSobres = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredSobres.slice(startIndex, startIndex + pageSize);
    }, [filteredSobres, currentPage]);

    async function load() {
        try {
            const s = await fetch("/api/admin/sobre").then((r) => r.json());
            const sobresWithImageUrls = (s || []).map((sobre: SobreItem) => ({
                ...sobre,
                imagem: sobre.imagem ? `/api/image/sobre/${sobre.ano}` : null
            }));
            setSobres(sobresWithImageUrls);
        } catch (error) {
            console.error("Falha ao carregar sobre:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar sobre." });
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    // Funções para Sobre
    async function handleSobreImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação básica de tipo de arquivo
        if (!file.type.startsWith('image/')) {
            modal.error({ title: "Erro", content: "Por favor, selecione um arquivo de imagem." });
            return;
        }

        setUploadingSobreImage(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "sobre");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error("Upload falhou");

            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                const imageUpdates = {
                    imagem: data.previewUrl,
                    imageData: data.imageData,
                    imagemTipo: data.imagemTipo
                };

                if (target === 'new') {
                    setNewSobre(prev => ({ ...prev, ...imageUpdates }));
                } else if (target === 'edit' && editingSobre) {
                    setEditingSobre(prev => prev ? { ...prev, ...imageUpdates } : null);
                }
            }
        } catch (error) {
            console.error("Upload failed:", error);
            modal.error({ title: "Erro de Upload", content: "Não foi possível enviar a imagem." });
        } finally {
            setUploadingSobreImage(false);
        }
    }

    async function createSobre(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sobre", {
                method: "POST",
                body: JSON.stringify(newSobre),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao criar ítem");

            setNewSobre({
                ano: new Date().getFullYear(),
                imagem: "",
                descricao: "",
            });
            await load();
            modal.success({ title: "Sucesso", content: "Ítem criado com sucesso!" });

            // Limpa o input de arquivo usando ref
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível criar o ítem." });
        } finally {
            setLoading(false);
        }
    }

    async function deleteSobre(ano: number) {
        modal.confirm({
            title: "Confirmar exclusão",
            content: "Tem certeza que deseja excluir este item do Sobre Nós?",
            okText: "Sim",
            cancelText: "Cancelar",
            onOk: async () => {
                try {
                    const res = await fetch("/api/admin/sobre?ano=" + ano, { method: "DELETE" });
                    if (!res.ok) throw new Error("Falha ao excluir ítem");

                    // Verifica se vai ficar sem itens na página atual após exclusão
                    const willBeEmptyPage = currentSobres.length === 1 && currentPage > 1;

                    await load();

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }
                    modal.success({ title: "Sucesso", content: "ítem excluído com sucesso!" });
                } catch (err) {
                    modal.error({ title: "Erro", content: "Não foi possível excluir o ítem." });
                }
            }
        });
    }

    async function updateSobre(e: React.FormEvent) {
        e.preventDefault();
        if (!editingSobre) return;
        setProcessingEdit(true);

        try {
            const payload = { ...editingSobre };
            if (!payload.imageData) {
                delete payload.imagem;
            }

            const res = await fetch("/api/admin/sobre", {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao atualizar sobre");

            setEditingSobre(null);
            await load();
            modal.success({ title: "Sucesso", content: "Ítem atualizado com sucesso!" });

            // Limpa o input de arquivo usando ref
            if (editFileInputRef.current) {
                editFileInputRef.current.value = '';
            }
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível atualizar o sobre." });
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
                    Sobre
                </h2>

                {/* Formulário de criação */}
                <form onSubmit={createSobre} className="space-y-3 my-3">
                    <input
                        required
                        type="number"
                        placeholder="Ano"
                        value={newSobre.ano}
                        onChange={(e) =>
                            setNewSobre({ ...newSobre, ano: parseInt(e.target.value) })
                        }
                        className="w-full p-2 text-white rounded border border-white bg-transparent"
                    />
                    <textarea
                        required
                        placeholder="Descrição"
                        value={newSobre.descricao}
                        onChange={(e) =>
                            setNewSobre({ ...newSobre, descricao: e.target.value })
                        }
                        className="w-full p-2 text-white rounded border border-white bg-transparent"
                        rows={3}
                    />
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">Imagem:</label>
                        <input
                            ref={fileInputRef}
                            required
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSobreImageUpload(e, 'new')}
                            disabled={uploadingSobreImage}
                            className="w-full p-2 border border-white rounded text-white bg-transparent file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                        />
                        {uploadingSobreImage && (
                            <span className="text-yellow-400">Enviando imagem...</span>
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
                    <Button
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px', width: '100%' }}
                        htmlType="submit"
                        loading={loading || uploadingSobreImage}
                    >
                        Adicionar Sobre
                    </Button>
                </form>

                {/* Filtro e lista de sobre */}
                {sobres.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Sobre cadastrados:</h3>
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
                            placeholder="Filtrar por ano ou descrição..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white/60 hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de sobre usando SobreCard */}
                {currentSobres.length > 0 ? (
                    <ul className="space-y-4">
                        {currentSobres.map((s) => (
                            <SobreCard
                                key={s.ano}
                                editFileRef={editFileInputRef}
                                sobre={editingSobre?.ano === s.ano ? editingSobre! : s}
                                isEditing={editingSobre?.ano === s.ano}
                                processingEdit={processingEdit}
                                uploadingImage={uploadingSobreImage}
                                onEditStart={setEditingSobre}
                                onEditCancel={() => setEditingSobre(null)}
                                onEditChange={(updates) => setEditingSobre(prev => prev ? { ...prev, ...updates } : null)}
                                onEditImageChange={(e) => handleSobreImageUpload(e, 'edit')}
                                onEditSubmit={updateSobre}
                                onDelete={deleteSobre}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-white/60">
                        {filter ? "Nenhum item encontrado para o filtro aplicado." : "Nenhum item cadastrado."}
                    </div>
                )}

                {/* Paginação */}
                {filteredSobres.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            responsive
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredSobres.length}
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

export default AdminSobre;