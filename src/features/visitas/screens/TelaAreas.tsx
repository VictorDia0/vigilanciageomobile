import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { PageHeader, EmptyState, ErrorBanner, LoadingView } from "@/src/components/ui";
import { AreaCard } from "../components/AreaCard";
import { useVisitasContext } from "../context/VisitasContext";
import type { Area } from "@/src/types/area";

interface Props {
  areas: Area[];
  loading: boolean;
  error: string | null;
}

export function TelaAreas({ areas, loading, error }: Props) {
  const { selecionarArea } = useVisitasContext();
  const router = useRouter();

  return (
    <View style={s.container}>
      <PageHeader title="Visitas" subtitle="Selecione sua área de trabalho" />
      {error && <ErrorBanner message={error} />}

      {/* Atalho: imóveis fechados aguardando revisita */}
      <Pressable
        style={({ pressed }) => [s.recupCard, pressed && { opacity: 0.85 }]}
        onPress={() => router.push("/(app)/visitas/recuperacao")}
      >
        <View style={s.recupIcon}>
          <Ionicons name="refresh-circle-outline" size={22} color={C.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.recupTitle}>Recuperação</Text>
          <Text style={s.recupSubtitle}>Revisitar imóveis fechados</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textMut} />
      </Pressable>

      {loading ? (
        <LoadingView message="Carregando áreas..." fill />
      ) : areas.length === 0 ? (
        <EmptyState
          icon="map-outline"
          title="Nenhuma área atribuída"
          subtitle="Fale com seu coordenador para ser atribuído a uma área."
        />
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.listTitle}>
            Área{areas.length > 1 ? "s" : ""} disponíveis
          </Text>
          {areas.map((area) => (
            <AreaCard key={area.id} area={area} onPress={() => selecionarArea(area)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 10, gap: 16 },

  list:      { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  listTitle: { fontSize: 15, fontWeight: "600", color: C.text, marginBottom: 4 },

  recupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    backgroundColor: C.warning + "0A",
    borderWidth: 1,
    borderColor: C.warning + "30",
    borderRadius: 14,
    padding: 14,
  },
  recupIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.warning + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  recupTitle:    { fontSize: 14, fontWeight: "600", color: C.text },
  recupSubtitle: { fontSize: 12, color: C.textSec },
});
