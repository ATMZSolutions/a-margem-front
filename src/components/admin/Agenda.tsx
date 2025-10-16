"use client";
import { Button, ConfigProvider, Modal, Pagination } from "antd";
import { ReactElement, useEffect, useState } from "react";
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
    const [filterDate, setFilterDate] = useState<string>(""); // filtro por data

    const [modal, contextHolder] = Modal.useModal();

    // --- PAGINAÇÃO ---
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 3; // itens por página

    async function load() {
        const a = await fetch("/api/admin/agenda").then((r) => r.json());
        setAgendas(a || []);
    }

    useEffect(() => {
        load();
    }, []);

    // --- CRUD funções (mantidas intactas) ---
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

            modal.success({ title: "Sucesso", content: "Agenda criada com sucesso!", okText: "OK" });
        } catch (err) {
            console.error("Erro ao criar agenda:", err);
            modal.error({ title: "Erro", content: "Não foi possível criar a agenda.", okText: "OK" });
        } finally {
            setLoading(false);
        }
    }

    async function deleteAgenda(id?: number) {
        if (!id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/agenda?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());

            await load();
            modal.success({ title: "Agenda excluída", content: "A agenda foi excluída com sucesso!", okText: "OK" });
        } catch (err) {
            console.error("Erro ao excluir agenda:", err);
            modal.error({ title: "Erro ao excluir", content: "Não foi possível excluir a agenda.", okText: "OK" });
        } finally {
            setLoading(false);
        }
    }

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
        setLoading(true);
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
            modal.success({ title: "Agenda atualizada", content: "A agenda foi atualizada com sucesso!", okText: "OK" });
        } catch (err) {
            console.error("Erro ao atualizar agenda:", err);
            modal.error({ title: "Erro", content: "Não foi possível atualizar a agenda.", okText: "OK" });
        } finally {
            setLoading(false);
        }
    }

    // --- FILTRO POR DATA ---
    const filteredAgendas = filterDate
        ? agendas.filter(a => a.data.startsWith(filterDate))
        : agendas;

    // --- Paginação ---
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentAgendas = filteredAgendas.slice(startIndex, endIndex);

    return (
        <section className="mb-8 w-auto gap-20 bg-black/50 p-4 rounded">
            {contextHolder}
            <h2 className="text-xl border-l-4 border-orange-500 pl-2 font-semibold">Agendas</h2>
            <ConfigProvider
                theme={{
                    components: {
                        Button: {
                            defaultBg: '#FF6900',
                            defaultBorderColor: '#FF6900',
                            defaultHoverBg: '#e05900',
                            defaultHoverBorderColor: '#e05900',
                            defaultHoverColor: 'white',
                            defaultColor: 'white'
                        },
                        Pagination: {
                            itemBg: '#ffffff40',
                            itemActiveBg: '#ffffff10'
                        }
                    },
                }}
            >
                {/* Formulário de criação */}
                <form onSubmit={createAgenda} className="flex flex-col gap-2 my-3 text-white">
                    <input required placeholder="Título" value={newAgenda.titulo} onChange={(e) => setNewAgenda({ ...newAgenda, titulo: e.target.value })} className="p-2 border border-white rounded" />
                    <div className="flex gap-2 w-full">
                        <input required type="date" value={newAgenda.data} onChange={(e) => setNewAgenda({ ...newAgenda, data: e.target.value })} className="p-2 border border-white rounded flex-1 min-w-0" />
                        <input type="time" value={agendaTime} onChange={(e) => setAgendaTime(e.target.value)} className="p-2 border border-white rounded flex-1 min-w-0" />
                    </div>
                    <input placeholder="Cidade" value={newAgenda.cidade} onChange={(e) => setNewAgenda({ ...newAgenda, cidade: e.target.value })} className="p-2 border border-white rounded" />
                    <input placeholder="Local" value={newAgenda.local} onChange={(e) => setNewAgenda({ ...newAgenda, local: e.target.value })} className="p-2 border border-white rounded" />
                    <Button htmlType="submit" loading={loading} style={{ padding: 18, fontSize: '16px', borderRadius: '4px' }}>Adicionar</Button>
                </form>

                {/* Filtro por data */}
                <div className="flex flex-col w-2/3 md:w-full md:flex-row gap-2 mt-4 justify-between md:items-center">
                    <label className="text-white">Filtrar por data:</label>
                    <input type="date" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }} className="p-2 border border-white rounded" />
                    <Button onClick={() => { setFilterDate(""); setCurrentPage(1); }}>Limpar</Button>
                </div>

                {currentAgendas.length > 0 && <h3 className="text-lg mt-4 my-2">Agendas cadastradas:</h3>}
                <ul className="space-y-2">
                    {currentAgendas.map((a) => (
                        <AgendaCard
                            key={a.id}
                            agenda={editingAgenda?.id === a.id ? editingAgenda! : a}
                            isEditing={editingAgenda?.id === a.id}
                            editingAgendaTime={editingAgendaTime}
                            loading={loading}
                            onEditStart={startEditAgenda}
                            onEditCancel={cancelEditAgenda}
                            onEditSubmit={updateAgenda}
                            onEditChange={(updates) => setEditingAgenda((prev) => (prev ? { ...prev, ...updates } : prev))}
                            onTimeChange={setEditingAgendaTime}
                            onDelete={deleteAgenda}
                        />
                    ))}
                </ul>

                {/* PAGINAÇÃO */}
                {filteredAgendas.length > pageSize && (
                    <div className="flex mt-4 w-full justify-center">
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={agendas.length}
                            responsive
                            // Remove o size="small" e fazemos manualmente
                            onChange={(page) => setCurrentPage(page)}
                            className="manual-small-pagination"
                            itemRender={(page, type, originalElement) => {
                                const el = originalElement as React.ReactElement<any>;
                                const isActive = el.props?.className?.includes("ant-pagination-item-active");

                                const classes = `text-white !text-white hover:text-white ${isActive ? 'font-bold !text-white' : ''}`;

                                if (type === 'page') return <a className={classes}>{page}</a>;
                                return <a className={classes}>{el.props?.children}</a>;
                            }}
                        />
                    </div>
                )}
            </ConfigProvider>
        </section>
    );
}

export default AdminAgenda;
