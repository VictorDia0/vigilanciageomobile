export type QuadraStatus = "nao_iniciada" | "em_andamento" | "concluida";

export interface Quadra {
  id: number;
  numero: number;
  area_id: number;
  status: QuadraStatus;
  agente_id: number | null;
}

export interface QuadrasAgregadas {
  total: number;
  nao_iniciadas: number;
  em_andamento: number;
  concluidas: number;
}