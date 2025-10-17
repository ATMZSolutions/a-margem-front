import { useEffect, useState, useMemo } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import ProjetoCard from "./subcomponents/ProjetoCard";

type ProjetoItem = {
    id?: number;
    data: string;
    descricao: string;
};

const AdminProjeto = () => {
    const [projetos, setProjetos] = useState<ProjetoItem[]>([]);
    const [newProjeto, setNewProjeto] = useState<ProjetoItem>({
        data: "",
        descricao: "",
    });
    const [editingProjeto, setEditingProjeto] = useState<ProjetoItem | null>(null);

    // --- Novos Estados ---
    const [loading, setLoading] = useState(false);
    const [modal, contextHolder] = Modal.useModal();
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [processingEdit, setProcessingEdit] = useState(false);
    const pageSize = 3;

    // --- Lógica de Filtro e Paginação ---
    const filteredProjetos = useMemo(() => {
        if (!filter.trim()) return projetos;
        return projetos.filter((projeto) =>
            projeto.descricao.toLowerCase().includes(filter.toLowerCase().trim())
        );
    }, [projetos, filter]);

    const currentProjetos = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredProjetos.slice(startIndex, startIndex + pageSize);
    }, [filteredProjetos, currentPage]);

    async function load() {
        try {
            const p = await fetch("/api/admin/projeto").then((r) => r.json());
            setProjetos(p || []);
        } catch (error) {
            console.error("Falha ao carregar projetos:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar projetos." });
        }
    }

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    // Funções para Projeto
    async function createProjeto(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const dateTimeString = `${newProjeto.data}T00:00:00`;
            const localDate = new Date(dateTimeString);
            const isoString = localDate.toISOString();

            const projetoToCreate = {
                ...newProjeto,
                data: isoString,
            };

            const res = await fetch("/api/admin/projeto", {
                method: "POST",
                body: JSON.stringify(projetoToCreate),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao criar projeto");

            setNewProjeto({ data: "", descricao: "" });
            await load();
            modal.success({ title: "Sucesso", content: "Projeto criado com sucesso!" });
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível criar o projeto." });
        } finally {
            setLoading(false);
        }
    }

    async function deleteProjeto(id?: number) {
        if (!id) return;

        modal.confirm({
            title: "Confirmar exclusão",
            content: "Tem certeza que deseja excluir este projeto?",
            okText: "Sim",
            cancelText: "Cancelar",
            onOk: async () => {
                try {
                    const res = await fetch("/api/admin/projeto?id=" + id, { method: "DELETE" });
                    if (!res.ok) throw new Error("Falha ao excluir projeto");

                    // Verifica se vai ficar sem itens na página atual após exclusão
                    const willBeEmptyPage = currentProjetos.length === 1 && currentPage > 1;

                    await load();

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }
                    modal.success({ title: "Sucesso", content: "Projeto excluído com sucesso!" });
                } catch (err) {
                    modal.error({ title: "Erro", content: "Não foi possível excluir o projeto." });
                }
            }
        });
    }

    function startEditProjeto(projeto: ProjetoItem) {
        setEditingProjeto(projeto);
    }

    function cancelEditProjeto() {
        setEditingProjeto(null);
    }

    async function updateProjeto(e: React.FormEvent) {
        e.preventDefault();
        if (!editingProjeto) return;
        setProcessingEdit(true);

        try {
            const dateTimeString = `${editingProjeto.data.split("T")[0]}T00:00:00`;
            const localDate = new Date(dateTimeString);
            const isoString = localDate.toISOString();

            const projetoToUpdate = {
                ...editingProjeto,
                data: isoString,
            };

            const res = await fetch("/api/admin/projeto", {
                method: "PUT",
                body: JSON.stringify(projetoToUpdate),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao atualizar projeto");

            setEditingProjeto(null);
            await load();
            modal.success({ title: "Sucesso", content: "Projeto atualizado com sucesso!" });
        } catch (err) {
            modal.error({ title: "Erro", content: "Não foi possível atualizar o projeto." });
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
                    Projetos
                </h2>

                {/* Formulário de criação */}
                <form onSubmit={createProjeto} className="space-y-3 my-3">
                    <input
                        required
                        type="date"
                        placeholder="Data"
                        value={newProjeto.data}
                        onChange={(e) =>
                            setNewProjeto({ ...newProjeto, data: e.target.value })
                        }
                        className="w-full p-2 text-white rounded border border-white bg-transparent"
                    />
                    <textarea
                        required
                        placeholder="Descrição"
                        value={newProjeto.descricao}
                        onChange={(e) =>
                            setNewProjeto({ ...newProjeto, descricao: e.target.value })
                        }
                        className="w-full p-2 text-white rounded border border-white bg-transparent"
                        rows={3}
                    />
                    <Button
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px', width: '100%' }}
                        htmlType="submit"
                        loading={loading}
                    >
                        Adicionar Projeto
                    </Button>
                </form>

                {/* Filtro e lista de projetos */}
                {projetos.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Projetos cadastrados:</h3>
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
                            placeholder="Filtrar por descrição..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white/60 hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de projetos */}
                {currentProjetos.length > 0 ? (
                    <ul className="space-y-4">
                        {currentProjetos.map((p) => (
                            <ProjetoCard
                                key={p.id}
                                projeto={editingProjeto?.id === p.id ? editingProjeto! : p}
                                isEditing={editingProjeto?.id === p.id}
                                processingEdit={processingEdit}
                                onEditStart={setEditingProjeto}
                                onEditCancel={() => setEditingProjeto(null)}
                                onEditChange={(updates) => setEditingProjeto(prev => prev ? { ...prev, ...updates } : null)}
                                onEditSubmit={updateProjeto}
                                onDelete={deleteProjeto}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-white/60">
                        {filter ? "Nenhum projeto encontrado para o filtro aplicado." : "Nenhum projeto cadastrado."}
                    </div>
                )}

                {/* Paginação */}
                {filteredProjetos.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            responsive
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredProjetos.length}
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

export default AdminProjeto;