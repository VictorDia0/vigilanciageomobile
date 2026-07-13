import { Estado } from "./estado";

export interface Cidade {
    id: number;
    nome: string;
    estado_id: number;
    ativo: boolean;
    estado?: Estado;
}
