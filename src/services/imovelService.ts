import { api } from "@/src/services/api";
import type { Imovel } from "@/src/types/imovel";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export interface CriarImovelPayload {
  quadra_id:   number;
  logradouro:  string;
  numero:      string | null;
  sem_numero:  boolean;
  tipo_imovel: string;
}

export const imovelService = {
  async listarPorQuadra(quadraId: number): Promise<Imovel[]> {
    const res = await api.get(`/imoveis/quadra/${quadraId}`);
    return res.data?.data ?? res.data ?? [];
  },

  async criar(payload: CriarImovelPayload): Promise<Imovel> {
    const res = await api.post("/imoveis", payload);
    return unwrap<Imovel>(res);
  },
};