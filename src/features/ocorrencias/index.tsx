import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, ErrorBanner, EmptyState, LoadingView } from "@/src/components/ui";
import { useOcorrenciasAgente } from "@/src/hooks/useOcorrenciasAgente";
import { OcorrenciasMap } from "@/src/components/ocorrencias/OcorrenciaMap";
import { OcorrenciaCard } from "./components/OcorrenciaCard";
import { FilterBar, type FilterId } from "./components/FilterBar";

export default function Ocorrencias() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ocorrencias, loading, error, fetch } = useOcorrenciasAgente();
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState<FilterId>("todas");

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  const counts: Record<FilterId, number> = useMemo(
    () => ({
      todas:     ocorrencias.length,
      pendente:  ocorrencias.filter((o) => o.status === "pendente").length,
      andamento: ocorrencias.filter((o) => o.status === "andamento").length,
      resolvido: ocorrencias.filter((o) => o.status === "resolvido").length,
      cancelado: ocorrencias.filter((o) => o.status === "cancelado").length,
    }),
    [ocorrencias]
  );

  const filtradas = useMemo(
    () =>
      filtro === "todas"
        ? ocorrencias
        : ocorrencias.filter((o) => o.status === filtro),
    [ocorrencias, filtro]
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ gap: 2 }}>
            <Text style={s.title}>Ocorrências</Text>
            <Text style={s.subtitle}>Suas ocorrências registradas</Text>
          </View>
          <Pressable
            style={s.newBtn}
            onPress={() => router.push("/(app)/ocorrencias/nova")}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={s.newBtnText}>Nova</Text>
          </Pressable>
        </View>

        {/* Resumo */}
        <View style={s.summaryCard}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{counts.todas}</Text>
            <Text style={s.summaryLabel}>Total</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: C.warning }]}>
              {counts.pendente}
            </Text>
            <Text style={s.summaryLabel}>Pendentes</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: C.primary }]}>
              {counts.andamento}
            </Text>
            <Text style={s.summaryLabel}>Andamento</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={[s.summaryValue, { color: C.success }]}>
              {counts.resolvido}
            </Text>
            <Text style={s.summaryLabel}>Resolvidas</Text>
          </View>
        </View>

        {/* Mapa */}
        <OcorrenciasMap ocorrencias={ocorrencias} height={260} />

        {/* Filtros */}
        <FilterBar selected={filtro} onSelect={setFiltro} counts={counts} />

        {/* Lista */}
        {loading ? (
          <LoadingView paddingVertical={32} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title={
              filtro === "todas"
                ? "Nenhuma ocorrência"
                : "Nenhuma ocorrência nesse status"
            }
            subtitle={
              filtro === "todas"
                ? "Você ainda não registrou ocorrências."
                : "Tente outro filtro ou registre uma nova ocorrência."
            }
          />
        ) : (
          filtradas.map((oc) => <OcorrenciaCard key={oc.id} oc={oc} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  header:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title:    { fontSize: 28, fontWeight: "700", color: C.text },
  subtitle: { fontSize: 14, color: C.textSec },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  newBtnText: { fontSize: 13, fontWeight: "600", color: "#FFF" },

  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  summaryItem:    { flex: 1, alignItems: "center", gap: 4 },
  summaryValue:   { fontSize: 22, fontWeight: "700", color: C.text },
  summaryLabel:   { fontSize: 11, color: C.textSec },
  summaryDivider: { width: 1, height: 30, backgroundColor: C.border },
});
