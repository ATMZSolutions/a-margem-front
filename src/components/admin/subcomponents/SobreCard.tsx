import { Button } from "antd";
import Image from "next/image";
import type { RefObject } from "react";

type BufferData = {
    type: 'Buffer';
    data: number[];
};

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
            <li className="bg-black/30 p-3 rounded">
                <form onSubmit={onEditSubmit} className="space-y-3">
                    <input
                        required
                        type="number"
                        placeholder="Ano"
                        value={sobre.ano}
                        onChange={(e) => onEditChange({ ano: parseInt(e.target.value) })}
                        className="w-full p-2 text-white rounded border border-white"
                    />
                    <textarea
                        required
                        placeholder="Descrição"
                        value={sobre.descricao}
                        onChange={(e) => onEditChange({ descricao: e.target.value })}
                        className="w-full p-2 text-white rounded border border-white"
                        rows={3}
                    />
                    <div className="flex gap-3 items-center">
                        <input
                            required
                            ref={editFileRef}
                            type="file"
                            accept="image/*"
                            onChange={onEditImageChange}
                            disabled={uploadingImage}
                            className="p-2 text-white w-full bg-gray-700 rounded text-sm"
                        />
                        {uploadingImage && <span className="text-yellow-400">Enviando...</span>}
                        {sobre.imagem && (
                            <Image
                                src={sobre.imagem}
                                alt="Preview"
                                width={48}
                                height={48}
                                className="w-12 h-12 object-cover rounded"
                            />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button type="primary" htmlType="submit" loading={processingEdit}>Salvar</Button>
                        <Button onClick={onEditCancel}>Cancelar</Button>
                    </div>
                </form>
            </li>
        )
    }

    return (
        <li className="bg-black/30 p-2 rounded">
            <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center flex-1">
                    {sobre.imagem && (
                        <Image
                            src={sobre.imagem}
                            alt={`Sobre ${sobre.ano}`}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded"
                        />
                    )}
                    <div className="flex-1">
                        <div className="font-semibold">Ano {sobre.ano}</div>
                        <div className="text-gray-400 mt-2 text-xs line-clamp-3 whitespace-pre-wrap">{sobre.descricao}</div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        style={{
                            fontSize: "14px",
                            borderRadius: "4px",
                            backgroundColor: "blue",
                            borderColor: "blue",
                        }}
                        onClick={() => onEditStart(sobre)}>Editar</Button>
                    <button
                        className="bg-red-600 px-2 cursor-pointer rounded hover:bg-red-700"
                        onClick={() => onDelete(sobre.ano)}
                    >
                        Excluir
                    </button>
                </div>
            </div>
        </li>
    );
};

export default SobreCard;