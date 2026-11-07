"use client";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import { useEffect, useState } from "react";
import AgendaCard from "./subcomponents/AgendaCard";

type AgendaItem = {
    id?: number;
    titulo: string;
    data: string;
    local?: string;
    cidade?: string;
};

const AdminAgenda = () => {
    const [agendas, setAgendas] = useState<AgendaItem[]>([]);
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
    const [dataLoading, setDataLoading] = useState<boolean>(true);

    // --- PAGINAÇÃO ---
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 3;

    async function load() {
        try {
            const a = await fetch("/api/admin/agenda").then((r) => r.json());
            setAgendas(a || []);
        } catch (error) {
            console.error("Falha ao carregar agenda:", error);
            modal.error({ title: "Erro", content: "Falha ao carregar agenda." });
        } finally {
            setDataLoading(false)
        }
    }

    useEffect(() => {
        load();
    }, []);

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
            await load();

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
            await load();

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
            await load();

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
        <section className="mb-8 w-auto gap-20 bg-black/50 p-4 rounded">
            {contextHolder}
            <h2 className="text-xl border-l-4 border-orange-500 pl-2 font-semibold">
                Agendas
            </h2>
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
                            colorText: "white",
                            colorTextPlaceholder: "rgba(255, 255, 255, 0.45)",
                        },
                    },
                }}
            >
                {/* FORMULÁRIO DE CRIAÇÃO */}
                <form
                    onSubmit={createAgenda}
                    className="flex flex-col gap-2 my-3 text-white"
                >
                    <input
                        required
                        placeholder="Título"
                        value={newAgenda.titulo}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, titulo: e.target.value })
                        }
                        className="p-2 border border-white rounded"
                    />
                    <div className="flex gap-2 w-full">
                        <input
                            required
                            type="date"
                            value={newAgenda.data}
                            onChange={(e) =>
                                setNewAgenda({ ...newAgenda, data: e.target.value })
                            }
                            className="p-2 border border-white rounded flex-1 min-w-0"
                        />
                        <input
                            type="time"
                            value={agendaTime}
                            onChange={(e) => setAgendaTime(e.target.value)}
                            className="p-2 border border-white rounded flex-1 min-w-0"
                        />
                    </div>
                    <input
                        placeholder="Cidade"
                        value={newAgenda.cidade}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, cidade: e.target.value })
                        }
                        className="p-2 border border-white rounded"
                    />
                    <input
                        placeholder="Local"
                        value={newAgenda.local}
                        onChange={(e) =>
                            setNewAgenda({ ...newAgenda, local: e.target.value })
                        }
                        className="p-2 border border-white rounded"
                    />
                    <Button
                        htmlType="submit"
                        loading={loading}
                        style={{ padding: 18, fontSize: "16px", borderRadius: "4px" }}
                    >
                        Adicionar Agenda
                    </Button>
                </form>

                {/* Filtro e lista de projetos */}
                {agendas.length > 0 ? (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold">Agendas cadastradas:</h3>
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
                            placeholder="Digite parte do título, cidade ou local..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-white/60 hover:[&_.ant-input-search-button_.anticon]:!text-white border border-white rounded"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                ) : (
                    <div className="text-center py-8 text-white/60">
                        {filterText
                            ? "Nenhuma agenda encontrada para o filtro aplicado."
                            : dataLoading
                                ? ("Carregando...")
                                : "Nenhuma agenda cadastrado."}
                    </div>
                )}

                {/* LISTAGEM */}
                <ul className="space-y-2">
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

                {/* PAGINAÇÃO */}
                {filteredAgendas.length > pageSize && (
                    <div className="flex mt-4 w-full justify-center">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredAgendas.length}
                            responsive
                            onChange={(page) => setCurrentPage(page)}
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
    );
};

export default AdminAgenda;
