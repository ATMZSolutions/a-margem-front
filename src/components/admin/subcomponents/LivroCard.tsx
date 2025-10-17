import { Button, Popconfirm } from "antd";
import Image from "next/image";

// Reutilize o tipo BufferData se ele estiver em um arquivo compartilhado
type BufferData = {
    type: 'Buffer';
    data: number[];
};

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
            <li className="bg-black/30 p-3 rounded">
                <form onSubmit={onEditSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                            required
                            placeholder="Título"
                            value={livro.titulo}
                            onChange={(e) => onEditChange({ titulo: e.target.value })}
                            className="p-2 text-white rounded border border-white"
                        />
                        <input
                            required
                            placeholder="Autor"
                            value={livro.autor}
                            onChange={(e) => onEditChange({ autor: e.target.value })}
                            className="p-2 text-white rounded border border-white"
                        />
                    </div>
                    <textarea
                        required
                        placeholder="Descrição"
                        value={livro.descricao}
                        onChange={(e) => onEditChange({ descricao: e.target.value })}
                        className="w-full p-2 text-white rounded border border-white"
                        rows={3}
                    />
                    <div className="flex gap-3 items-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onEditImageChange}
                            disabled={uploadingImage}
                            className="p-2 text-white w-full bg-gray-700 rounded text-sm"
                        />
                        {uploadingImage && <span className="text-yellow-400">Enviando...</span>}
                        {livro.imagem && (
                            <Image
                                src={livro.imagem}
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
                    {livro.imagem && (
                        <Image
                            src={livro.imagem}
                            alt={livro.titulo}
                            width={64}
                            height={80}
                            className="w-16 h-20 object-cover rounded"
                        />
                    )}
                    <div className="flex-1">
                        <div className="font-semibold">{livro.titulo}</div>
                        <div className="text-sm text-gray-300">por {livro.autor}</div>
                        <div className="text-gray-400 mt-2 text-xs line-clamp-3 whitespace-pre-wrap">{livro.descricao}</div>
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
                        onClick={() => onEditStart(livro)}>Editar</Button>
                    <Popconfirm
                        title="Tem certeza que deseja excluir este livro?"
                        okText="Sim"
                        cancelText="Não"
                        onConfirm={() => onDelete(livro.id)}
                        okButtonProps={{ danger: true }}
                    >
                        <button
                            className="bg-red-600 px-2 cursor-pointer rounded hover:bg-red-700"
                        >
                            Excluir
                        </button>
                    </Popconfirm>
                </div>
            </div>
        </li>
    );
};

export default LivroCard;