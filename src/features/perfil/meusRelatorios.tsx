import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner, EmptyState, StatusPill } from "@/src/components/ui";
import { relatorioService } from "@/src/services/relatorioService";
import { useAuthStore } from "@/src/store/authStore";
import type { Relatorio } from "@/src/types/relatorio";

const STATUS_CFG: Record<Relatorio["status"], { label: string; color: string }> = {
  processando: { label: "Processando", color: C.warning },
  concluido: { label: "Concluído", color: C.success },
  erro: { label: "Erro", color: C.danger },
};

/** Só a lista dos relatórios já gerados pelo agente logado — sem o
 * formulário de solicitação, que fica na tab Relatórios. */
export default function MeusRelatorios() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const carregar = useCallback(async () => {
    try {
      const lista = await relatorioService.listar();
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
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Meus relatórios"
          subtitle="Somente os relatórios gerados por você."
          onBack={() => router.back()}
        />

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ paddingVertical: 24 }} />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : relatorios.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title="Nenhum relatório"
            subtitle="Vá em Relatórios, no menu, para solicitar o primeiro."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {relatorios.map((r) => {
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
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
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
