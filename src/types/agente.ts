import type { Cidade } from "./cidade";

export type AgenteStatus = "ativo" | "inativo" | "ferias";

export interface Agente {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  matricula: string;
  status: AgenteStatus;
  role: string;
  cidade_id: number | null;
  cidade?: Cidade | null;
  created_at: string | null;
}

export interface AgenteResumo {
  id: number;
  user_id: number;
  nome: string;
}