import { Button } from "antd";
import type { RefObject } from "react";

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
            <li className="bg-black/30 p-4 rounded">
                <form onSubmit={onEditSubmit} className="space-y-3">
                    <input
                        required
                        type="date"
                        value={projeto.data.split("T")[0]}
                        onChange={(e) => onEditChange({ data: e.target.value })}
                        className="w-full p-2 text-white bg-transparent"
                    />
                    <textarea
                        required
                        placeholder="Descrição do projeto"
                        value={projeto.descricao}
                        onChange={(e) => onEditChange({ descricao: e.target.value })}
                        className="w-full p-2 text-white bg-transparent"
                        rows={3}
                    />
                    <div className="flex gap-2">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={processingEdit}
                            className="bg-green-600 hover:bg-green-700 border-green-600"
                        >
                            Salvar
                        </Button>
                        <Button 
                            onClick={onEditCancel}
                            disabled={processingEdit}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </li>
        )
    }

    return (
        <li className="bg-black/30 p-4 rounded">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="font-semibold text-white text-lg">
                        {new Date(projeto.data).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {projeto.descricao}
                    </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                    <Button
                        style={{
                            fontSize: "14px",
                            borderRadius: "4px",
                            backgroundColor: "#0084ffff",
                            borderColor: "#1890ff",
                        }}
                        onClick={() => onEditStart(projeto)}
                    >
                        Editar
                    </Button>
                    <Button
                        style={{
                            fontSize: "14px",
                            borderRadius: "4px",
                            backgroundColor: "#ff0004ff",
                            borderColor: "#ff0004ff",
                        }}
                        onClick={() => onDelete(projeto.id)}
                    >
                        Excluir
                    </Button>
                </div>
            </div>
        </li>
    );
};

export default ProjetoCard;