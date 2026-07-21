import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { C, shadows } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner, LoadingView, StatusPill } from "@/src/components/ui";
import { imovelService } from "@/src/services/imovelService";
import { situacaoCfg } from "@/src/constants/visita";
import type { Imovel } from "@/src/types/imovel";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={18} color={C.textMut} />
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function DetalhesImovel() {
  const router = useRouter();
  const { id, imovel: imovelParam } = useLocalSearchParams<{
    id: string;
    imovel?: string;
  }>();
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Quando navegado a partir da lista de imóveis da quadra, os dados já
    // vêm completos (incluindo visita_dados) — GET /imoveis/{id} não expõe
    // o histórico de visitas, só reaproveitamos a API como fallback.
    if (imovelParam) {
      try {
        setImovel(JSON.parse(imovelParam));
        setLoading(false);
        return;
      } catch {
        // param inválido — segue para o fallback via API
      }
    }

    imovelService
      .show(Number(id))
      .then(setImovel)
      .catch(() => setError("Não foi possível carregar o imóvel."))
      .finally(() => setLoading(false));
  }, [id, imovelParam]);

  const sitVal = imovel?.visita_dados?.situacao?.value ?? "";
  const cfg = situacaoCfg(sitVal || null);

  return (
    <Screen>
      <PageHeader title="Detalhes do Imóvel" onBack={() => router.back()} />

      {loading ? (
        <LoadingView paddingVertical={32} />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : imovel ? (
        <View style={s.content}>
          <View style={s.card}>
            <Text style={s.endereco}>{imovel.endereco_completo}</Text>
            <View style={s.tagRow}>
              <View style={s.tag}>
                <Ionicons name="home-outline" size={13} color={C.textMut} />
                <Text style={s.tagText}>{imovel.tipo_imovel?.label ?? "Imóvel"}</Text>
              </View>
              {sitVal ? <StatusPill label={cfg.label} color={cfg.color} /> : null}
            </View>
          </View>

          <View style={s.card}>
            {imovel.quadra && (
              <InfoRow
                icon="grid-outline"
                label="Quarteirão"
                value={`Quadra ${imovel.quadra.numero}`}
              />
            )}
            {imovel.visita_dados?.horario_visita && (
              <InfoRow
                icon="time-outline"
                label="Último horário de visita"
                value={imovel.visita_dados.horario_visita}
              />
            )}
            {imovel.visita_dados && (
              <InfoRow
                icon="bug-outline"
                label="Focos eliminados"
                value={String(imovel.visita_dados.focos_eliminados ?? 0)}
              />
            )}
          </View>

          <Pressable
            style={s.btnNovaVisita}
            onPress={() => router.back()}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={s.btnNovaVisitaText}>Voltar e registrar nova visita</Text>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  endereco: { fontSize: 18, fontWeight: "700", color: C.text },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4 },
  tagText: { fontSize: 13, color: C.textSec },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoLabel: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: C.text, marginTop: 2 },
  btnNovaVisita: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    ...shadows.primary,
  },
  btnNovaVisitaText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
