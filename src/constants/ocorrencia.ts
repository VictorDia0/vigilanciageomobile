import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";
import type { OcorrenciaStatus } from "@/src/types/ocorrencia";

type IconName = keyof typeof Ionicons.glyphMap;

export const OCORRENCIAS_DASHBOARD_LIMIT = 3;

// ─── Status — fonte única p/ lista, dashboard e mapa ─────────────────────────

export const OCORRENCIA_STATUS_CFG: Record<
  OcorrenciaStatus,
  { label: string; color: string; icon: IconName }
> = {
  pendente:  { label: "Pendente",     color: C.warning, icon: "time-outline" },
  andamento: { label: "Em andamento", color: C.primary, icon: "sync-outline" },
  resolvido: { label: "Resolvida",    color: C.success, icon: "checkmark-circle-outline" },
  cancelado: { label: "Cancelada",    color: C.danger,  icon: "close-circle-outline" },
};

export function ocorrenciaStatusCfg(status: string | null | undefined) {
  return (
    OCORRENCIA_STATUS_CFG[status as OcorrenciaStatus] ??
    OCORRENCIA_STATUS_CFG.pendente
  );
}

// ─── Tipos de ocorrência ─────────────────────────────────────────────────────

export const TIPO_CORES: Record<string, string> = {
  dengue:       "#EF4444",
  escorpiao:    "#F97316",
  entulho:      "#8B5CF6",
  caramujo:     "#06B6D4",
  leishmaniose: "#EC4899",
};

export const TIPO_NOMES: Record<string, string> = {
  dengue:       "Dengue",
  escorpiao:    "Escorpião",
  entulho:      "Entulho",
  caramujo:     "Caramujo",
  leishmaniose: "Leishmaniose",
};

export const TIPO_ICONES: Record<string, IconName> = {
  dengue:       "bug-outline",
  escorpiao:    "warning-outline",
  entulho:      "trash-outline",
  caramujo:     "ellipse-outline",
  leishmaniose: "medical-outline",
};

export const TIPOS = Object.keys(TIPO_NOMES) as string[];

export function tipoOcorrenciaCfg(tipo: string | null | undefined): {
  label: string;
  icon: IconName;
} {
  if (tipo && TIPO_NOMES[tipo]) {
    return { label: TIPO_NOMES[tipo], icon: TIPO_ICONES[tipo] };
  }
  return { label: "Outros", icon: "help-circle-outline" };
}
