"use client"
import { useEffect, useMemo, useState } from "react";
import NoticiaCard from "./subcomponents/NoticiaCard";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";

export type NoticiaItem = {
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
    const [modal, contextHolder] = Modal.useModal();
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState<boolean>(true)
    const [processingEdit, setProcessingEdit] = useState(false);

    // --- Estados para filtro e paginação ---
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 3;

    // Lógica de filtro
    const filteredNoticias = useMemo(() => {
        if (!filter.trim()) return noticias;
        return noticias.filter((noticia) =>
            noticia.titulo.toLowerCase().includes(filter.toLowerCase().trim())
        );
    }, [noticias, filter]);

    const currentNoticias = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredNoticias.slice(startIndex, startIndex + pageSize);
    }, [filteredNoticias, currentPage]);

    async function load() {
        try {
            const n = await fetch("/api/admin/noticias").then((r) => r.json());
            setNoticias(n || []);
        } catch (error) {
            console.error("Falha ao carregar notícias:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar notícias." });
        } finally {
            setDataLoading(false)
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    async function createNoticia(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/noticias", {
                method: "POST",
                body: JSON.stringify(newNoticia),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao criar notícia");

            setNewNoticia({ titulo: "", conteudo: "", link: "" });
            await load();

            modal.success({
                title: "Sucesso",
                content: "Notícia criada com sucesso!",
            });
        } catch (err) {
            console.error("Erro ao criar notícia:", err);
            modal.error({
                title: "Erro",
                content: "Não foi possível criar a notícia.",
            });
        } finally {
            setLoading(false);
        }
    }

    async function deleteNoticia(id?: number) {
        if (!id) return;

        modal.confirm({
            title: "Confirmar exclusão",
            content: "Tem certeza que deseja excluir esta notícia?",
            okText: "Sim",
            cancelText: "Cancelar",
            onOk: async () => {
                try {
                    const res = await fetch("/api/admin/noticias?id=" + id, { method: "DELETE" });
                    if (!res.ok) throw new Error("Falha ao excluir notícia");

                    // Verifica se vai ficar sem itens na página atual após exclusão
                    const willBeEmptyPage = currentNoticias.length === 1 && currentPage > 1;

                    await load();

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }

                    modal.success({
                        title: "Sucesso",
                        content: "Notícia excluída com sucesso!",
                    });
                } catch (err) {
                    console.error("Erro ao excluir notícia:", err);
                    modal.error({
                        title: "Erro",
                        content: "Não foi possível excluir a notícia.",
                    });
                }
            }
        });
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
        setProcessingEdit(true);
        try {
            const res = await fetch("/api/admin/noticias", {
                method: "PUT",
                body: JSON.stringify(editingNoticia),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao atualizar notícia");

            setEditingNoticia(null);
            await load();

            modal.success({
                title: "Sucesso",
                content: "Notícia atualizada com sucesso!",
            });
        } catch (err) {
            console.error("Erro ao atualizar notícia:", err);
            modal.error({
                title: "Erro",
                content: "Não foi possível atualizar a notícia.",
            });
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
                        className="p-2 border border-white rounded bg-transparent"
                    />
                    <textarea
                        required
                        placeholder="Adicione o conteúdo ..."
                        value={newNoticia.conteudo}
                        onChange={(e) =>
                            setNewNoticia({ ...newNoticia, conteudo: e.target.value })
                        }
                        className="p-2 border border-white rounded bg-transparent"
                    />
                    <input
                        placeholder="Link"
                        type="url"
                        required
                        value={newNoticia.link || ""}
                        onChange={(e) =>
                            setNewNoticia({ ...newNoticia, link: e.target.value })
                        }
                        className="p-2 border border-white rounded bg-transparent"
                    />
                    <Button
                        htmlType="submit"
                        loading={loading}
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px' }}
                    >
                        Adicionar Notícia
                    </Button>
                </form>

                {noticias.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Notícias cadastradas:</h3>
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
                            variant="borderless"
                            placeholder="Filtrar por título..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white/60 hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de notícias */}
                {currentNoticias.length > 0 ? (
                    <ul className="space-y-4">
                        {currentNoticias.map((n) => (
                            <NoticiaCard
                                key={n.id}
                                noticia={editingNoticia?.id === n.id ? editingNoticia! : n}
                                isEditing={editingNoticia?.id === n.id}
                                processingEdit={processingEdit}
                                onEditStart={startEditNoticia}
                                onEditCancel={cancelEditNoticia}
                                onEditChange={(updates) =>
                                    setEditingNoticia((prev) => (prev ? { ...prev, ...updates } : prev))
                                }
                                onEditSubmit={updateNoticia}
                                onDelete={deleteNoticia}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-white/60">
                        {filter
                            ? "Nenhuma notícia encontrada para o filtro aplicado."
                            : dataLoading
                                ? ("Carregando...")
                                : "Nenhuma notícia cadastrada."}
                    </div>
                )}

                {/* --- PAGINAÇÃO --- */}
                {filteredNoticias.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            responsive
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredNoticias.length}
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                            className="custom-pagination"
                            itemRender={(page, type, originalElement) => {
                                const el = originalElement as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
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
export default AdminNoticia;