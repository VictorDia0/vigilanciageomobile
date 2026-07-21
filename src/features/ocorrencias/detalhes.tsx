import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner, LoadingView } from "@/src/components/ui";
import { ocorrenciaService } from "@/src/services/ocorrenciaService";
import { ocorrenciaStatusCfg, tipoOcorrenciaCfg } from "@/src/constants/ocorrencia";
import type { Ocorrencia } from "@/src/types/ocorrencia";

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

export default function DetalhesOcorrencia() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    ocorrenciaService
      .show(Number(id))
      .then(setOcorrencia)
      .catch(() => setError("Não foi possível carregar a ocorrência."))
      .finally(() => setLoading(false));
  }, [id]);

  const status = ocorrenciaStatusCfg(ocorrencia?.status);
  const tipo = tipoOcorrenciaCfg(ocorrencia?.tipo);

  const data = ocorrencia?.data_ocorrencia
    ? new Date(ocorrencia.data_ocorrencia).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Screen>
      <PageHeader title="Detalhes da Ocorrência" onBack={() => router.back()} />

      {loading ? (
        <LoadingView paddingVertical={32} />
      ) : error ? (
        <ErrorBanner message={error} />
      ) : ocorrencia ? (
        <View style={s.content}>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: status.color + "15" }]}>
              <Ionicons name={tipo.icon} size={14} color={status.color} />
              <Text style={[s.badgeText, { color: status.color }]}>{tipo.label}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: status.color + "15" }]}>
              <Ionicons name={status.icon} size={14} color={status.color} />
              <Text style={[s.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>

          <View style={s.card}>
            {!!ocorrencia.descricao && (
              <InfoRow icon="document-text-outline" label="Descrição" value={ocorrencia.descricao} />
            )}
            {!!ocorrencia.endereco && (
              <InfoRow icon="location-outline" label="Endereço" value={ocorrencia.endereco} />
            )}
            {!!data && <InfoRow icon="calendar-outline" label="Data" value={data} />}
            {!!ocorrencia.agente_nome && (
              <InfoRow icon="person-outline" label="Registrado por" value={ocorrencia.agente_nome} />
            )}
            {ocorrencia.latitude != null && ocorrencia.longitude != null && (
              <InfoRow
                icon="navigate-outline"
                label="Coordenadas"
                value={`${ocorrencia.latitude.toFixed(6)}, ${ocorrencia.longitude.toFixed(6)}`}
              />
            )}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 16,
  },
  infoRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  infoLabel: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: C.text, marginTop: 2, lineHeight: 20 },
});
