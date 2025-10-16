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
    const [loading, setLoading] = useState(false)

    // --- Estados para filtro e paginação ---
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 3; const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    // Lógica de filtro
    const filteredNoticias = useMemo(() => {
        if (!filter) return noticias;
        return noticias.filter((noticia) =>
            noticia.titulo.toLowerCase().includes(filter.toLowerCase())
        );
    }, [noticias, filter]);
    const currentNoticias = filteredNoticias.slice(startIndex, endIndex);

    async function load() {
        const n = await fetch("/api/admin/noticias").then((r) => r.json());
        setNoticias(n || []);
    }

    useEffect(() => {
        load();
    }, []);

    async function createNoticia(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/noticias", {
                method: "POST",
                body: JSON.stringify(newNoticia),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error(await res.text());

            setNewNoticia({ titulo: "", conteudo: "", link: "" });
            await load();

            modal.success({
                title: "Sucesso",
                content: "Notícia criada com sucesso!",
                okText: "OK",
            });
        } catch (err) {
            console.error("Erro ao criar notícia:", err);
            modal.error({
                title: "Erro",
                content: "Não foi possível criar a notícia.",
                okText: "OK",
            });
        } finally {
            setLoading(false);
        }
    }

    async function deleteNoticia(id?: number) {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/noticias?id=" + id, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());

            await load();
            modal.success({
                title: "Notícia excluída",
                content: "A notícia foi excluída com sucesso!",
                okText: "OK",
            });
        } catch (err) {
            console.error("Erro ao excluir notícia:", err);
            modal.error({
                title: "Erro ao excluir",
                content: "Não foi possível excluir a notícia.",
                okText: "OK",
            });
        } finally {
            setLoading(false);
        }
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
        setLoading(true);
        try {
            const res = await fetch("/api/admin/noticias", {
                method: "PUT",
                body: JSON.stringify(editingNoticia),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error(await res.text());

            setEditingNoticia(null);
            await load();

            modal.success({
                title: "Notícia atualizada",
                content: "A notícia foi atualizada com sucesso!",
                okText: "OK",
            });
        } catch (err) {
            console.error("Erro ao atualizar notícia:", err);
            modal.error({
                title: "Erro",
                content: "Não foi possível atualizar a notícia.",
                okText: "OK",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="mb-8 w-auto gap-20 bg-black/50 p-4 rounded">
            {contextHolder}
            <ConfigProvider
                theme={{
                    components: {
                        Pagination: {
                            itemBg: "#ffffff40",
                            itemActiveBg: "#ffffff10",
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
                            colorIcon: 'rgba(255, 255, 255, 1)'
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
                    <Button htmlType="submit" loading={loading} style={{ padding: 18, fontSize: '16px', borderRadius: '4px' }}>Adicionar</Button>
                </form>

                {noticias.length > 0 && (
                    <div className="my-4">
                        <h3 className="text-lg mt-4 my-2">Notícias cadastradas: </h3>
                        <Input.Search
                            variant="borderless"
                            placeholder="Filtrar por título..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                        />
                    </div>
                )}

                <ul className="space-y-2">
                    {currentNoticias.map((n) => (
                        <NoticiaCard
                            key={n.id}
                            noticia={editingNoticia?.id === n.id ? editingNoticia! : n}
                            isEditing={editingNoticia?.id === n.id}
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

                {/* --- PAGINAÇÃO --- */}
                {filteredNoticias.length > pageSize && (
                    <div className="flex mt-4 mb-4 w-full justify-center">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredNoticias.length}
                            responsive
                            onChange={(page) => setCurrentPage(page)}
                            className="manual-small-pagination"
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
export default AdminNoticia;