import { useState, useCallback } from "react";
import { api } from "@/src/services/api";

export interface DashboardData {
  tratamento: {
    id: number;
    numero: number;
    ano: number;
    data_inicio: string;
    data_fim: string;
    status: string;
  } | null;
  areas: {
    total: number;
    ativas: number;
  };
  quadras: {
    total: number;
    nao_iniciadas: number;
    em_andamento: number;
    concluidas: number;
  };
  ocorrencias: {
    total: number;
    pendentes: number;
    em_andamento: number;
  };
}

const EMPTY: DashboardData = {
  tratamento: null,
  areas: { total: 0, ativas: 0 },
  quadras: { total: 0, nao_iniciadas: 0, em_andamento: 0, concluidas: 0 },
  ocorrencias: { total: 0, pendentes: 0, em_andamento: 0 },
};

export function useDashboardAgente() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca áreas do agente
      const [areasRes, ocorrenciasRes] = await Promise.all([
        api.get("/areas"),
        api.get("/ocorrencias"),
      ]);

      const areas: any[] = areasRes.data?.data ?? areasRes.data ?? [];
      const ocorrencias: any[] = ocorrenciasRes.data?.data ?? ocorrenciasRes.data ?? [];

      // Agrega quadras de todas as áreas
      let quadras = { total: 0, nao_iniciadas: 0, em_andamento: 0, concluidas: 0 };
      for (const area of areas) {
        const qs: any[] = area.quadras ?? [];
        quadras.total += qs.length;
        quadras.nao_iniciadas += qs.filter((q) => q.status === "nao_iniciada").length;
        quadras.em_andamento += qs.filter((q) => q.status === "em_andamento").length;
        quadras.concluidas += qs.filter((q) => q.status === "concluida").length;
      }

      // Tratamento ativo vem das áreas (o backend já resolve)
      const tratamento = areas[0]?.tratamento_ativo ?? null;

      setData({
        tratamento,
        areas: {
          total: areas.length,
          ativas: areas.filter((a) => a.ativo).length,
        },
        quadras,
        ocorrencias: {
          total: ocorrencias.length,
          pendentes: ocorrencias.filter((o) => o.status === "pendente").length,
          em_andamento: ocorrencias.filter((o) => o.status === "em_andamento").length,
        },
      });
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetch };
}