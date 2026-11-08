import { useCallback, useEffect, useState, useMemo } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import ProjetoCard from "./subcomponents/ProjetoCard";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import { buscarJsonAdministrativo, invalidarDadosCacheados, lerDadosCacheados, obterDadosCacheados } from "@/lib/cache-administrativo";

type ProjetoItem = {
    id?: number;
    data: string;
    descricao: string;
};

const AdminProjeto = () => {
    const dadosIniciais = lerDadosCacheados<ProjetoItem[]>("admin:projetos");
    const [projetos, setProjetos] = useState<ProjetoItem[]>(dadosIniciais ?? []);
    const [newProjeto, setNewProjeto] = useState<ProjetoItem>({
        data: "",
        descricao: "",
    });
    const [editingProjeto, setEditingProjeto] = useState<ProjetoItem | null>(null);

    // --- Novos Estados ---
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined)
    const [modal, contextHolder] = Modal.useModal();
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [processingEdit, setProcessingEdit] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

    const load = useCallback(async (forcarAtualizacao = false) => {
        if (forcarAtualizacao) invalidarDadosCacheados("admin:projetos");
        try {
            const p = await obterDadosCacheados("admin:projetos", () =>
                buscarJsonAdministrativo<ProjetoItem[]>("/api/admin/projeto")
            );
            setProjetos(p || []);
        } catch (error) {
            console.error("Falha ao carregar projetos:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar projetos." });
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
            setMostrarFormulario(false);
            await load(true);
            modal.success({ title: "Sucesso", content: "Projeto criado com sucesso!" });
        } catch {
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

                    await load(true);

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }
                    modal.success({ title: "Sucesso", content: "Projeto excluído com sucesso!" });
                } catch {
                    modal.error({ title: "Erro", content: "Não foi possível excluir o projeto." });
                }
            }
        });
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
            await load(true);
            modal.success({ title: "Sucesso", content: "Projeto atualizado com sucesso!" });
        } catch {
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
        <section className="space-y-4" aria-labelledby="admin-secao-titulo">
            <CabecalhoSecao titulo="Projetos" descricao="Registre ações e iniciativas do coletivo." acao="Novo projeto" aberto={mostrarFormulario} aoAlternar={() => setMostrarFormulario((visivel) => !visivel)} />
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
                {mostrarFormulario && <form onSubmit={createProjeto} className="my-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Data
                    <input
                        required
                        type="date"
                        value={newProjeto.data}
                        onChange={(e) =>
                            setNewProjeto({ ...newProjeto, data: e.target.value })
                        }
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                    <textarea
                        required
                        value={newProjeto.descricao}
                        onChange={(e) =>
                            setNewProjeto({ ...newProjeto, descricao: e.target.value })
                        }
                        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        rows={4}
                    />
                    </label>
                    <Button
                        type="primary"
                        style={{ padding: 18, fontSize: '16px', borderRadius: '4px', width: '100%' }}
                        htmlType="submit"
                        loading={loading}
                    >
                        Publicar projeto
                    </Button>
                </form>}

                {/* Filtro e lista de projetos */}
                {projetos.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#19121d]">Projetos cadastrados</h3>
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
                            aria-label="Buscar projetos por descrição"
                            placeholder="Filtrar por descrição..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de projetos */}
                {currentProjetos.length > 0 ? (
                    <ul className="divide-y divide-slate-300 border-t border-slate-300">
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
                    <EstadoLista
                        carregando={dataLoading}
                        buscando={Boolean(filter)}
                        mensagemVazia="Ainda não há projetos. Crie o primeiro para começar."
                        textoAcao="Criar primeiro projeto"
                        aoCriar={() => setMostrarFormulario(true)}
                    />
                )}

                {/* Paginação */}
                {filteredProjetos.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            aria-label="Navegação de páginas de projetos"
                            responsive
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredProjetos.length}
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

export default AdminProjeto;
