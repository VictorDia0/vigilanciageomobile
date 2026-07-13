import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { C, shadows } from "@/src/theme/tokens";
import {
  PageHeader,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  WarningBanner,
  LoadingView,
} from "@/src/components/ui";
import { ResumoVisita } from "../components/ResumoVisita";
import { ImovelItem } from "../components/ImovelItem";
import { useVisitasContext } from "../context/VisitasContext";

export function TelaVisitaAberta() {
  const {
    visitaAberta,
    quadraSelecionada,
    areaSelecionada,
    imoveis,
    loading,
    error,
    successMsg,
    novoImovel,
    encerrarDia,
    encerrarQuadra,
    totalFechados,
    pendentesSync,
    sincronizar,
    voltar,
  } = useVisitasContext();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    if (pendentesSync > 0) await sincronizar();
    setRefreshing(false);
  };

  // ── Pausa/fim de expediente: quadra CONTINUA em andamento ──────────────────
  const handleEncerrarDia = () => {
    Alert.alert(
      "Encerrar visitas do dia",
      `Você registrou ${imoveis.length} imóvel(is) neste quarteirão.\n\nO quarteirão continua em andamento — amanhã (ou depois do almoço) você retoma de onde parou.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Encerrar o dia", onPress: encerrarDia },
      ]
    );
  };

  // ── Definitivo: quadra concluída, não reabre ────────────────────────────────
  const handleEncerrarQuadra = () => {
    const avisoFechados =
      totalFechados > 0
        ? `\n\nAtenção: ${totalFechados} imóvel(is) fechado(s) irão para a lista de Recuperação.`
        : "";
    Alert.alert(
      "Encerrar quarteirão",
      `Esta ação é permanente — o quarteirão não poderá ser reaberto.${avisoFechados}\n\nDeseja concluir?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Encerrar quarteirão", style: "destructive", onPress: encerrarQuadra },
      ]
    );
  };

  return (
    <View style={s.container}>
      <PageHeader
        title={`Quarteirão ${quadraSelecionada?.numero ?? ""}`}
        subtitle={areaSelecionada?.nome}
        onBack={voltar}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
      >
        {error && <ErrorBanner message={error} />}
        {successMsg && <SuccessBanner message={successMsg} />}
        {pendentesSync > 0 && (
          <WarningBanner
            icon="cloud-upload-outline"
            message={`${pendentesSync} registro(s) offline — toque para sincronizar`}
            onPress={sincronizar}
          />
        )}

        <ResumoVisita visita={visitaAberta} />

        {/* Lista de imóveis */}
        {loading && !refreshing ? (
          <LoadingView message="Carregando imóveis..." paddingVertical={40} />
        ) : imoveis.length === 0 ? (
          <EmptyState
            icon="home-outline"
            title="Nenhum imóvel registrado"
            subtitle="Toque no botão abaixo para registrar o primeiro imóvel."
            actionLabel="Registrar imóvel"
            onAction={novoImovel}
          />
        ) : (
          <View style={s.list}>
            <View style={s.listHeader}>
              <Text style={s.listTitle}>Imóveis visitados</Text>
              <View style={s.listBadge}>
                <Text style={s.listBadgeText}>{imoveis.length}</Text>
              </View>
            </View>
            {imoveis.map((imovel) => (
              <ImovelItem key={imovel.id} imovel={imovel} />
            ))}
          </View>
        )}

        {/* Ações */}
        <View style={s.actions}>
          <Pressable
            style={({ pressed }) => [s.btnPrimary, pressed && s.btnPressed]}
            onPress={novoImovel}
          >
            <LinearGradient
              colors={[C.primary, C.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btnPrimaryGradient}
            >
              <Ionicons name="add-circle-outline" size={22} color="#FFF" />
              <Text style={s.btnPrimaryText}>Registrar imóvel</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.btnDia,
              pressed && s.btnPressed,
              loading && s.btnDisabled,
            ]}
            disabled={loading}
            onPress={handleEncerrarDia}
          >
            <Ionicons name="moon-outline" size={20} color={C.danger} />
            <Text style={s.btnDiaText}>Encerrar visitas do dia</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.btnQuadra,
              pressed && s.btnPressed,
              loading && s.btnDisabled,
            ]}
            disabled={loading}
            onPress={handleEncerrarQuadra}
          >
            <Ionicons name="checkmark-done-circle-outline" size={18} color={C.success} />
            <Text style={s.btnQuadraText}>Encerrar quarteirão (definitivo)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll:    { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },

  // Lista
  list:          { gap: 10 },
  listHeader:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  listTitle:     { fontSize: 15, fontWeight: "600", color: C.text },
  listBadge:     { backgroundColor: C.primary + "12", paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 },
  listBadgeText: { fontSize: 12, fontWeight: "600", color: C.primary },

  // Ações
  actions:    { gap: 10, marginTop: 4 },
  btnPressed: { transform: [{ scale: 0.98 }] },
  btnDisabled:{ opacity: 0.5 },

  btnPrimary: { borderRadius: 14, overflow: "hidden", ...shadows.primary },
  btnPrimaryGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    minHeight: 56,
  },
  btnPrimaryText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  btnDia: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 14,
    height: 52,
    borderWidth: 2,
    borderColor: C.danger + "20",
  },
  btnDiaText: { color: C.danger, fontWeight: "600", fontSize: 15 },

  btnQuadra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 14,
    height: 52,
    borderWidth: 1,
    borderColor: C.success + "50",
  },
  btnQuadraText: { color: C.success, fontWeight: "600", fontSize: 15 },
});
