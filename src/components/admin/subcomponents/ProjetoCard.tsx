import { Button } from "antd";
import { FolderKanban, Pencil, Trash2 } from "lucide-react";

type ProjetoItem = {
    id?: number;
    data: string;
    descricao: string;
};

type ProjetoCardProps = {
    projeto: ProjetoItem;
    processingEdit?: boolean;
    onEditStart: (projeto: ProjetoItem) => void;
    onDelete: (id?: number) => void;
};

const ProjetoCard = ({
    projeto,
    processingEdit,
    onEditStart,
    onDelete
}: ProjetoCardProps) => {
    return (
        <li className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
            <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
                        loading={processingEdit}
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
