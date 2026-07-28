import { useCallback, useMemo, useState } from "react";
import { agenteService } from "@/src/services/agenteService";
import { ocorrenciaService } from "@/src/services/ocorrenciaService";
import { useAuthStore } from "@/src/store/authStore";

export interface RankingAgenteItem {
  agenteId: number;
  nome: string;
  totalOcorrencias: number;
  resolvidas: number;
  posicao: number;
  souEu: boolean;
}

/**
 * Mesmo cálculo do ranking do admin web (produtividade por volume de
 * ocorrências atribuídas) — não existe endpoint de ranking no backend, é
 * derivado de /agentes + /ocorrencias em ambos os lados.
 */
export function useRankingAgentes() {
  const { user } = useAuthStore();
  const [ranking, setRanking] = useState<RankingAgenteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentes, ocorrencias] = await Promise.all([
        agenteService.list(),
        ocorrenciaService.list(),
      ]);

      // Sem filtro por role: /agentes só devolve quem já tem registro na
      // tabela agentes (ou seja, já é agente de campo por definição). O
      // campo `role` do AgenteResource, aliás, vem sempre null no backend
      // hoje (usa $this->user->role, que não existe — o projeto usa Spatie
      // roles via relação `roles`, não uma coluna role simples).
      const ordenado = agentes
        .map((a) => {
          const doAgente = ocorrencias.filter((o) => o.agente_id === a.id);
          return {
            agenteId: a.id,
            nome: a.nome,
            totalOcorrencias: doAgente.length,
            resolvidas: doAgente.filter((o) => o.status === "resolvido").length,
            souEu: a.id === user?.agente?.id,
          };
        })
        .sort((x, y) => y.totalOcorrencias - x.totalOcorrencias)
        .map((item, i) => ({ ...item, posicao: i + 1 }));

      setRanking(ordenado);
    } catch {
      setError("Não foi possível carregar o ranking.");
    } finally {
      setLoading(false);
    }
  }, [user?.agente?.id]);

  // Top 3 + minha posição — ou top 4 direto, se eu já estiver entre os 3
  // primeiros (evita duplicar meu próprio card).
  const exibidos = useMemo(() => {
    const minha = ranking.find((r) => r.souEu);
    if (!minha || minha.posicao <= 3) {
      return ranking.slice(0, 4);
    }
    return [...ranking.slice(0, 3), minha];
  }, [ranking]);

  return { exibidos, totalAgentes: ranking.length, loading, error, fetch };
}
