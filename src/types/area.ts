import type { Cidade } from "./cidade";
import type { Quadra } from "./quadra";
import type { AgenteResumo } from "./agente";

export interface Area {
  id: number;
  nome: string;
  cidade_id: number;
  cidade?: Cidade;
  ativo: boolean;
  quadras?: Quadra[];
  agentes?: AgenteResumo[];
  total_quadras?: number;
  total_agentes?: number;
  total_tratamentos?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface AreasAgregadas {
  total: number;
  ativas: number;
  lista: Area[];
}