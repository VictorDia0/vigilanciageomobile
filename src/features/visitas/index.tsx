import { useEffect } from "react";
import { Screen, EmptyState, LoadingView } from "@/src/components/ui";
import { useVisitas } from "@/src/hooks/useVisitas";
import { useAreasAgente } from "@/src/hooks/useAreasAgente";
import { useDashboardAgente } from "@/src/hooks/useDashboardAgente";
import { VisitasContext } from "./context/VisitasContext";
import { TelaAreas } from "./screens/TelaAreas";
import { TelaQuadras } from "./screens/TelaQuadras";
import { TelaIniciarVisita } from "./screens/TelaIniciarVisita";
import { TelaVisitaAberta } from "./screens/TelaVisitaAberta";
import { TelaFormImovel } from "./screens/TelaFormImovel";

/**
 * Orquestra o fluxo de visitas por steps (máquina de estados em useVisitas).
 * selecionar_area → selecionar_quadra → confirmar_inicio → visita_aberta ⇄ form_imovel
 */
export default function Visitas() {
  const hook = useVisitas();
  const {
    areas,
    loading: loadingAreas,
    error: errorAreas,
    fetch: fetchAreas,
  } = useAreasAgente();
  const {
    data: dashboard,
    fetch: fetchDashboard,
    loading: loadingDashboard,
  } = useDashboardAgente();

  useEffect(() => {
    fetchAreas();
    fetchDashboard();
    // Reenvia registros feitos sem conexão
    hook.sincronizar().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (areas.length > 0) hook.setAreas(areas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas]);

  const tratamentoId = dashboard.tratamento?.id ?? null;

  if (loadingDashboard) {
    return (
      <Screen centered>
        <LoadingView />
      </Screen>
    );
  }

  if (!tratamentoId) {
    return (
      <Screen>
        <EmptyState
          icon="medical-outline"
          title="Nenhum tratamento ativo"
          subtitle="Não é possível iniciar visitas sem um tratamento em andamento. Fale com seu coordenador."
        />
      </Screen>
    );
  }

  return (
    <VisitasContext.Provider value={{ ...hook, tratamentoId }}>
      <Screen>
        {hook.step === "selecionar_area" && (
          <TelaAreas areas={areas} loading={loadingAreas} error={errorAreas} />
        )}
        {hook.step === "selecionar_quadra" && <TelaQuadras />}
        {hook.step === "confirmar_inicio" && (
          <TelaIniciarVisita tratamentoId={tratamentoId} />
        )}
        {hook.step === "visita_aberta" && <TelaVisitaAberta />}
        {hook.step === "form_imovel" && <TelaFormImovel />}
      </Screen>
    </VisitasContext.Provider>
  );
}
