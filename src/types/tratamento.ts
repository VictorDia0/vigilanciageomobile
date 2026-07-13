import type { StatusValor } from "./comum";

export type { StatusValor } from "./comum";

export interface TratamentoArea {
  id: number;
  nome: string;
  status: string;
}

export interface Tratamento {
  id: number;
  numero: number;
  ano: number;
  label: string;
  data_inicio: string | null;
  data_fim: string | null;
  status: StatusValor;
  areas?: TratamentoArea[];
  total_areas?: number;
  areas_concluidas?: number;
}