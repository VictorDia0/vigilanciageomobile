import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, shadows } from "@/src/theme/tokens";
import { PageHeader, ErrorBanner } from "@/src/components/ui";
import { useVisitasContext } from "../context/VisitasContext";
import type { ModoInicio } from "@/src/types/visita";

// ─── Config por modo de abertura (iniciar/continuar/retomar) ─────────────────

const MODO_CFG: Record<
  ModoInicio,
  {
    titulo: string;
    botao: string;
    icone: "play-circle" | "play-forward" | "refresh-circle";
    cores: readonly [string, string];
  }
> = {
  iniciar: {
    titulo: "Nova Visita",
    botao: "Iniciar Visitas do Dia",
    icone: "play-circle",
    cores: [C.primary, C.primaryDark],
  },
  continuar: {
    titulo: "Visita em Andamento",
    botao: "Continuar Visita",
    icone: "play-forward",
    cores: [C.warning, "#E6A000"],
  },
  retomar: {
    titulo: "Retomar Quarteirão",
    botao: "Retomar Quarteirão",
    icone: "refresh-circle",
    cores: [C.warning, "#E6A000"],
  },
};

function horaAgora(): string {
  return new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dataAgora(): string {
  return new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Props {
  tratamentoId: number;
}

// ─── Componente de Informação ──────────────────────────────────────────────

function InfoItem({
  icon,
  label,
  value,
  valueColor,
  border = false,
}: {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  border?: boolean;
}) {
  return (
    <View style={[s.infoItem, border && s.infoItemBorder]}>
      <View style={s.infoIconContainer}>
        <Ionicons name={icon as any} size={20} color={C.primary} />
      </View>
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={[s.infoValue, valueColor && { color: valueColor }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─── Tela Principal ─────────────────────────────────────────────────────────

export function TelaIniciarVisita({ tratamentoId }: Props) {
  const insets = useSafeAreaInsets();
  const {
    areaSelecionada,
    quadraSelecionada,
    loading,
    error,
    iniciarVisita,
    voltar,
    modoInicio,
    imoveis,
  } = useVisitasContext();

  const hora = horaAgora();
  const data = dataAgora();

  const jaRegistrados = imoveis.length;
  const fechados = imoveis.filter(
    (i) => i.visita_dados?.situacao?.value === "F"
  ).length;

  const CFG = MODO_CFG[modoInicio];

  return (
    <View style={s.container}>
      <PageHeader title="Iniciar Visitas" onBack={voltar} />

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingBottom: insets.bottom + 100, // Só adiciona padding inferior
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {error && <ErrorBanner message={error} />}

        {/* Banner: sessão ainda aberta */}
        {modoInicio === "continuar" && (
          <View style={s.continuarBanner}>
            <Ionicons name="information-circle" size={20} color={C.warning} />
            <Text style={s.continuarText}>
              Este quarteirão tem uma visita <Text style={{ fontWeight: "700" }}>aberta agora</Text>.
              Continue de onde parou.
            </Text>
          </View>
        )}

        {/* Banner: quadra em andamento, sessão de outro dia já fechada */}
        {modoInicio === "retomar" && (
          <View style={s.continuarBanner}>
            <Ionicons name="information-circle" size={20} color={C.warning} />
            <Text style={s.continuarText}>
              Quarteirão em andamento:{" "}
              <Text style={{ fontWeight: "700" }}>{jaRegistrados} imóvel(is)</Text> já
              registrado(s){fechados > 0 ? (
                <> — <Text style={{ fontWeight: "700" }}>{fechados} fechado(s)</Text></>
              ) : null}. Uma nova sessão será aberta para hoje.
            </Text>
          </View>
        )}
        {/* Card Principal com Gradiente */}
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroCard}
        >
          <View style={s.heroContent}>
            <View style={s.heroIconContainer}>
              <Ionicons name="flag" size={24} color="#FFF" />
            </View>
            <Text style={s.heroTitle}>{CFG.titulo}</Text>
            <Text style={s.heroSubtitle}>
              {data} • {hora}
            </Text>
          </View>
        </LinearGradient>

        {/* Informações da Visita */}
        <View style={s.infoCard}>
          <InfoItem
            icon="map-outline"
            label="Área"
            value={areaSelecionada?.nome || "—"}
          />
          <InfoItem
            icon="grid-outline"
            label="Quarteirão"
            value={`Quarteirão ${quadraSelecionada?.numero || "—"}`}
            border
          />
          <InfoItem
            icon="time-outline"
            label="Hora de início"
            value={hora}
            valueColor={C.primary}
            border
          />
        </View>

        {/* Mensagem Informativa */}
        <View style={s.messageContainer}>
          <Ionicons name="information-circle-outline" size={20} color={C.primary} />
          <Text style={s.messageText}>
            Ao iniciar, você poderá registrar cada imóvel visitado neste quarteirão.
            A visita fica aberta até você encerrá-la manualmente.
          </Text>
        </View>

        {/* Dicas Rápidas */}
        <View style={s.tipsContainer}>
          <Text style={s.tipsTitle}>Dicas para a visita</Text>
          <View style={s.tipItem}>
            <View style={s.tipBullet}>
              <Ionicons name="checkmark" size={12} color={C.success} />
            </View>
            <Text style={s.tipText}>Registre cada imóvel visitado</Text>
          </View>
          <View style={s.tipItem}>
            <View style={s.tipBullet}>
              <Ionicons name="checkmark" size={12} color={C.success} />
            </View>
            <Text style={s.tipText}>Marque os imóveis concluídos</Text>
          </View>
          <View style={s.tipItem}>
            <View style={s.tipBullet}>
              <Ionicons name="checkmark" size={12} color={C.success} />
            </View>
            <Text style={s.tipText}>Encerre a visita ao finalizar</Text>
          </View>
        </View>

        {/* Botão */}
        <Pressable
          style={({ pressed }) => [s.btn, pressed && s.btnPressed, loading && s.btnDisabled]}
          onPress={() => iniciarVisita(tratamentoId)}
          disabled={loading}
        >
          <LinearGradient
            colors={CFG.cores}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name={CFG.icone} size={22} color="#FFF" />
                <Text style={s.btnText}>{CFG.botao}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 34,
    gap: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: 16,
    overflow: "hidden",
    ...shadows.medium,
  },
  heroContent: {
    padding: 24,
    alignItems: "center",
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  continuarBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.warning + "12",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.warning + "30",
    padding: 14,
  },
  continuarText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 20,
  },
  // Info Card
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    ...shadows.small,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  infoItemBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: C.textSec,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
  },

  // Message
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.primary + "08",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary + "20",
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 20,
  },

  // Tips
  tipsContainer: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    ...shadows.small,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    marginBottom: 10,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  tipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    fontSize: 13,
    color: C.textSec,
  },

  // Button
  btn: {
    borderRadius: 14,
    overflow: "hidden",
    ...shadows.primary,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    minHeight: 56,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});