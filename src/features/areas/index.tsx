import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, shadows } from "@/src/theme/tokens";
import { Screen, ErrorBanner, LoadingView } from "@/src/components/ui";
import { useAreasAgente } from "@/src/hooks/useAreasAgente";
import { calcularProgressoArea } from "@/src/mappers/area";
import { AreaCard } from "./components/AreaCard";

// ─── Card de resumo do topo ──────────────────────────────────────────────────

interface ResumoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  value: string | number;
  valueColor?: string;
  label: string;
  cardStyle: object;
}

function ResumoItem({ icon, iconBg, iconColor, value, valueColor, label, cardStyle }: ResumoItemProps) {
  return (
    <View style={[s.summaryCard, cardStyle]}>
      <View style={[s.summaryIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[s.summaryValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function Areas() {
  const insets = useSafeAreaInsets();
  const { areas, loading, error, fetch } = useAreasAgente();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  const totalQuadras = areas.reduce(
    (acc, a) => acc + (a.quadras?.length ?? a.total_quadras ?? 0),
    0
  );
  const totalConcluidas = areas.reduce(
    (acc, a) =>
      acc + (a.quadras?.filter((q) => q.status === "concluida").length ?? 0),
    0
  );
  const mediaProgresso =
    areas.length > 0
      ? Math.round(
          areas.reduce((acc, a) => acc + calcularProgressoArea(a), 0) /
            areas.length
        )
      : 0;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 50 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
      >
        {/* Header com gradiente */}
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.gradientCard}
        >
          <View style={s.gradientHeader}>
            <View>
              <Text style={s.gradientTitle}>Minhas Áreas</Text>
              <Text style={s.gradientSubtitle}>
                Áreas atribuídas ao seu perfil
              </Text>
            </View>
            <View style={s.gradientIcon}>
              <Ionicons name="map" size={32} color="#FFF" />
            </View>
          </View>
        </LinearGradient>

        {/* Resumo */}
        <View style={s.summaryGrid}>
          <ResumoItem
            icon="layers-outline"
            iconBg={C.primaryLight}
            iconColor={C.primary}
            value={areas.length}
            label="Áreas"
            cardStyle={s.summaryPrimary}
          />
          <ResumoItem
            icon="grid-outline"
            iconBg={C.successLight}
            iconColor={C.success}
            value={totalQuadras}
            label="Quadras"
            cardStyle={s.summarySuccess}
          />
          <ResumoItem
            icon="checkmark-done-outline"
            iconBg={C.warningLight}
            iconColor={C.warning}
            value={totalConcluidas}
            label="Concluídas"
            cardStyle={s.summaryWarning}
          />
          <ResumoItem
            icon="trending-up-outline"
            iconBg={C.primaryLight}
            iconColor={C.primary}
            value={`${mediaProgresso}%`}
            valueColor={C.primary}
            label="Média"
            cardStyle={s.summaryPrimary}
          />
        </View>

        <Text style={s.sectionTitle}>
          Área{areas.length !== 1 ? "s" : ""}
        </Text>

        {loading ? (
          <LoadingView message="Carregando áreas..." paddingVertical={40} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : areas.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="map-outline" size={56} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>Nenhuma área atribuída</Text>
            <Text style={s.emptySubtitle}>
              Você ainda não possui áreas vinculadas ao seu perfil.
            </Text>
            <Pressable style={s.emptyBtn}>
              <Text style={s.emptyBtnText}>Solicitar áreas</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </Pressable>
          </View>
        ) : (
          areas.map((area) => <AreaCard key={area.id} area={area} />)
        )}
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  gradientCard:   { borderRadius: 16, padding: 20, ...shadows.medium },
  gradientHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gradientTitle:  { fontSize: 24, fontWeight: "700", color: "#FFF", marginBottom: 4 },
  gradientSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  gradientIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    ...shadows.small,
  },
  summaryPrimary: { borderColor: C.primary + "30", backgroundColor: C.primaryLight },
  summarySuccess: { borderColor: C.success + "30", backgroundColor: C.successLight },
  summaryWarning: { borderColor: C.warning + "30", backgroundColor: C.warningLight },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  summaryValue: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: C.textSec },

  sectionTitle: { fontSize: 17, fontWeight: "600", color: C.text, marginTop: 4 },

  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle:    { fontSize: 18, fontWeight: "600", color: C.text },
  emptySubtitle: { fontSize: 14, color: C.textSec, textAlign: "center", maxWidth: 260 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
});
