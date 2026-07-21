export type RelatorioTipo = "ocorrencias" | "tratamentos" | "visitas" | "depositos";
export type RelatorioFormato = "pdf" | "xlsx" | "csv";
export type RelatorioStatus = "processando" | "concluido" | "erro";

export interface Relatorio {
  id: number;
  nome: string;
  tipo: RelatorioTipo;
  formato: RelatorioFormato;
  status: RelatorioStatus;
  filtros: Record<string, unknown> | null;
  geradoPor?: { id: number; name: string } | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GerarRelatorioPayload {
  tipo: RelatorioTipo;
  formato: RelatorioFormato;
  data_inicio?: string | null;
  data_fim?: string | null;
  ano?: number | null;
  tipo_ocorrencia?: string | null;
  status?: string | null;
  agente_id?: number | null;
}
