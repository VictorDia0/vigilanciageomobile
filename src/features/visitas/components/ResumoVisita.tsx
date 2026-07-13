import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, shadows } from "@/src/theme/tokens";
import type { Visita } from "@/src/types/visita";

interface Props {
  visita: Visita | null;
}

interface ItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
}

function Item({ icon, value, label }: ItemProps) {
  return (
    <View style={s.item}>
      <View style={s.itemIcon}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
      <Text style={s.itemValue}>{value}</Text>
      <Text style={s.itemLabel}>{label}</Text>
    </View>
  );
}

export function ResumoVisita({ visita }: Props) {
  const data = visita?.data
    ? new Date(visita.data).toLocaleDateString("pt-BR")
    : "Hoje";

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[C.primary, C.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.gradient}
      >
        <View style={s.header}>
          <View>
            <Text style={s.title}>Visita em andamento</Text>
            <Text style={s.subtitle}>{data}</Text>
          </View>
          <View style={s.status}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Ativa</Text>
          </View>
        </View>

        <View style={s.grid}>
          <Item icon="home-outline" value={visita?.total_imoveis ?? 0} label="Imóveis" />
          <View style={s.divider} />
          <Item icon="bug-outline" value={visita?.total_focos_eliminados ?? 0} label="Focos" />
          <View style={s.divider} />
          <Item icon="medkit-outline" value={`${visita?.total_larvicida ?? 0}g`} label="Larvicida" />
        </View>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { borderRadius: 16, overflow: "hidden", ...shadows.medium },
  gradient: { padding: 20 },
  header:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title:    { fontSize: 18, fontWeight: "700", color: "#FFF" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  statusText: { fontSize: 12, fontWeight: "600", color: "#FFF" },
  grid:       { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  item:       { alignItems: "center", gap: 4 },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  itemValue: { fontSize: 24, fontWeight: "800", color: "#FFF" },
  itemLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  divider:   { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.2)" },
});
