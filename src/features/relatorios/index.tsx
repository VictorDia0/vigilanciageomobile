import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner, EmptyState, StatusPill, SelectField } from "@/src/components/ui";
import { relatorioService } from "@/src/services/relatorioService";
import { useAuthStore } from "@/src/store/authStore";
import { useAreasAgente } from "@/src/hooks/useAreasAgente";
import { FiltrosRelatorio, FILTROS_VAZIOS, type FiltrosState } from "./components/FiltrosRelatorio";
import type {
  Relatorio,
  RelatorioFormato,
  RelatorioTipo,
} from "@/src/types/relatorio";

/** "DD/MM/AAAA" -> "AAAA-MM-DD", ou null se vazio/inválido. */
function paraISO(dataBr: string): string | null {
  if (!dataBr.trim()) return null;
  const m = dataBr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

const TIPOS: { value: RelatorioTipo; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "ocorrencias", label: "Ocorrências", icon: "alert-circle-outline" },
  { value: "tratamentos", label: "Tratamentos", icon: "flask-outline" },
  { value: "visitas", label: "Visitas", icon: "compass-outline" },
  { value: "depositos", label: "Depósitos", icon: "water-outline" },
];

const FORMATOS: { value: RelatorioFormato; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "pdf", label: "PDF", icon: "document-outline" },
  { value: "xlsx", label: "Excel", icon: "grid-outline" },
  { value: "csv", label: "CSV", icon: "list-outline" },
];

const STATUS_CFG: Record<Relatorio["status"], { label: string; color: string }> = {
  processando: { label: "Processando", color: C.warning },
  concluido: { label: "Concluído", color: C.success },
  erro: { label: "Erro", color: C.danger },
};

export default function Relatorios() {
  const { user } = useAuthStore();
  const { areas, fetch: fetchAreas } = useAreasAgente();
  const [tipo, setTipo] = useState<RelatorioTipo>("ocorrencias");
  const [formato, setFormato] = useState<RelatorioFormato>("pdf");
  const [filtros, setFiltros] = useState<FiltrosState>(FILTROS_VAZIOS);
  const [gerando, setGerando] = useState(false);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const atualizarFiltros = (patch: Partial<FiltrosState>) =>
    setFiltros((prev) => ({ ...prev, ...patch }));

  const carregar = useCallback(async () => {
    try {
      const lista = await relatorioService.listar();
      // Defesa em profundidade: só exibe relatórios do próprio agente,
      // mesmo que o backend algum dia devolva a lista sem filtrar.
      const meus = user?.id
        ? lista.filter((r) => !r.geradoPor || r.geradoPor.id === user.id)
        : lista;
      setRelatorios(meus);
      setError(null);
    } catch (err: any) {
      setError(
        err?.response
          ? `Não foi possível carregar os relatórios (erro ${err.response.status}).`
          : "Sem conexão. Verifique sua internet e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Poll enquanto houver relatório em processamento
  useEffect(() => {
    const temProcessando = relatorios.some((r) => r.status === "processando");
    if (temProcessando && !pollRef.current) {
      pollRef.current = setInterval(carregar, 4000);
    } else if (!temProcessando && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [relatorios, carregar]);

  const gerar = async () => {
    const precisaPeriodo = tipo === "ocorrencias" || tipo === "visitas" || tipo === "depositos";
    const dataInicio = paraISO(filtros.dataInicio);
    const dataFim = paraISO(filtros.dataFim);
    if (precisaPeriodo && (filtros.dataInicio.trim() || filtros.dataFim.trim()) && (!dataInicio || !dataFim)) {
      Alert.alert("Data inválida", "Use o formato DD/MM/AAAA nos dois campos de período.");
      return;
    }

    setGerando(true);
    try {
      await relatorioService.gerar({
        tipo,
        formato,
        agente_id: user?.agente?.id ?? null,
        data_inicio: dataInicio,
        data_fim: dataFim,
        tipo_ocorrencia: tipo === "ocorrencias" ? filtros.tipoOcorrencia : null,
        status: tipo === "ocorrencias" ? filtros.status : null,
        area_id: tipo !== "ocorrencias" ? filtros.areaId : null,
        situacao: tipo === "visitas" ? filtros.situacao : null,
        ano: tipo === "tratamentos" ? parseInt(filtros.ano, 10) || new Date().getFullYear() : null,
        numero:
          tipo === "tratamentos" || tipo === "depositos"
            ? parseInt(filtros.numero, 10) || null
            : null,
      });
      await carregar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Relatório solicitado", "Acompanhe o status no histórico abaixo.");
    } catch (err: any) {
      Alert.alert("Erro", err?.response?.data?.message ?? "Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  const baixar = async (relatorio: Relatorio) => {
    setBaixandoId(relatorio.id);
    try {
      await relatorioService.baixarEAbrir(relatorio);
    } catch {
      Alert.alert("Erro", "Não foi possível baixar o relatório.");
    } finally {
      setBaixandoId(null);
    }
  };

  return (
    <Screen topInset={false}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <PageHeader title="Relatórios" subtitle="Solicite um relatório e acompanhe o histórico." />

        {/* Formulário de geração */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Solicitar relatório</Text>

          <SelectField
            label="TIPO"
            value={tipo}
            options={TIPOS}
            onChange={(v) => {
              setTipo(v);
              setFiltros(FILTROS_VAZIOS);
            }}
          />

          <SelectField label="FORMATO" value={formato} options={FORMATOS} onChange={setFormato} />

          <View style={s.divider} />

          <FiltrosRelatorio tipo={tipo} filtros={filtros} onChange={atualizarFiltros} areas={areas} />

          <Pressable style={[s.btnGerar, gerando && s.btnDisabled]} onPress={gerar} disabled={gerando}>
            {gerando ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#FFF" />
                <Text style={s.btnGerarText}>Solicitar relatório</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Lista */}
        <View style={{ gap: 10 }}>
          <Text style={s.sectionTitle}>Histórico</Text>

          {loading ? (
            <ActivityIndicator color={C.primary} style={{ paddingVertical: 24 }} />
          ) : error ? (
            <ErrorBanner message={error} />
          ) : relatorios.length === 0 ? (
            <EmptyState
              icon="document-outline"
              title="Nenhum relatório"
              subtitle="Solicite um relatório acima para começar."
            />
          ) : (
            relatorios.map((r) => {
              const cfg = STATUS_CFG[r.status];
              return (
                <View key={r.id} style={s.itemCard}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={s.itemNome} numberOfLines={1}>{r.nome}</Text>
                    <Text style={s.itemMeta}>
                      {r.tipo} · {r.formato.toUpperCase()}
                    </Text>
                  </View>
                  <StatusPill label={cfg.label} color={cfg.color} />
                  {r.status === "concluido" && (
                    <Pressable
                      style={s.btnDownload}
                      onPress={() => baixar(r)}
                      disabled={baixandoId === r.id}
                    >
                      {baixandoId === r.id ? (
                        <ActivityIndicator color={C.primary} size="small" />
                      ) : (
                        <Ionicons name="download-outline" size={20} color={C.primary} />
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 20 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginBottom: 4 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  btnGerar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  btnGerarText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: C.text },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  itemNome: { fontSize: 14, fontWeight: "600", color: C.text },
  itemMeta: { fontSize: 12, color: C.textSec, textTransform: "capitalize" },
  btnDownload: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary + "10",
  },
});
