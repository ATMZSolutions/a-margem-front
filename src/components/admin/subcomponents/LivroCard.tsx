import { Button } from "antd";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import ImagemAmpliavel from "../imagem-ampliavel";

export type BufferData = string;

export type LivroItem = {
    id?: number;
    titulo: string;
    autor: string;
    descricao: string;
    imagem?: string;
    imageData?: BufferData;
    imagemTipo?: string;
};

type LivroCardProps = {
    livro: LivroItem;
    processingEdit?: boolean;
    onEditStart: (livro: LivroItem) => void;
    onDelete: (id?: number) => void;
};

const LivroCard = ({
    livro,
    onEditStart,
    processingEdit,
    onDelete
}: LivroCardProps) => {
    return (
        <li className="w-full min-w-0 max-w-full overflow-hidden py-4 first:pt-4 last:pb-0 2xl:py-3">
            <div className="flex w-full min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {livro.imagem && (
                        <ImagemAmpliavel
                            src={livro.imagem}
                            alt={livro.titulo}
                            sizes="(min-width: 1536px) 56px, 64px"
                            className="h-24 w-16 shrink-0 rounded-lg 2xl:h-20 2xl:w-14"
                        />
                    )}
                    {!livro.imagem && (
                        <span aria-hidden="true" className="grid h-24 w-16 shrink-0 place-items-center rounded-lg bg-[#f2f0f3] text-[#412551] 2xl:h-20 2xl:w-14">
                            <BookOpen className="size-8 2xl:size-7" />
                        </span>
                    )}
                    <span aria-hidden="true" className="hidden w-px self-stretch bg-slate-300 sm:block" />
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#19121d]">{livro.titulo}</h3>
                        <div className="mt-0.5 text-sm text-slate-600">por {livro.autor}</div>
                        <div className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{livro.descricao}</div>
                    </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:pl-4">
                    <Button
                        className="min-h-11 2xl:min-h-10"
                        loading={processingEdit}
                        icon={<Pencil size={15} aria-hidden="true" />}
                        onClick={() => onEditStart(livro)}>Editar</Button>
                    <Button
                        danger
                        onClick={() => onDelete(livro.id)}
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

export default LivroCard;
