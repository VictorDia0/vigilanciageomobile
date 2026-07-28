import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner, LoadingView } from "@/src/components/ui";
import { ocorrenciaService } from "@/src/services/ocorrenciaService";
import { ocorrenciaStatusCfg, tipoOcorrenciaCfg, SITUACAO_ENCONTRADA_CFG } from "@/src/constants/ocorrencia";
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

  // Refaz a busca sempre que a tela ganha foco — necessário pra refletir a
  // ocorrência recém-resolvida ao voltar da tela de atendimento.
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      ocorrenciaService
        .show(Number(id))
        .then(setOcorrencia)
        .catch(() => setError("Não foi possível carregar a ocorrência."))
        .finally(() => setLoading(false));
    }, [id])
  );

  const status = ocorrenciaStatusCfg(ocorrencia?.status);
  const tipo = tipoOcorrenciaCfg(ocorrencia?.tipo);

  const data = ocorrencia?.data_ocorrencia
    ? new Date(ocorrencia.data_ocorrencia).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const atendimento = ocorrencia?.atendimento;
  const situacaoCfg = atendimento ? SITUACAO_ENCONTRADA_CFG[atendimento.situacao_encontrada] : null;

  return (
    <Screen topInset={false}>
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

          {atendimento ? (
            <View style={s.card}>
              <Text style={s.atendimentoTitulo}>Atendimento registrado</Text>

              {situacaoCfg && (
                <View style={s.situacaoBadge}>
                  <Ionicons name={situacaoCfg.icon} size={14} color={situacaoCfg.color} />
                  <Text style={[s.situacaoBadgeText, { color: situacaoCfg.color }]}>
                    {situacaoCfg.label}
                  </Text>
                </View>
              )}

              <InfoRow icon="location-outline" label="Endereço confirmado" value={atendimento.endereco_confirmado} />
              {!!atendimento.nome_morador && (
                <InfoRow icon="person-outline" label="Morador" value={atendimento.nome_morador} />
              )}
              {!!atendimento.telefone_contato && (
                <InfoRow icon="call-outline" label="Telefone" value={atendimento.telefone_contato} />
              )}
              {!!atendimento.descricao && (
                <InfoRow icon="document-text-outline" label="Descrição do atendimento" value={atendimento.descricao} />
              )}

              {!!atendimento.fotos?.length && (
                <View style={s.fotosRow}>
                  {atendimento.fotos.map((path) => (
                    <Image key={path} source={{ uri: path }} style={s.fotoThumb} />
                  ))}
                </View>
              )}
            </View>
          ) : ocorrencia.status !== "resolvido" ? (
            <Pressable
              style={s.btnAtender}
              onPress={() => router.push(`/(app)/ocorrencias/atender?id=${ocorrencia.id}`)}
            >
              <Ionicons name="clipboard-outline" size={20} color="#FFF" />
              <Text style={s.btnAtenderText}>Iniciar visita da ocorrência</Text>
            </Pressable>
          ) : null}
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

  btnAtender: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnAtenderText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  atendimentoTitulo: { fontSize: 15, fontWeight: "700", color: C.text },
  situacaoBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.background,
  },
  situacaoBadgeText: { fontSize: 12, fontWeight: "600" },
  fotosRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fotoThumb: { width: 64, height: 64, borderRadius: 10 },
});
