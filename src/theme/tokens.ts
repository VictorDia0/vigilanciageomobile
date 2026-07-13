// src/theme/tokens.ts

export const C = {
  // Cores primárias
  primary: "#0A5CFF",
  primaryDark: "#0745CC",
  primaryLight: "#E8F0FF",
  primaryTransparent: "rgba(10, 92, 255, 0.1)",

  // Cores de sucesso
  success: "#00C47A",
  successDark: "#009E62",
  successLight: "#E6F9F0",
  successTransparent: "rgba(0, 196, 122, 0.1)",

  // Cores de alerta
  warning: "#FFB800",
  warningDark: "#CC9200",
  warningLight: "#FFF8E6",
  warningTransparent: "rgba(255, 184, 0, 0.1)",

  // Cores de erro
  danger: "#FF3B30",
  dangerDark: "#CC2F26",
  dangerLight: "#FFEAE8",
  dangerTransparent: "rgba(255, 59, 48, 0.1)",

  // Cores de fundo
  bg: "#F5F7FA", // Adicionando bg como alias para background
  background: "#F5F7FA",
  surface: "#FFFFFF",

  // Cores de texto
  text: "#1A1F36",
  textSec: "#5A6A7D",
  textMut: "#9AA5B4",
  textLight: "#B8C4D0",

  // Cores de borda
  border: "#E8ECF0",
  borderLight: "#F0F2F5",

  // Sombras
  shadow: "rgba(10, 92, 255, 0.08)",
  shadowDark: "rgba(0, 0, 0, 0.12)",

  // Cores de status
  status: {
    ativo: "#00C47A",
    pendente: "#FFB800",
    em_andamento: "#0A5CFF",
    concluido: "#00C47A",
    cancelado: "#FF3B30",
    aguardando: "#9AA5B4",
  },

  // Cores de tipo de ocorrência
  tipos: {
    dengue: "#FF3B30",
    zika: "#FFB800",
    chikungunya: "#0A5CFF",
    outros: "#9AA5B4",
  },

  // Cores de prioridade
  prioridade: {
    baixa: "#00C47A",
    media: "#FFB800",
    alta: "#0A5CFF",
    urgente: "#FF3B30",
  },

  // Gradientes
  gradients: {
    primary: ["#0A5CFF", "#0745CC"] as const,
    success: ["#00C47A", "#009E62"] as const,
    warning: ["#FFB800", "#CC9200"] as const,
    danger: ["#FF3B30", "#CC2F26"] as const,
  },

  // Espaçamentos
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Tamanhos de fonte
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
  },

  // Pesos de fonte
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  // Raios de borda
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
};

// ─── Exportando shadows separadamente ──────────────────────────────────────

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: "#0A5CFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── Exportando cardStyles separadamente ──────────────────────────────────

export const cardStyles = {
  default: {
    backgroundColor: C.surface,
    borderRadius: C.borderRadius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: C.spacing.lg,
    ...shadows.small,
  },
  elevated: {
    backgroundColor: C.surface,
    borderRadius: C.borderRadius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: C.spacing.lg,
    ...shadows.medium,
  },
  primary: {
    backgroundColor: C.primary + "08",
    borderRadius: C.borderRadius.lg,
    borderWidth: 1,
    borderColor: C.primary + "20",
    padding: C.spacing.lg,
    ...shadows.small,
  },
  success: {
    backgroundColor: C.success + "08",
    borderRadius: C.borderRadius.lg,
    borderWidth: 1,
    borderColor: C.success + "20",
    padding: C.spacing.lg,
    ...shadows.small,
  },
};

// ─── Exportação padrão ──────────────────────────────────────────────────────

export default {
  C,
  shadows,
  cardStyles,
};