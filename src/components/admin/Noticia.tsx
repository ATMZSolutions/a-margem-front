"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import NoticiaCard from "./subcomponents/NoticiaCard";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import { buscarJsonAdministrativo, invalidarDadosCacheados, lerDadosCacheados, obterDadosCacheados } from "@/lib/cache-administrativo";

export type NoticiaItem = {
    id?: number;
    titulo: string;
    conteudo: string;
    link: string;
};

const AdminNoticia = () => {
    const dadosIniciais = lerDadosCacheados<NoticiaItem[]>("admin:noticias");
    const [noticias, setNoticias] = useState<NoticiaItem[]>(dadosIniciais ?? []);
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
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined)
    const [processingEdit, setProcessingEdit] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

    const load = useCallback(async (forcarAtualizacao = false) => {
        if (forcarAtualizacao) invalidarDadosCacheados("admin:noticias");
        try {
            const n = await obterDadosCacheados("admin:noticias", () =>
                buscarJsonAdministrativo<NoticiaItem[]>("/api/admin/noticias")
            );
            setNoticias(n || []);
        } catch (error) {
            console.error("Falha ao carregar notícias:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar notícias." });
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
            setMostrarFormulario(false);
            await load(true);

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

                    await load(true);

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
            await load(true);

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
        <section className="space-y-4" aria-labelledby="admin-secao-titulo">
            <CabecalhoSecao titulo="Notícias" descricao="Compartilhe novidades e publicações do coletivo." acao="Nova notícia" aberto={mostrarFormulario} aoAlternar={() => setMostrarFormulario((visivel) => !visivel)} />
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
                {mostrarFormulario && <form
                    onSubmit={createNoticia}
                    className="my-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 sm:p-5"
                >
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título
                    <input
                        required
                        value={newNoticia.titulo}
                        onChange={(e) =>
                            setNewNoticia({ ...newNoticia, titulo: e.target.value })
                        }
                        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Conteúdo
                    <textarea
                        required
                        value={newNoticia.conteudo}
                        onChange={(e) =>
                            setNewNoticia({ ...newNoticia, conteudo: e.target.value })
                        }
                        rows={6}
                        className="min-h-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Link
                    <input
                        type="url"
                        required
                        value={newNoticia.link || ""}
                        onChange={(e) =>
                            setNewNoticia({ ...newNoticia, link: e.target.value })
                        }
                        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px' }}
                    >
                        Publicar notícia
                    </Button>
                </form>}

                {noticias.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#19121d]">Notícias cadastradas</h3>
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
                            aria-label="Buscar notícias por título"
                            variant="borderless"
                            placeholder="Filtrar por título..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de notícias */}
                {currentNoticias.length > 0 ? (
                    <ul className="divide-y divide-slate-300 border-t border-slate-300">
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
                    <EstadoLista
                        carregando={dataLoading}
                        buscando={Boolean(filter)}
                        mensagemVazia="Ainda não há notícias. Crie a primeira para começar."
                        textoAcao="Criar primeira notícia"
                        aoCriar={() => setMostrarFormulario(true)}
                    />
                )}

                {/* --- PAGINAÇÃO --- */}
                {filteredNoticias.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            aria-label="Navegação de páginas de notícias"
                            responsive
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredNoticias.length}
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
export default AdminNoticia;
