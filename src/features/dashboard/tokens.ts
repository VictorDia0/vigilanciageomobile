import { C as theme } from "@/src/theme/tokens";

/**
 * Alias local do tema global. NAO redefinir cores aqui.
 * Fonte unica: src/theme/tokens.ts (so muda o nome de alguns campos).
 */
export const C = {
  primary:       theme.primary,
  success:       theme.success,
  warning:       theme.warning,
  danger:        theme.danger,
  background:    theme.background,
  surface:       theme.surface,
  text:          theme.text,
  textSecondary: theme.textSec,
  textMuted:     theme.textMut,
  border:        theme.border,
} as const;
