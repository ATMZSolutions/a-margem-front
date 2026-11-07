import { Button } from "antd";
import { FolderKanban, Pencil, Trash2 } from "lucide-react";

type ProjetoItem = {
    id?: number;
    data: string;
    descricao: string;
};

type ProjetoCardProps = {
    projeto: ProjetoItem;
    isEditing: boolean;
    processingEdit: boolean;
    onEditStart: (projeto: ProjetoItem) => void;
    onEditCancel: () => void;
    onEditChange: (updates: Partial<ProjetoItem>) => void;
    onEditSubmit: (e: React.FormEvent) => void;
    onDelete: (id?: number) => void;
};

const ProjetoCard = ({
    projeto,
    isEditing,
    processingEdit,
    onEditStart,
    onEditCancel,
    onEditChange,
    onEditSubmit,
    onDelete
}: ProjetoCardProps) => {

    if (isEditing) {
        return (
            <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
                <form onSubmit={onEditSubmit} className="space-y-4 rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Editar projeto</h3>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Data
                    <input
                        required
                        type="date"
                        value={projeto.data.split("T")[0]}
                        onChange={(e) => onEditChange({ data: e.target.value })}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                    <textarea
                        required
                        value={projeto.descricao}
                        onChange={(e) => onEditChange({ descricao: e.target.value })}
                        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        rows={4}
                    />
                    </label>
                    <div className="flex gap-2">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={processingEdit}
                            className="min-h-11 2xl:min-h-10"
                        >
                            Salvar alterações
                        </Button>
                        <Button 
                            onClick={onEditCancel}
                            disabled={processingEdit}
                            className="min-h-11 2xl:min-h-10"
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </li>
        )
    }

    return (
        <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-10">
                        <FolderKanban className="size-5 2xl:size-[18px]" />
                    </span>
                    <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                    <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#19121d]">
                        {new Date(projeto.data).toLocaleDateString("pt-BR")}
                    </h3>
                    <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {projeto.descricao}
                    </div>
                </div>
                    </div>
                <div className="flex shrink-0 gap-2 sm:pl-4">
                    <Button
                        className="min-h-11 2xl:min-h-10"
                        icon={<Pencil size={15} aria-hidden="true" />}
                        onClick={() => onEditStart(projeto)}
                    >
                        Editar
                    </Button>
                    <Button
                        danger
                        onClick={() => onDelete(projeto.id)}
                        icon={<Trash2 size={15} aria-hidden="true" />}
                        className="min-h-11 2xl:min-h-10"
                    >
                        Excluir
                    </Button>
                </div>
            </div>
        </li>
    );
};

export default ProjetoCard;
