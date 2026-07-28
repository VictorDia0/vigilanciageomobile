import { useState, useCallback } from "react";

import { DASHBOARD_EMPTY_STATE } from "@/src/constants/dashboard";
import { fetchDashboardData } from "@/src/services/dashboard";
import { findTratamentoAtivo } from "@/src/mappers/tratamento";
import { aggregateAreas } from "@/src/mappers/area";
import { aggregateQuadras } from "@/src/mappers/quadra";
import { aggregateOcorrencias } from "@/src/mappers/ocorrencia";
import type { DashboardData, DashboardState } from "@/src/types/dashboard";
import { useAuthStore } from "../store/authStore";

export function useDashboardAgente(): DashboardState & { fetch: () => Promise<void> } {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData>(DASHBOARD_EMPTY_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const { areas, ocorrencias, tratamentos } = await fetchDashboardData();

      const areasDoAgente = aggregateAreas(areas, user.id);

      setData({
        tratamento: findTratamentoAtivo(tratamentos),
        areas: areasDoAgente,
        quadras: aggregateQuadras(areasDoAgente.lista),
        // agente_id da ocorrência referencia agentes.id, não users.id.
        ocorrencias: user.agente?.id
          ? aggregateOcorrencias(ocorrencias, user.agente.id)
          : { total: 0, pendentes: 0, em_andamento: 0, lista: [] },
      });
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.agente?.id]);

  return { data, loading, error, fetch };
}