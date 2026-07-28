import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../tokens";
import { useRankingAgentes, type RankingAgenteItem } from "@/src/hooks/useRankingAgentes";

const MEDALHA: Record<number, { cor: string; icon: keyof typeof Ionicons.glyphMap }> = {
  1: { cor: "#D4A017", icon: "trophy" },
  2: { cor: "#9AA5B1", icon: "medal" },
  3: { cor: "#B8722C", icon: "medal-outline" },
};

function CardAgente({ item }: { item: RankingAgenteItem }) {
  const medalha = MEDALHA[item.posicao];
  const primeiroNome = item.nome.split(" ")[0];

  const nomeExibido = item.souEu ? "Você" : primeiroNome;
  const rotulo = `${nomeExibido}, ${item.posicao}º lugar, ${item.totalOcorrencias} ocorrências`;

  return (
    <View style={[s.card, item.souEu && s.cardSouEu]} accessible accessibilityLabel={rotulo}>
      <View style={[s.badge, { backgroundColor: (medalha?.cor ?? C.textMuted) + "18" }]}>
        {medalha ? (
          <Ionicons name={medalha.icon} size={16} color={medalha.cor} />
        ) : (
          <Text style={s.badgePosicao}>{item.posicao}º</Text>
        )}
      </View>
      <Text style={s.nome} numberOfLines={1}>
        {item.souEu ? "Você" : primeiroNome}
      </Text>
      <Text style={s.total}>{item.totalOcorrencias}</Text>
      <Text style={s.totalLabel}>ocorrências</Text>
    </View>
  );
}

export function RankingAgentesCard() {
  const { exibidos, loading, error, fetch } = useRankingAgentes();

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle} accessibilityRole="header">Ranking de agentes</Text>
        <ActivityIndicator color={C.primary} style={{ paddingVertical: 12 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.container}>
        <Text style={s.sectionTitle} accessibilityRole="header">Ranking de agentes</Text>
        <Text style={s.erro}>{error}</Text>
      </View>
    );
  }

  if (exibidos.length === 0) return null;

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle} accessibilityRole="header">Ranking de agentes</Text>
      <Text style={s.subtitle}>Por volume de ocorrências atendidas</Text>
      <View style={s.row}>
        {exibidos.map((item) => (
          <CardAgente key={item.agenteId} item={item} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: C.text },
  subtitle: { fontSize: 12, color: C.textSecondary, marginTop: 2, marginBottom: 12 },
  erro: { fontSize: 12, color: C.danger, marginTop: 8 },
  row: { flexDirection: "row", gap: 8 },

  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.background,
  },
  cardSouEu: {
    borderColor: C.primary,
    backgroundColor: C.primary + "0D",
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  badgePosicao: { fontSize: 13, fontWeight: "700", color: C.textMuted },
  nome: { fontSize: 12, fontWeight: "600", color: C.text, maxWidth: "100%" },
  total: { fontSize: 17, fontWeight: "700", color: C.text, marginTop: 2 },
  totalLabel: { fontSize: 9, color: C.textMuted },
});
