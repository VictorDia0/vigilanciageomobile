import { api } from "@/src/services/api";
import type { Agente } from "@/src/types/agente";

function unwrap<T>(res: any): T {
  return res.data?.data ?? res.data;
}

export const agenteService = {
  /** Agentes da própria cidade (o backend já escopa via daMinhaCidade()). */
  async list(): Promise<Agente[]> {
    const res = await api.get("/agentes");
    return unwrap<Agente[]>(res) ?? [];
  },
};
