import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";
import {
  ocorrenciaStatusCfg,
  tipoOcorrenciaCfg,
} from "@/src/constants/ocorrencia";
import type { Ocorrencia } from "@/src/types/ocorrencia";

export function OcorrenciaCard({ oc }: { oc: Ocorrencia }) {
  const status = ocorrenciaStatusCfg(oc.status);
  const tipo = tipoOcorrenciaCfg(oc.tipo);

  const data = oc.data_ocorrencia
    ? new Date(oc.data_ocorrencia).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Pressable style={s.card}>
      {/* Header: tipo + status */}
      <View style={s.header}>
        <View style={[s.badge, { backgroundColor: status.color + "15" }]}>
          <Ionicons name={tipo.icon} size={13} color={status.color} />
          <Text style={[s.badgeText, { color: status.color }]}>{tipo.label}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: status.color + "15" }]}>
          <Ionicons name={status.icon} size={12} color={status.color} />
          <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {!!oc.descricao && (
        <Text style={s.descricao} numberOfLines={2}>
          {oc.descricao}
        </Text>
      )}

      {/* Rodapé: endereço + data */}
      <View style={s.footer}>
        {!!oc.endereco && (
          <View style={s.footerItem}>
            <Ionicons name="location-outline" size={12} color={C.textMut} />
            <Text style={s.footerText} numberOfLines={1}>
              {oc.endereco}
            </Text>
          </View>
        )}
        {!!data && (
          <View style={s.footerItem}>
            <Ionicons name="calendar-outline" size={12} color={C.textMut} />
            <Text style={s.footerText}>{data}</Text>
          </View>
        )}
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
    gap: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText:  { fontSize: 11, fontWeight: "600" },
  descricao:  { fontSize: 14, fontWeight: "500", color: C.text, lineHeight: 20 },
  footer:     { gap: 4 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerText: { fontSize: 12, color: C.textMut, flex: 1 },
});
