"use client";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import { useCallback, useEffect, useState } from "react";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import AgendaCard from "./subcomponents/AgendaCard";
import { buscarJsonAdministrativo, invalidarDadosCacheados, lerDadosCacheados, obterDadosCacheados } from "@/lib/cache-administrativo";

type AgendaItem = {
    id?: number;
    titulo: string;
    data: string;
    local?: string;
    cidade?: string;
};

const AdminAgenda = () => {
    const dadosIniciais = lerDadosCacheados<AgendaItem[]>("admin:agenda");
    const [agendas, setAgendas] = useState<AgendaItem[]>(dadosIniciais ?? []);
    const [newAgenda, setNewAgenda] = useState<AgendaItem>({
        titulo: "",
        data: "",
        local: "",
        cidade: "",
    });
    const [agendaTime, setAgendaTime] = useState<string>("19:00");
    const [editingAgenda, setEditingAgenda] = useState<AgendaItem | null>(null);
    const [editingAgendaTime, setEditingAgendaTime] = useState<string>("19:00");
    const [loading, setLoading] = useState<boolean>(false);
    const [processingEdit, setProcessingEdit] = useState<boolean>(false);
    const [filterText, setFilterText] = useState<string>("");
    const [modal, contextHolder] = Modal.useModal();
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // --- PAGINAÇÃO ---
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 3;

    const load = useCallback(async (forcarAtualizacao = false) => {
        if (forcarAtualizacao) invalidarDadosCacheados("admin:agenda");
        try {
            const a = await obterDadosCacheados("admin:agenda", () =>
                buscarJsonAdministrativo<AgendaItem[]>("/api/admin/agenda")
            );
            setAgendas(a || []);
        } catch (error) {
            console.error("Falha ao carregar agenda:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar agenda." });
        } finally {
            setDataLoading(false)
        }
    }, [modal]);

    useEffect(() => {
        void load();
    }, [load]);

    const clearFilter = () => {
        setFilterText("");
        setCurrentPage(1);
    };

    // --- CRIAR ---
    async function createAgenda(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const dateTimeString = `${newAgenda.data}T${agendaTime}:00`;
            const localDate = new Date(dateTimeString);
            const isoString = localDate.toISOString();
            const agendaToCreate = { ...newAgenda, data: isoString };

            const res = await fetch("/api/admin/agenda", {
                method: "POST",
                body: JSON.stringify(agendaToCreate),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(await res.text());

            setNewAgenda({ titulo: "", data: "", local: "", cidade: "" });
            setAgendaTime("19:00");
            setMostrarFormulario(false);
            await load(true);

            modal.success({
                title: "Sucesso",
                content: "Agenda criada com sucesso!",
                okText: "OK",
            });
        } catch (err) {
            console.error("Erro ao criar agenda:", err);
            modal.error({
                title: "Erro",
                content: "Não foi possível criar a agenda.",
                okText: "OK",
            });
        } finally {
            setLoading(false);
        }
    }

    // --- EXCLUIR COM CONFIRMAÇÃO ---
    function confirmDelete(id?: number) {
        if (!id) return;
        modal.confirm({
            title: "Confirmar exclusão",
            content: "Deseja realmente excluir esta agenda?",
            okText: "Excluir",
            cancelText: "Cancelar",
            okButtonProps: { danger: true },
            onOk: () => deleteAgenda(id),
        });
    }

    async function deleteAgenda(id?: number) {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/agenda?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());

            const willBeEmptyPage = currentAgendas.length === 1 && currentPage > 1;
            await load(true);

            if (willBeEmptyPage) setCurrentPage(currentPage - 1);

            modal.success({
                title: "Agenda excluída",
                content: "A agenda foi excluída com sucesso!",
                okText: "OK",
            });
        } catch (err) {
            console.error("Erro ao excluir agenda:", err);
            modal.error({
                title: "Erro ao excluir",
                content: "Não foi possível excluir a agenda.",
                okText: "OK",
            });
        } finally {
            setLoading(false);
        }
    }

    // --- EDITAR ---
    function startEditAgenda(agenda: AgendaItem) {
        setEditingAgenda(agenda);
        const date = new Date(agenda.data);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        setEditingAgendaTime(`${hours}:${minutes}`);
    }

    function cancelEditAgenda() {
        setEditingAgenda(null);
        setEditingAgendaTime("19:00");
    }

    async function updateAgenda(e: React.FormEvent) {
        e.preventDefault();
        if (!editingAgenda) return;
        setProcessingEdit(true);
        try {
            const currentDate = new Date(editingAgenda.data);
            const dateOnly = currentDate.toISOString().split("T")[0];
            const dateTimeString = `${dateOnly}T${editingAgendaTime}:00`;
            const localDate = new Date(dateTimeString);
            const isoString = localDate.toISOString();

            const agendaToUpdate = { ...editingAgenda, data: isoString };
            const res = await fetch("/api/admin/agenda", {
                method: "PUT",
                body: JSON.stringify(agendaToUpdate),
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error(await res.text());

            setEditingAgenda(null);
            setEditingAgendaTime("19:00");
            await load(true);

            modal.success({
                title: "Agenda atualizada",
                content: "A agenda foi atualizada com sucesso!",
                okText: "OK",
            });
        } catch (err) {
            console.error("Erro ao atualizar agenda:", err);
            modal.error({
                title: "Erro",
                content: "Não foi possível atualizar a agenda.",
                okText: "OK",
            });
        } finally {
            setProcessingEdit(false);
        }
    }

    // --- FILTRO POR TEXTO ---
    const filteredAgendas = agendas.filter((a) => {
        if (!filterText) return true;
        const query = filterText.toLowerCase();
        return (
            a.titulo.toLowerCase().includes(query) ||
            (a.cidade?.toLowerCase().includes(query) ?? false) ||
            (a.local?.toLowerCase().includes(query) ?? false)
        );
    });

    // --- PAGINAÇÃO ---
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentAgendas = filteredAgendas.slice(startIndex, endIndex);

    return (
        <section className="space-y-4" aria-labelledby="admin-secao-titulo">
            <CabecalhoSecao titulo="Agenda" descricao="Organize apresentações e eventos do coletivo." acao="Nova agenda" aberto={mostrarFormulario} aoAlternar={() => setMostrarFormulario((visivel) => !visivel)} />
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
                            colorText: "#0f172a",
                            colorTextPlaceholder: "#64748b",
                        },
                    },
                }}
            >
                {/* FORMULÁRIO DE CRIAÇÃO */}
                {mostrarFormulario && <form
                    onSubmit={createAgenda}
                    className="my-5 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-900 sm:p-5"
                >
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título
                    <input
                        required
                        value={newAgenda.titulo}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, titulo: e.target.value })
                        }
                        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Data
                        <input
                            required
                            type="date"
                            value={newAgenda.data}
                            onChange={(e) =>
                                setNewAgenda({ ...newAgenda, data: e.target.value })
                            }
                            className="min-h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Horário
                        <input
                            aria-label="Horário"
                            type="time"
                            value={agendaTime}
                            onChange={(e) => setAgendaTime(e.target.value)}
                            className="min-h-11 min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Cidade
                    <input
                        value={newAgenda.cidade}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, cidade: e.target.value })
                        }
                        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Local
                    <input
                        value={newAgenda.local}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, local: e.target.value })
                        }
                        className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        style={{ padding: 18, fontSize: "16px", borderRadius: "4px" }}
                    >
                        Publicar agenda
                    </Button>
                </form>}

                {/* Filtro e lista de projetos */}
                {agendas.length > 0 ? (
            <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#19121d]">Agendas cadastradas</h3>
                            {filterText && (
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
                            aria-label="Buscar na agenda por título, cidade ou local"
                            placeholder="Digite parte do título, cidade ou local..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                ) : (
                    <EstadoLista
                        carregando={dataLoading}
                        buscando={Boolean(filterText)}
                        mensagemVazia="Ainda não há agendas. Crie a primeira para começar."
                        textoAcao="Criar primeira agenda"
                        aoCriar={() => setMostrarFormulario(true)}
                    />
                )}

                {/* LISTAGEM */}
                <ul className="divide-y divide-slate-300 border-t border-slate-300">
                    {currentAgendas.map((a) => (
                        <AgendaCard
                            key={a.id}
                            agenda={editingAgenda?.id === a.id ? editingAgenda! : a}
                            isEditing={editingAgenda?.id === a.id}
                            editingAgendaTime={editingAgendaTime}
                            loading={loading}
                            processingEdit={processingEdit}
                            onEditStart={startEditAgenda}
                            onEditCancel={cancelEditAgenda}
                            onEditSubmit={updateAgenda}
                            onEditChange={(updates) =>
                                setEditingAgenda((prev) => (prev ? { ...prev, ...updates } : prev))
                            }
                            onTimeChange={setEditingAgendaTime}
                            onDelete={confirmDelete}
                        />
                    ))}
                </ul>
                {filteredAgendas.length === 0 && agendas.length > 0 && (
                    <EstadoLista
                        carregando={false}
                        buscando={Boolean(filterText)}
                        mensagemVazia="Ainda não há agendas. Crie a primeira para começar."
                        textoAcao="Criar primeira agenda"
                        aoCriar={() => setMostrarFormulario(true)}
                    />
                )}

                {/* PAGINAÇÃO */}
                {filteredAgendas.length > pageSize && (
                    <div className="flex mt-4 w-full justify-center">
                        <Pagination
                            aria-label="Navegação de páginas da agenda"
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredAgendas.length}
                            responsive
                            onChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </ConfigProvider>
            </div>
        </section>
    );
};

export default AdminAgenda;
