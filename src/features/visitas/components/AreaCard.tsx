import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, shadows } from "@/src/theme/tokens";
import type { Area } from "@/src/types/area";

interface Props {
  area: Area;
  onPress: () => void;
}

function corDoProgresso(progresso: number): string {
  if (progresso >= 80) return C.success;
  if (progresso >= 40) return C.primary;
  return C.warning;
}

export function AreaCard({ area, onPress }: Props) {
  const totalQuadras = area.quadras?.length ?? 0;
  const concluidas =
    area.quadras?.filter((q) => q.status === "concluida").length ?? 0;
  const progresso =
    totalQuadras > 0 ? Math.round((concluidas / totalQuadras) * 100) : 0;
  const cor = corDoProgresso(progresso);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.pressed]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={[s.icon, { backgroundColor: cor + "15" }]}>
            <LinearGradient
              colors={[cor, cor + "CC"]}
              style={s.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="map" size={22} color="#FFF" />
            </LinearGradient>
          </View>
          <View style={s.info}>
            <Text style={s.title}>{area.nome}</Text>
            <View style={s.location}>
              <Ionicons name="location-outline" size={12} color={C.textMut} />
              <Text style={s.subtitle}>
                {totalQuadras} quarteirões • {concluidas} concluídos
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={C.textSec} />
      </View>

      {/* Progresso */}
      <View style={s.progressRow}>
        <View style={s.progressBar}>
          <View
            style={[s.progressFill, { width: `${progresso}%`, backgroundColor: cor }]}
          />
        </View>
        <Text style={[s.progressText, { color: cor }]}>{progresso}%</Text>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.stats}>
          <View style={s.stat}>
            <Ionicons name="grid-outline" size={14} color={C.textMut} />
            <Text style={s.statText}>{totalQuadras}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Ionicons name="checkmark-circle-outline" size={14} color={C.success} />
            <Text style={s.statText}>{concluidas}</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Ionicons name="time-outline" size={14} color={C.warning} />
            <Text style={s.statText}>{totalQuadras - concluidas}</Text>
          </View>
        </View>
        <View style={[s.badge, { backgroundColor: cor + "15" }]}>
          <View style={[s.badgeDot, { backgroundColor: cor }]} />
          <Text style={[s.badgeText, { color: cor }]}>
            {progresso === 100 ? "Concluída" : progresso >= 50 ? "Em andamento" : "Iniciar"}
          </Text>
        </View>
      </View>
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
    gap: 12,
    ...shadows.small,
  },
  pressed:     { transform: [{ scale: 0.98 }], opacity: 0.8 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  icon:        { width: 44, height: 44, borderRadius: 12, overflow: "hidden" },
  iconGradient:{ flex: 1, alignItems: "center", justifyContent: "center" },
  info:        { flex: 1 },
  title:       { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 2 },
  location:    { flexDirection: "row", alignItems: "center", gap: 4 },
  subtitle:    { fontSize: 12, color: C.textSec },

  progressRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  progressBar:  { flex: 1, height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: "600", minWidth: 36, textAlign: "right" },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  stats:       { flexDirection: "row", alignItems: "center", gap: 8 },
  stat:        { flexDirection: "row", alignItems: "center", gap: 4 },
  statDivider: { width: 1, height: 16, backgroundColor: C.border },
  statText:    { fontSize: 13, fontWeight: "500", color: C.text },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeDot:  { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" },
});
