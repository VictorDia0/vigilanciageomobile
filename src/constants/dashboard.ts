import type { DashboardData } from "@/src/types/dashboard";

export const DASHBOARD_EMPTY_STATE: DashboardData = {
    tratamento: null,
    areas: { total: 0, ativas: 0, lista: [] },
    quadras: { total: 0, nao_iniciadas: 0, em_andamento: 0, concluidas: 0 },
    ocorrencias: { total: 0, pendentes: 0, em_andamento: 0, lista: [] },
};