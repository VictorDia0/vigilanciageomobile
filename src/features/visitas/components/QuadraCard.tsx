import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, shadows } from "@/src/theme/tokens";
import { StatusPill } from "@/src/components/ui";
import { quadraStatusCfg } from "@/src/constants/visita";
import type { Quadra } from "@/src/types/quadra";

interface Props {
  quadra: Quadra;
  onPress: () => void;
}

export function QuadraCard({ quadra, onPress }: Props) {
  const cfg = quadraStatusCfg(quadra.status);

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.pressed]}
      onPress={onPress}
    >
      <View style={s.content}>
        <Text style={[s.numero, { color: cfg.color }]}>
          {String(quadra.numero).padStart(3, "0")}
        </Text>
        <View style={s.right}>
          <StatusPill label={cfg.label} color={cfg.color} />
          <Ionicons name="chevron-forward" size={18} color={C.textMut} />
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    ...shadows.small,
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.8 },
  content: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  numero:  { fontSize: 18, fontWeight: "700" },
  right:   { flexDirection: "row", alignItems: "center", gap: 8 },
});
