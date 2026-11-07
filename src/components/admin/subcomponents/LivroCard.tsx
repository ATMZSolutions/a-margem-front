import { Button } from "antd";
import type { RefObject } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import CampoImagemAdmin from "../campo-imagem-admin";
import ImagemAmpliavel from "../imagem-ampliavel";

// Reutilize o tipo BufferData se ele estiver em um arquivo compartilhado
type BufferData = string;

type LivroItem = {
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
    editFileRef: RefObject<HTMLInputElement | null>
    isEditing: boolean;
    uploadingImage: boolean;
    processingEdit: boolean;
    onEditStart: (livro: LivroItem) => void;
    onEditCancel: () => void;
    onEditChange: (updates: Partial<LivroItem>) => void;
    onEditImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEditSubmit: (e: React.FormEvent) => void;
    onDelete: (id?: number) => void;
};

const LivroCard = ({
    livro,
    editFileRef,
    isEditing,
    uploadingImage,
    onEditStart,
    processingEdit,
    onEditCancel,
    onEditChange,
    onEditImageChange,
    onEditSubmit,
    onDelete
}: LivroCardProps) => {

    if (isEditing) {
        return (
            <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
                <form onSubmit={onEditSubmit} className="space-y-4 rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Editar livro</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Título
                        <input
                            required
                            value={livro.titulo}
                            onChange={(e) => onEditChange({ titulo: e.target.value })}
                            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Autor
                        <input
                            required
                            value={livro.autor}
                            onChange={(e) => onEditChange({ autor: e.target.value })}
                            className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        />
                        </label>
                    </div>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                    <textarea
                        required
                        value={livro.descricao}
                        onChange={(e) => onEditChange({ descricao: e.target.value })}
                        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        rows={4}
                    />
                    </label>
                    <CampoImagemAdmin
                        id={`imagem-livro-${livro.id}`}
                        titulo="Capa do livro"
                        ajuda={livro.imagem ? "Imagem atual. Selecione outro arquivo para substituí-la." : "Escolha uma imagem para identificar a obra."}
                        imagem={livro.imagem}
                        textoAlternativo={`Prévia da capa de ${livro.titulo}`}
                        aspecto="retrato"
                        enviando={uploadingImage}
                        referencia={editFileRef}
                        aoSelecionar={onEditImageChange}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button type="primary" htmlType="submit" loading={processingEdit} className="min-h-11 2xl:min-h-10">Salvar alterações</Button>
                        <Button onClick={onEditCancel} disabled={processingEdit} className="min-h-11 2xl:min-h-10">Cancelar</Button>
                    </div>
                </form>
            </li>
        )
    }

    return (
        <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
