import { BufferData } from "@/app/admin/AdminClient";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Button, ConfigProvider, Input, Modal, Pagination } from "antd";
import SobreCard from "./subcomponents/SobreCard";
import EstadoLista from "./EstadoLista";
import CabecalhoSecao from "./CabecalhoSecao";
import ModalAdmin from "./ModalAdmin";
import CampoImagemAdmin from "./campo-imagem-admin";
import { buscarJsonAdministrativo, invalidarDadosCacheados, lerDadosCacheados, obterDadosCacheados } from "@/lib/cache-administrativo";

type SobreItem = {
    ano: number;
    imagem?: string;
    descricao: string;
    imageData?: BufferData;
    imagemTipo?: string;
};

const AdminSobre = () => {
    const dadosIniciais = lerDadosCacheados<SobreItem[]>("admin:sobre");
    const [sobres, setSobres] = useState<SobreItem[]>(dadosIniciais ?? []);

    // Estados para Sobre
    const [newSobre, setNewSobre] = useState<SobreItem>({
        ano: new Date().getFullYear(),
        imagem: "",
        descricao: "",
    });
    const [editingSobre, setEditingSobre] = useState<SobreItem | null>(null);
    const [uploadingSobreImage, setUploadingSobreImage] = useState<boolean>(false);

    // --- Estados ---
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState<boolean>(dadosIniciais === undefined);
    const [falhaCarga, setFalhaCarga] = useState<boolean>(false);
    const [modal, contextHolder] = Modal.useModal();
    const [filter, setFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [processingEdit, setProcessingEdit] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const pageSize = 3;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // --- Lógica de Filtro e Paginação ---
    const filteredSobres = useMemo(() => {
        if (!filter.trim()) return sobres;
        return sobres.filter((sobre) =>
            sobre.descricao.toLowerCase().includes(filter.toLowerCase().trim()) ||
            sobre.ano.toString().includes(filter.trim())
        );
    }, [sobres, filter]);

    const currentSobres = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredSobres.slice(startIndex, startIndex + pageSize);
    }, [filteredSobres, currentPage]);

    const load = useCallback(async (forcarAtualizacao = false) => {
        if (forcarAtualizacao) invalidarDadosCacheados("admin:sobre");
        setDataLoading(true);
        setFalhaCarga(false);
        try {
            const sobresComImagens = await obterDadosCacheados("admin:sobre", async () => {
                const sobres = await buscarJsonAdministrativo<SobreItem[]>("/api/admin/sobre");
                return (sobres || []).map((sobre) => ({
                    ...sobre,
                    imagem: sobre.imagem ? `/api/image/sobre/${sobre.ano}?${Date.now()}` : undefined,
                }));
            });
            setSobres(sobresComImagens || []);
        } catch (error) {
            console.error("Falha ao carregar sobre:", error);
            setFalhaCarga(true);
            modal.error({ title: "Erro", content: "Falha ao carregar sobre." });
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

    // Funções para Sobre
    async function handleSobreImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação básica de tipo de arquivo
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            modal.error({ title: "Erro", content: "Selecione uma imagem JPEG, PNG ou WebP." });
            return;
        }

        setUploadingSobreImage(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "sobre");

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error("Upload falhou");

            const data = await response.json();
            if (data.imageData && data.imagemTipo) {
                const imageUpdates = {
                    imagem: URL.createObjectURL(file),
                    imageData: data.imageData,
                    imagemTipo: data.imagemTipo
                };

                if (target === 'new') {
                    setNewSobre(prev => ({ ...prev, ...imageUpdates }));
                } else if (target === 'edit' && editingSobre) {
                    setEditingSobre(prev => prev ? { ...prev, ...imageUpdates } : null);
                }
            }
        } catch (error) {
            console.error("Upload failed:", error);
            modal.error({ title: "Erro de Upload", content: "Não foi possível enviar a imagem." });
        } finally {
            setUploadingSobreImage(false);
        }
    }

    async function createSobre(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/admin/sobre", {
                method: "POST",
                body: JSON.stringify(newSobre),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao criar ítem");

            setNewSobre({
                ano: new Date().getFullYear(),
                imagem: "",
                descricao: "",
            });
            setMostrarFormulario(false);
            await load(true);
            modal.success({ title: "Sucesso", content: "Ítem criado com sucesso!" });

            // Limpa o input de arquivo usando ref
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch {
            modal.error({ title: "Erro", content: "Não foi possível criar o ítem." });
        } finally {
            setLoading(false);
        }
    }

    async function deleteSobre(ano: number) {
        modal.confirm({
            title: "Confirmar exclusão",
            content: "Tem certeza que deseja excluir este item do Sobre Nós?",
            okText: "Sim, excluir",
            cancelText: "Cancelar",
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const res = await fetch("/api/admin/sobre?ano=" + ano, { method: "DELETE" });
                    if (!res.ok) throw new Error("Falha ao excluir ítem");

                    // Verifica se vai ficar sem itens na página atual após exclusão
                    const willBeEmptyPage = currentSobres.length === 1 && currentPage > 1;

                    await load(true);

                    // Ajusta a página se necessário
                    if (willBeEmptyPage) {
                        setCurrentPage(currentPage - 1);
                    }
                    modal.success({ title: "Sucesso", content: "ítem excluído com sucesso!" });
                } catch {
                    modal.error({ title: "Erro", content: "Não foi possível excluir o ítem." });
                }
            }
        });
    }

    async function updateSobre(e: React.FormEvent) {
        e.preventDefault();
        if (!editingSobre) return;
        setProcessingEdit(true);

        try {
            const payload = { ...editingSobre };
            if (!payload.imageData) {
                delete payload.imagem;
            }

            const res = await fetch("/api/admin/sobre", {
                method: "PUT",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) throw new Error("Falha ao atualizar sobre");

            setEditingSobre(null);
            await load(true);
            modal.success({ title: "Sucesso", content: "Ítem atualizado com sucesso!" });

            // Limpa o input de arquivo usando ref
            if (editFileInputRef.current) {
                editFileInputRef.current.value = '';
            }
        } catch {
            modal.error({ title: "Erro", content: "Não foi possível atualizar o sobre." });
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
                titulo="Sobre"
                descricao="Registre a história e a trajetória do coletivo."
                acao="Novo registro"
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
                    titulo="Novo registro histórico"
                    descricao="Preencha os campos abaixo para registrar um marco histórico do coletivo."
                >
                    <form onSubmit={createSobre} className="space-y-4">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Ano
                        <input
                            required
                            type="number"
                            value={newSobre.ano}
                            onChange={(e) =>
                                setNewSobre({ ...newSobre, ano: parseInt(e.target.value) })
                            }
                            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                        <textarea
                            required
                            value={newSobre.descricao}
                            onChange={(e) =>
                                setNewSobre({ ...newSobre, descricao: e.target.value })
                            }
                            className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                            rows={4}
                        />
                        </label>
                        <CampoImagemAdmin
                            id="imagem-sobre"
                            titulo="Imagem"
                            ajuda="Escolha uma imagem para acompanhar este registro."
                            imagem={newSobre.imagem}
                            textoAlternativo="Prévia da imagem sobre o coletivo"
                            obrigatoria
                            enviando={uploadingSobreImage}
                            referencia={fileInputRef}
                            aoSelecionar={(e) => handleSobreImageUpload(e, "new")}
                        />
                        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                            <Button
                                onClick={() => setMostrarFormulario(false)}
                                disabled={loading || uploadingSobreImage}
                                className="min-h-11"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading || uploadingSobreImage}
                                className="min-h-11 px-5"
                            >
                                Publicar registro
                            </Button>
                        </div>
                    </form>
                </ModalAdmin>

                {/* Modal de Edição */}
                <ModalAdmin
                    aberto={Boolean(editingSobre)}
                    aoFechar={() => setEditingSobre(null)}
                    titulo="Editar registro histórico"
                    descricao="Atualize os dados e confirme para salvar as alterações."
                >
                    {editingSobre && (
                        <form onSubmit={updateSobre} className="space-y-4">
                            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Ano
                            <input
                                required
                                type="number"
                                value={editingSobre.ano}
                                onChange={(e) => setEditingSobre({ ...editingSobre, ano: parseInt(e.target.value) })}
                                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                            />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                            <textarea
                                required
                                value={editingSobre.descricao}
                                onChange={(e) => setEditingSobre({ ...editingSobre, descricao: e.target.value })}
                                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                                rows={4}
                            />
                            </label>
                            <CampoImagemAdmin
                                id={`imagem-sobre-${editingSobre.ano}`}
                                titulo="Imagem"
                                ajuda={editingSobre.imagem ? "Imagem atual. Selecione outro arquivo para substituí-la." : "Escolha uma imagem para acompanhar este registro."}
                                imagem={editingSobre.imagem}
                                textoAlternativo={`Prévia da imagem de ${editingSobre.ano}`}
                                enviando={uploadingSobreImage}
                                referencia={editFileInputRef}
                                aoSelecionar={(e) => handleSobreImageUpload(e, 'edit')}
                            />
                            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-200">
                                <Button
                                    onClick={() => setEditingSobre(null)}
                                    disabled={processingEdit || uploadingSobreImage}
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

                {/* Filtro e lista de sobre */}
                {!falhaCarga && sobres.length > 0 && (
                    <div className="my-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-[#19121d]">Registros cadastrados</h3>
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
                            aria-label="Buscar registros por ano ou descrição"
                            placeholder="Filtrar por ano ou descrição..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="[&_.ant-input-search-button_.anticon]:!text-slate-500 hover:[&_.ant-input-search-button_.anticon]:!text-slate-900 border border-slate-300 rounded-lg"
                            variant="borderless"
                            allowClear
                        />
                    </div>
                )}

                {/* Lista de sobre usando SobreCard */}
                {dataLoading ? (
                    <EstadoLista
                        carregando={true}
                        buscando={false}
                        mensagemVazia=""
                    />
                ) : falhaCarga ? (
                    <div className="py-8 text-center space-y-3">
                        <p role="alert" className="text-sm font-medium text-red-700">
                            Não foi possível carregar os registros.
                        </p>
                        <button
                            type="button"
                            onClick={() => void load(true)}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#412551] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#412551]"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : currentSobres.length > 0 ? (
                    <ul className="w-full min-w-0 max-w-full divide-y divide-slate-300 border-t border-slate-300">
                        {currentSobres.map((s) => (
                            <SobreCard
                                key={s.ano}
                                sobre={s}
                                processingEdit={processingEdit}
                                onEditStart={setEditingSobre}
                                onDelete={deleteSobre}
                            />
                        ))}
                    </ul>
                ) : (
                    <EstadoLista
                        carregando={false}
                        buscando={Boolean(filter)}
                        mensagemVazia="Ainda não há registros. Crie o primeiro para começar."
                        textoAcao="Criar primeiro registro"
                        aoCriar={() => setMostrarFormulario(true)}
                    />
                )}

                {/* Paginação */}
                {filteredSobres.length > pageSize && (
                    <div className="flex mt-6 mb-4 w-full justify-center">
                        <Pagination
                            aria-label="Navegação de páginas da área Sobre"
                            responsive
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredSobres.length}
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

export default AdminSobre;
