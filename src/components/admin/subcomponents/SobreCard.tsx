import { Button } from "antd";
import type { RefObject } from "react";
import { Info, Pencil, Trash2 } from "lucide-react";
import CampoImagemAdmin from "../campo-imagem-admin";
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
    editFileRef: RefObject<HTMLInputElement | null>
    isEditing: boolean;
    uploadingImage: boolean;
    processingEdit: boolean;
    onEditStart: (sobre: SobreItem) => void;
    onEditCancel: () => void;
    onEditChange: (updates: Partial<SobreItem>) => void;
    onEditImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEditSubmit: (e: React.FormEvent) => void;
    onDelete: (ano: number) => void;
};

const SobreCard = ({
    sobre,
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
}: SobreCardProps) => {

    if (isEditing) {
        return (
            <li className="py-4 first:pt-4 last:pb-0 2xl:py-3">
                <form onSubmit={onEditSubmit} className="space-y-4 rounded-lg bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-900">Editar registro</h3>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Ano
                    <input
                        required
                        type="number"
                        value={sobre.ano}
                        onChange={(e) => onEditChange({ ano: parseInt(e.target.value) })}
                        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                    />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Descrição
                    <textarea
                        required
                        value={sobre.descricao}
                        onChange={(e) => onEditChange({ descricao: e.target.value })}
                        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-[#412551] focus:outline-none focus:ring-2 focus:ring-[#412551]/20"
                        rows={4}
                    />
                    </label>
                    <CampoImagemAdmin
                        id={`imagem-sobre-${sobre.ano}`}
                        titulo="Imagem"
                        ajuda={sobre.imagem ? "Imagem atual. Selecione outro arquivo para substituí-la." : "Escolha uma imagem para acompanhar este registro."}
                        imagem={sobre.imagem}
                        textoAlternativo={`Prévia da imagem de ${sobre.ano}`}
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
