import { useCallback, useEffect, useState, useMemo } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import ProjetoCard from "./subcomponents/ProjetoCard";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import ModalAdmin from "./ModalAdmin";
import CampoAdmin from "./CampoAdmin";
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
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined);
    const [falhaCarga, setFalhaCarga] = useState<boolean>(false);
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
        setDataLoading(true);
        setFalhaCarga(false);
        try {
            const p = await obterDadosCacheados("admin:projetos", () =>
                buscarJsonAdministrativo<ProjetoItem[]>("/api/admin/projeto")
            );
            setProjetos(p || []);
        } catch (error) {
            console.error("Falha ao carregar projetos:", error);
            setFalhaCarga(true);
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
            okText: "Sim, excluir",
            cancelText: "Cancelar",
            okButtonProps: { danger: true },
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
            <CabecalhoSecao
                titulo="Projetos"
                descricao="Registre ações e iniciativas do coletivo."
                acao="Novo projeto"
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
                    aoFechar={() => setMostrarFormulario(false)}
                    titulo="Novo projeto"
                    descricao="Preencha os campos abaixo para cadastrar um novo projeto."
                >
                    <form onSubmit={createProjeto} className="space-y-4">
                        <CampoAdmin
                            id="projeto-novo-data"
                            label="Data"
                            tipo="date"
                            required
                            value={newProjeto.data}
                            onChange={(val) => setNewProjeto({ ...newProjeto, data: val })}
                        />
                        <CampoAdmin
                            id="projeto-novo-descricao"
                            label="Descrição"
                            tipo="textarea"
                            required
                            linhas={4}
                            maxLen={5000}
                            minLen={5}
                            proibirHtml
                            value={newProjeto.descricao}
                            onChange={(val) => setNewProjeto({ ...newProjeto, descricao: val })}
                            placeholder="Descreva os objetivos, ações e impacto do projeto..."
                        />
                        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button
                                onClick={() => setMostrarFormulario(false)}
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
                                Publicar projeto
                            </Button>
                        </div>
                    </form>
                </ModalAdmin>

                {/* Modal de Edição */}
                <ModalAdmin
                    aberto={Boolean(editingProjeto)}
                    aoFechar={() => setEditingProjeto(null)}
                    titulo="Editar projeto"
                    descricao="Atualize os dados e confirme para salvar as alterações."
                >
                    {editingProjeto && (
                        <form onSubmit={updateProjeto} className="space-y-4">
                            <CampoAdmin
                                id="projeto-edit-data"
                                label="Data"
                                tipo="date"
                                required
                                value={editingProjeto.data.split("T")[0]}
                                onChange={(val) =>
                                    setEditingProjeto({ ...editingProjeto, data: val })
                                }
                            />
                            <CampoAdmin
                                id="projeto-edit-descricao"
                                label="Descrição"
                                tipo="textarea"
                                required
                                linhas={4}
                                maxLen={5000}
                                minLen={5}
                                proibirHtml
                                value={editingProjeto.descricao}
                                onChange={(val) =>
                                    setEditingProjeto({ ...editingProjeto, descricao: val })
                                }
                                placeholder="Descreva os objetivos, ações e impacto do projeto..."
                            />
                            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                                <Button
                                    onClick={() => setEditingProjeto(null)}
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

                {/* Filtro e lista de projetos */}
                {!falhaCarga && projetos.length > 0 && (
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
                {dataLoading ? (
                    <EstadoLista
                        carregando={true}
                        buscando={false}
                        mensagemVazia=""
                    />
                ) : falhaCarga ? (
                    <div className="py-8 text-center space-y-3">
                        <p role="alert" className="text-sm font-medium text-red-700">
                            Não foi possível carregar os projetos.
                        </p>
                        <button
                            type="button"
                            onClick={() => void load(true)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : currentProjetos.length > 0 ? (
                    <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300 border-t border-slate-300">
                        {currentProjetos.map((p) => (
                            <ProjetoCard
                                key={p.id}
                                projeto={p}
                                processingEdit={processingEdit}
                                onEditStart={setEditingProjeto}
                                onDelete={deleteProjeto}
                            />
                        ))}
                    </ul>
                ) : (
                    <EstadoLista
                        carregando={false}
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
