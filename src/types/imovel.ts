import type { Quadra } from "./quadra";
import type { StatusValor } from "./comum";

export type { StatusValor } from "./comum";

export interface VisitaDados {
    horario_visita: string | null;
    situacao: StatusValor | null;
    focos_eliminados: number | null;
    tratado: boolean;
    quantidade_larvicida: number | null;
    depositos_tratados: number | null;
}

export interface Imovel {
    id: number;
    logradouro: string;
    numero: string | null;
    sem_numero: boolean;
    endereco_completo: string;
    tipo_imovel: StatusValor;
    ativo: boolean;
    quadra?: Quadra;
    visita_dados?: VisitaDados;
    created_at: string | null;
    /** true quando o registro está na outbox aguardando sincronização */
    pendente_sync?: boolean;
}