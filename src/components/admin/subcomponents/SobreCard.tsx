import { Button } from "antd";
import { Info, Pencil, Trash2 } from "lucide-react";
import ImagemAmpliavel from "../imagem-ampliavel";

type BufferData = string;

type SobreItem = {
    ano: number;
    imagem?: string;
    descricao: string;
    imageData?: BufferData;
    imagemTipo?: string;
};

type SobreCardProps = {
    sobre: SobreItem;
    processingEdit?: boolean;
    onEditStart: (sobre: SobreItem) => void;
    onDelete: (ano: number) => void;
};

const SobreCard = ({
    sobre,
    onEditStart,
    processingEdit,
    onDelete
}: SobreCardProps) => {
    return (
        <li className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
            <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {sobre.imagem && (
                        <ImagemAmpliavel
                            src={sobre.imagem}
                            alt={`Sobre ${sobre.ano}`}
                            sizes="(min-width: 1536px) 80px, 96px"
                            className="size-24 shrink-0 rounded-lg 2xl:size-20"
                        />
                    )}
                    {!sobre.imagem && (
                        <span aria-hidden="true" className="grid size-24 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:size-20">
                            <Info className="size-8 2xl:size-7" />
                        </span>
                    )}
                    <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#19121d]">Ano {sobre.ano}</h3>
                        <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{sobre.descricao}</div>
                    </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pl-4">
                    <Button
                        className="min-h-11 2xl:min-h-10"
                        loading={processingEdit}
                        icon={<Pencil size={15} aria-hidden="true" />}
                        onClick={() => onEditStart(sobre)}>Editar</Button>
                    <Button
                        danger
                        onClick={() => onDelete(sobre.ano)}
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

export default SobreCard;
