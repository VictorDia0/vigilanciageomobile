import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { C } from "@/src/theme/tokens";
import type { OcorrenciaStatus } from "@/src/types/ocorrencia";

export type FilterId = "todas" | OcorrenciaStatus;

export const FILTROS: { id: FilterId; label: string }[] = [
  { id: "todas",     label: "Todas" },
  { id: "pendente",  label: "Pendentes" },
  { id: "andamento", label: "Em andamento" },
  { id: "resolvido", label: "Resolvidas" },
  { id: "cancelado", label: "Canceladas" },
];

interface Props {
  selected: FilterId;
  onSelect: (id: FilterId) => void;
  counts: Record<FilterId, number>;
}

export function FilterBar({ selected, onSelect, counts }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scroll}>
      <View style={s.row}>
        {FILTROS.map((f) => {
          const active = selected === f.id;
          return (
            <Pressable
              key={f.id}
              style={[s.btn, active && s.btnActive]}
              onPress={() => onSelect(f.id)}
            >
              <Text style={[s.text, active && s.textActive]}>{f.label}</Text>
              {counts[f.id] > 0 && (
                <View style={[s.badge, active && s.badgeActive]}>
                  <Text style={[s.badgeText, active && s.badgeTextActive]}>
                    {counts[f.id]}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row:    { flexDirection: "row", gap: 8, paddingRight: 4 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  btnActive:  { backgroundColor: C.primary, borderColor: C.primary },
  text:       { fontSize: 13, color: C.textSec, fontWeight: "500" },
  textActive: { color: "#FFF" },
  badge: {
    backgroundColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeActive:     { backgroundColor: "rgba(255,255,255,0.25)" },
  badgeText:       { fontSize: 11, fontWeight: "600", color: C.textSec },
  badgeTextActive: { color: "#FFF" },
});
