import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, shadows } from "@/src/theme/tokens";
import { calcularProgressoArea, calcularStatusArea } from "@/src/mappers/area";
import type { Area } from "@/src/types/area";

const STATUS_CFG = {
  ativo:     { color: C.success, icon: "play-circle" as const,      label: "Em andamento", bg: C.successLight },
  pendente:  { color: C.warning, icon: "time" as const,             label: "Não iniciada", bg: C.warningLight },
  concluido: { color: C.primary, icon: "checkmark-circle" as const, label: "Concluída",    bg: C.primaryLight },
} as const;

function corDoProgresso(progresso: number): string {
  if (progresso >= 80) return C.success;
  if (progresso >= 40) return C.primary;
  return C.warning;
}

export function AreaCard({ area }: { area: Area }) {
  const progresso = calcularProgressoArea(area);
  const status = calcularStatusArea(area);
  const cfg = STATUS_CFG[status];
  const quadras = area.quadras?.length ?? area.total_quadras ?? 0;
  const concluidas =
    area.quadras?.filter((q) => q.status === "concluida").length ?? 0;
  const pendentes = quadras - concluidas;
  const cor = corDoProgresso(progresso);

  return (
    <Pressable style={({ pressed }) => [s.card, pressed && s.pressed]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={[s.icon, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.nome}>{area.nome}</Text>
            {!!area.cidade?.nome && (
              <View style={s.location}>
                <Ionicons name="location-outline" size={12} color={C.textMut} />
                <Text style={s.cidade}>{area.cidade.nome}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[s.status, { backgroundColor: cfg.bg }]}>
          <View style={[s.statusDot, { backgroundColor: cfg.color }]} />
          <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statValue}>{quadras}</Text>
          <Text style={s.statLabel}>Quadras</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statValue}>{concluidas}</Text>
          <Text style={s.statLabel}>Concluídas</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={[s.statValue, { color: cor }]}>{progresso}%</Text>
          <Text style={s.statLabel}>Progresso</Text>
        </View>
      </View>

      {/* Progresso */}
      <View style={s.progressRow}>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progresso}%` }]}>
            <LinearGradient
              colors={[cor, cor + "CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.progressGradient}
            />
          </View>
        </View>
        <Text style={s.progressText}>{progresso}%</Text>
      </View>

      {pendentes > 0 && (
        <View style={s.pendentesBadge}>
          <Ionicons name="alert-circle-outline" size={14} color={C.warning} />
          <Text style={s.pendentesText}>{pendentes} quadras pendentes</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
    marginBottom: 12,
    ...shadows.small,
  },
  pressed:    { transform: [{ scale: 0.98 }], opacity: 0.8 },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  icon:       { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  nome:       { fontSize: 16, fontWeight: "600", color: C.text },
  location:   { flexDirection: "row", alignItems: "center", gap: 4 },
  cidade:     { fontSize: 12, color: C.textMut },
  status:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },

  stats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.background,
    borderRadius: 10,
    padding: 10,
  },
  stat:        { flex: 1, paddingHorizontal: 4 },
  statValue:   { fontSize: 16, fontWeight: "700", color: C.text, lineHeight: 20 },
  statLabel:   { fontSize: 10, color: C.textSec, textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 30, backgroundColor: C.border, marginHorizontal: 4 },

  progressRow:      { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar:      { flex: 1, height: 8, backgroundColor: C.border, borderRadius: 4, overflow: "hidden" },
  progressFill:     { height: "100%", borderRadius: 4, overflow: "hidden" },
  progressGradient: { flex: 1, height: "100%" },
  progressText:     { fontSize: 13, fontWeight: "600", color: C.text, minWidth: 44, textAlign: "right" },

  pendentesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pendentesText: { fontSize: 11, color: C.warning, fontWeight: "500" },
});
