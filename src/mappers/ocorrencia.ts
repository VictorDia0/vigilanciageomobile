import type { Ocorrencia, OcorrenciasAgregadas } from "@/src/types/ocorrencia";
import { OCORRENCIAS_DASHBOARD_LIMIT } from "@/src/constants/ocorrencia";

export function aggregateOcorrencias(
  ocorrencias: Ocorrencia[],
  agenteId: number
): OcorrenciasAgregadas {
  const doAgente = ocorrencias.filter((o) => o.agente_id === agenteId);

  return {
    total:        doAgente.length,
    pendentes:    doAgente.filter((o) => o.status === "pendente").length,
    em_andamento: doAgente.filter((o) => o.status === "andamento").length,
    lista:        doAgente.slice(0, OCORRENCIAS_DASHBOARD_LIMIT),
  };
}