import { api } from "@/src/services/api";
import type { Ocorrencia, OcorrenciaTipo } from "@/src/types/ocorrencia";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export interface StoreOcorrenciaPayload {
  tipo: OcorrenciaTipo;
  descricao?: string | null;
  latitude: number;
  longitude: number;
  endereco?: string | null;
  data_ocorrencia?: string | null;
}

export const ocorrenciaService = {
  async list(): Promise<Ocorrencia[]> {
    const res = await api.get("/ocorrencias");
    return unwrap<Ocorrencia[]>(res) ?? [];
  },

  async show(id: number): Promise<Ocorrencia> {
    const res = await api.get(`/ocorrencias/${id}`);
    return unwrap<Ocorrencia>(res);
  },

  async store(payload: StoreOcorrenciaPayload): Promise<Ocorrencia> {
    const res = await api.post("/ocorrencias", payload);
    return unwrap<Ocorrencia>(res);
  },
};
