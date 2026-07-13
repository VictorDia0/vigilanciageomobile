import { useState, useCallback } from "react";
import { useAuthStore } from "@/src/store/authStore";
import { api } from "@/src/services/api";
import type { Ocorrencia } from "@/src/types/ocorrencia";

interface OcorrenciasState {
  ocorrencias: Ocorrencia[];
  loading: boolean;
  error: string | null;
}

function unwrapList<T>(response: { data: { data: T[] } | T[] }): T[] {
  return (response.data as { data: T[] }).data ?? (response.data as T[]) ?? [];
}

export function useOcorrenciasAgente() {
  const { user } = useAuthStore();
  const [state, setState] = useState<OcorrenciasState>({
    ocorrencias: [],
    loading:     false,
    error:       null,
  });

  const fetch = useCallback(async () => {
    if (!user?.id) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res   = await api.get("/ocorrencias");
      const todas = unwrapList<Ocorrencia>(res);

      const minhas = todas.filter((o) => o.agente_id === user.id);

      setState({ ocorrencias: minhas, loading: false, error: null });
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: "Não foi possível carregar as ocorrências." }));
    }
  }, [user?.id]);

  return { ...state, fetch };
}