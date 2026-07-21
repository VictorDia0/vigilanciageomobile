import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner, EmptyState, StatusPill } from "@/src/components/ui";
import { relatorioService } from "@/src/services/relatorioService";
import type {
  Relatorio,
  RelatorioFormato,
  RelatorioTipo,
} from "@/src/types/relatorio";

const TIPOS: { value: RelatorioTipo; label: string }[] = [
  { value: "ocorrencias", label: "Ocorrências" },
  { value: "tratamentos", label: "Tratamentos" },
  { value: "visitas", label: "Visitas" },
  { value: "depositos", label: "Depósitos" },
];

const FORMATOS: { value: RelatorioFormato; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel" },
  { value: "csv", label: "CSV" },
];

const STATUS_CFG: Record<Relatorio["status"], { label: string; color: string }> = {
  processando: { label: "Processando", color: C.warning },
  concluido: { label: "Concluído", color: C.success },
  erro: { label: "Erro", color: C.danger },
};

export default function Relatorios() {
  const router = useRouter();
  const [tipo, setTipo] = useState<RelatorioTipo>("ocorrencias");
  const [formato, setFormato] = useState<RelatorioFormato>("pdf");
  const [gerando, setGerando] = useState(false);
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const lista = await relatorioService.listar();
      setRelatorios(lista);
      setError(null);
    } catch {
      setError("Não foi possível carregar os relatórios.");
    } finally {
      setLoading(false);
    }
  }, []);

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
    setGerando(true);
    try {
      await relatorioService.gerar({ tipo, formato });
      await carregar();
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
    <Screen>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <PageHeader title="Relatórios" onBack={() => router.back()} />

        {/* Formulário de geração */}
        <View style={s.card}>
          <Text style={s.label}>TIPO</Text>
          <View style={s.chipRow}>
            {TIPOS.map((t) => (
              <Pressable
                key={t.value}
                style={[s.chip, tipo === t.value && s.chipActive]}
                onPress={() => setTipo(t.value)}
              >
                <Text style={[s.chipText, tipo === t.value && s.chipTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.label}>FORMATO</Text>
          <View style={s.chipRow}>
            {FORMATOS.map((f) => (
              <Pressable
                key={f.value}
                style={[s.chip, formato === f.value && s.chipActive]}
                onPress={() => setFormato(f.value)}
              >
                <Text style={[s.chipText, formato === f.value && s.chipTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>

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
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 20 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  label: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 1, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  chipActive: { borderColor: C.primary, backgroundColor: C.primary + "10" },
  chipText: { fontSize: 13, color: C.textSec },
  chipTextActive: { color: C.primary, fontWeight: "600" },
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
