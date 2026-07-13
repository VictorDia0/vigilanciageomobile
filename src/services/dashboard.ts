import { api } from "@/src/services/api";
import { Area } from "../types/area";
import { Ocorrencia } from "../types/ocorrencia";
import { Tratamento } from "../types/tratamento";

interface DashboardRawData {
  areas: Area[];
  ocorrencias: Ocorrencia[];
  tratamentos: Tratamento[];
}

function unwrapList<T>(response: { data: { data: T[] } | T[] }): T[] {
  return (response.data as { data: T[] }).data ?? (response.data as T[]) ?? [];
}

export async function fetchDashboardData(): Promise<DashboardRawData> {
  const [areasRes, ocorrenciasRes, tratamentosRes] = await Promise.all([
    api.get("/areas"),
    api.get("/ocorrencias"),
    api.get("/tratamentos"),
  ]);

  return {
    areas:       unwrapList<Area>(areasRes),
    ocorrencias: unwrapList<Ocorrencia>(ocorrenciasRes),
    tratamentos: unwrapList<Tratamento>(tratamentosRes),
  };
}