export type OcorrenciaStatus = "pendente" | "andamento" | "resolvido" | "cancelado";
export type OcorrenciaTipo = "dengue" | "escorpiao" | "entulho" | "caramujo" | "leishmaniose";

export interface Ocorrencia {
  id: number;
  tipo: OcorrenciaTipo | null;
  status: OcorrenciaStatus;
  descricao: string | null;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  agente_id: number | null;
  agente_nome: string | null;
  data_ocorrencia: string | null;
  created_at: string | null;
  updated_at: string | null;
  agente?: {
    id: number;
    nome: string;
  };
}

export interface OcorrenciasAgregadas {
  total: number;
  pendentes: number;
  em_andamento: number;
  lista: Ocorrencia[];
}