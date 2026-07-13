import type { Tratamento } from "./tratamento";
import type { AreasAgregadas } from "./area";
import type { QuadrasAgregadas } from "./quadra";
import type { OcorrenciasAgregadas } from "./ocorrencia";

export interface DashboardData {
  tratamento: Tratamento | null;
  areas: AreasAgregadas;
  quadras: QuadrasAgregadas;
  ocorrencias: OcorrenciasAgregadas;
}

export interface DashboardState {
  data: DashboardData;
  loading: boolean;
  error: string | null;
}