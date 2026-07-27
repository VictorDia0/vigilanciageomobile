import { api } from "@/src/services/api";
import { Area } from "../types/area";
import { Ocorrencia } from "../types/ocorrencia";
import { Tratamento } from "../types/tratamento";
import { cacheLeitura } from "../db/cache";

interface DashboardRawData {
  areas: Area[];
  ocorrencias: Ocorrencia[];
  tratamentos: Tratamento[];
}

const CHAVE_CACHE = "dashboard_data";

/** true quando o erro do axios é falta de rede (sem resposta do servidor) */
function isErroDeRede(err: any): boolean {
  return !!err && !err.response;
}

function unwrapList<T>(response: { data: { data: T[] } | T[] }): T[] {
  return (response.data as { data: T[] }).data ?? (response.data as T[]) ?? [];
}

export async function fetchDashboardData(): Promise<DashboardRawData> {
  try {
    const [areasRes, ocorrenciasRes, tratamentosRes] = await Promise.all([
      api.get("/areas"),
      api.get("/ocorrencias"),
      api.get("/tratamentos"),
    ]);

    const dados: DashboardRawData = {
      areas:       unwrapList<Area>(areasRes),
      ocorrencias: unwrapList<Ocorrencia>(ocorrenciasRes),
      tratamentos: unwrapList<Tratamento>(tratamentosRes),
    };

    cacheLeitura.set(CHAVE_CACHE, dados);
    return dados;
  } catch (err) {
    // Sem sinal ao abrir o app: serve o último dashboard conhecido em vez de
    // deixar a tela achar que "não tem tratamento ativo" (que é outro erro).
    if (isErroDeRede(err)) {
      const cache = cacheLeitura.get<DashboardRawData>(CHAVE_CACHE);
      if (cache) return cache;
    }
    throw err;
  }
}