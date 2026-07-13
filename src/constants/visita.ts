import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";
import type { SituacaoImovel } from "@/src/types/visita";
import type { QuadraStatus } from "@/src/types/quadra";

type IconName = keyof typeof Ionicons.glyphMap;

// ─── Situação do imóvel (N/R/F/REC) — fonte única p/ todas as telas ──────────

export interface SituacaoConfig {
  label: string;
  color: string;
  icon: IconName;
}

export const SITUACAO_CFG: Record<SituacaoImovel, SituacaoConfig> = {
  N:   { label: "Normal",     color: C.success, icon: "checkmark-circle" },
  REC: { label: "Recuperado", color: C.primary, icon: "refresh-circle" },
  R:   { label: "Recusa",     color: C.danger,  icon: "close-circle" },
  F:   { label: "Fechado",    color: C.warning, icon: "lock-closed" },
};

export function situacaoCfg(value: string | undefined | null): SituacaoConfig {
  return (
    SITUACAO_CFG[value as SituacaoImovel] ?? {
      label: value ?? "—",
      color: C.textMut,
      icon: "home-outline",
    }
  );
}

/** Opções do form de registro (ordem de exibição). */
export const SITUACOES_FORM: { value: SituacaoImovel; label: string; color: string }[] = (
  ["N", "REC", "R", "F"] as SituacaoImovel[]
).map((value) => ({ value, ...SITUACAO_CFG[value] }));

/** Resultados possíveis de uma revisita de recuperação. */
export const RESULTADOS_RECUPERACAO: {
  value: SituacaoImovel;
  label: string;
  icon: IconName;
  color: string;
}[] = [
  { value: "REC", ...SITUACAO_CFG.REC, label: "Recuperado" },
  { value: "R",   ...SITUACAO_CFG.R,   label: "Recusa" },
  { value: "F",   ...SITUACAO_CFG.F,   label: "Fechado de novo" },
];

// ─── Status da quadra no tratamento ──────────────────────────────────────────

export const QUADRA_STATUS_CFG: Record<QuadraStatus, { label: string; color: string }> = {
  nao_iniciada: { label: "Não iniciada", color: C.textMut },
  em_andamento: { label: "Em andamento", color: C.warning },
  concluida:    { label: "Concluída",    color: C.success },
};

export function quadraStatusCfg(status: string | undefined | null) {
  return QUADRA_STATUS_CFG[status as QuadraStatus] ?? QUADRA_STATUS_CFG.nao_iniciada;
}

// ─── Tipos de imóvel ─────────────────────────────────────────────────────────

export const TIPOS_IMOVEL: { value: string; label: string; icon: IconName }[] = [
  { value: "residencia",        label: "Residência",        icon: "home" },
  { value: "comercio",          label: "Comércio",          icon: "business" },
  { value: "terreno_baldio",    label: "Terreno baldio",    icon: "leaf" },
  { value: "ponto_estrategico", label: "Ponto estratégico", icon: "star" },
  { value: "outro",             label: "Outro",             icon: "ellipsis-horizontal" },
];
