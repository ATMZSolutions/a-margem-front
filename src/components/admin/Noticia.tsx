"use client"
import { useCallback, useEffect, useMemo, useState } from "react";
import NoticiaCard from "./subcomponents/NoticiaCard";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import ModalAdmin from "./ModalAdmin";
import CampoAdmin from "./CampoAdmin";
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
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined);
    const [falhaCarga, setFalhaCarga] = useState<boolean>(false);
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
        setDataLoading(true);
        setFalhaCarga(false);
        try {
            const n = await obterDadosCacheados("admin:noticias", () =>
                buscarJsonAdministrativo<NoticiaItem[]>("/api/admin/noticias")
            );
            setNoticias(n || []);
        } catch (error) {
            console.error("Falha ao carregar notícias:", error);
            setFalhaCarga(true);
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
            okText: "Sim, excluir",
            cancelText: "Cancelar",
            okButtonProps: { danger: true },
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

    function fecharFormularioCriacao() {
        setMostrarFormulario(false);
    }

    async function updateNoticia(e: React.FormEvent) {
        e.preventDefault();
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
            <CabecalhoSecao
                titulo="Notícias"
                descricao="Compartilhe novidades e publicações do coletivo."
                acao="Nova notícia"
                aberto={false}
                desabilitado={falhaCarga}
                aoAlternar={() => setMostrarFormulario(true)}
            />
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-300 bg-white p-4 sm:p-6 2xl:p-5">
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
                {contextHolder}
                {/* Modal de Criação */}
                <ModalAdmin
                    aberto={mostrarFormulario}
                    aoFechar={fecharFormularioCriacao}
                    titulo="Nova notícia"
                    descricao="Preencha os campos abaixo para publicar uma notícia no site."
                >
                    <form onSubmit={createNoticia} className="space-y-4">
                        <CampoAdmin
                            id="noticia-titulo"
                            label="Título"
                            required
                            maxLen={200}
                            proibirHtml
                            value={newNoticia.titulo}
                            onChange={(val) => setNewNoticia({ ...newNoticia, titulo: val })}
                            placeholder="Ex: Espetáculo estreia no Teatro..."
                        />
                        <CampoAdmin
                            id="noticia-conteudo"
                            label="Conteúdo"
                            tipo="textarea"
                            required
                            linhas={6}
                            maxLen={10000}
                            proibirHtml
                            value={newNoticia.conteudo}
                            onChange={(val) => setNewNoticia({ ...newNoticia, conteudo: val })}
                            placeholder="Conteúdo da notícia..."
                        />
                        <CampoAdmin
                            id="noticia-link"
                            label="Link"
                            tipo="url"
                            required
                            maxLen={1000}
                            value={newNoticia.link || ""}
                            onChange={(val) => setNewNoticia({ ...newNoticia, link: val })}
                            placeholder="https://..."
                            ajuda="URL pública onde a notícia foi publicada."
                        />
                        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button
                                onClick={fecharFormularioCriacao}
                                disabled={loading}
                                className="min-h-11"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="min-h-11 px-5"
                            >
                                Publicar notícia
                            </Button>
                        </div>
                    </form>
                </ModalAdmin>

                {/* Modal de Edição */}
                <ModalAdmin
                    aberto={Boolean(editingNoticia)}
                    aoFechar={cancelEditNoticia}
                    titulo="Editar notícia"
                    descricao="Atualize os dados e confirme para salvar as alterações."
                >
                    {editingNoticia && (
                        <form onSubmit={updateNoticia} className="space-y-4">
                            <CampoAdmin
                                id="noticia-edit-titulo"
                                label="Título"
                                required
                                maxLen={200}
                                proibirHtml
                                value={editingNoticia.titulo}
                                onChange={(val) => setEditingNoticia({ ...editingNoticia, titulo: val })}
                                placeholder="Título da notícia"
                            />
                            <CampoAdmin
                                id="noticia-edit-conteudo"
                                label="Conteúdo"
                                tipo="textarea"
                                required
                                linhas={6}
                                maxLen={10000}
                                proibirHtml
                                value={editingNoticia.conteudo}
                                onChange={(val) => setEditingNoticia({ ...editingNoticia, conteudo: val })}
                                placeholder="Conteúdo da notícia"
                            />
                            <CampoAdmin
                                id="noticia-edit-link"
                                label="Link"
                                tipo="url"
                                required
                                maxLen={1000}
                                value={editingNoticia.link || ""}
                                onChange={(val) => setEditingNoticia({ ...editingNoticia, link: val })}
                                placeholder="https://..."
                            />
                            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                                <Button
                                    onClick={cancelEditNoticia}
                                    disabled={processingEdit}
                                    className="min-h-11"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={processingEdit}
                                    className="min-h-11 px-5"
                                >
                                    Salvar alterações
                                </Button>
                            </div>
                        </form>
                    )}
                </ModalAdmin>

                {!falhaCarga && noticias.length > 0 && (
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
                {dataLoading ? (
                    <EstadoLista
                        carregando={true}
                        buscando={false}
                        mensagemVazia=""
                    />
                ) : falhaCarga ? (
                    <div className="py-8 text-center space-y-3">
                        <p role="alert" className="text-sm font-medium text-red-700">
                            Não foi possível carregar as notícias.
                        </p>
                        <button
                            type="button"
                            onClick={() => void load(true)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : currentNoticias.length > 0 ? (
                    <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300 border-t border-slate-300">
                        {currentNoticias.map((n) => (
                            <NoticiaCard
                                key={n.id}
                                noticia={n}
                                processingEdit={processingEdit}
                                onEditStart={startEditNoticia}
                                onDelete={deleteNoticia}
                            />
                        ))}
                    </ul>
                ) : (
                    <EstadoLista
                        carregando={false}
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
