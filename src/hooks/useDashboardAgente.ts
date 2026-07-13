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
        ocorrencias: aggregateOcorrencias(ocorrencias, user.id),
      });
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return { data, loading, error, fetch };
}