import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, EmptyState } from "@/src/components/ui";
import { outbox, type OutboxItem, type OutboxTipo } from "@/src/db/outbox";
import { useSyncStore } from "@/src/store/syncStore";

const TIPO_LABEL: Record<OutboxTipo, string> = {
  registrar_imovel: "Registro de imóvel / visita",
  fechar_visita: "Encerramento de visita (dia)",
  encerrar_quadra: "Encerramento de quarteirão",
  registrar_recuperacao: "Registro de revisita",
  atender_ocorrencia: "Atendimento de ocorrência",
};

function formatarData(criadoEm: string): string {
  const data = new Date(criadoEm.replace(" ", "T"));
  return Number.isNaN(data.getTime())
    ? criadoEm
    : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Itens da outbox que já tentaram sincronizar e foram recusados pelo
 * servidor (erro de negócio, não falta de rede) — vão continuar falhando
 * pra sempre sozinhos. Aqui dá pra ver o motivo e descartar manualmente. */
export default function SyncErros() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const refresh = useSyncStore((s) => s.refresh);
  const [itens, setItens] = useState<OutboxItem[]>([]);

  const carregar = useCallback(() => {
    setItens(outbox.listarComFalha());
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const descartar = (item: OutboxItem) => {
    Alert.alert(
      "Descartar registro",
      "Essa ação não pode ser desfeita — os dados desse registro serão perdidos definitivamente do aparelho. Só descarte se tiver certeza de que não é mais possível salvá-lo (ex.: visita ou quarteirão que não existem mais).",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => {
            outbox.remover(item.id);
            carregar();
            refresh();
          },
        },
      ]
    );
  };

  return (
    <Screen topInset={false}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Registros com erro"
          subtitle="Itens recusados pelo servidor — a sincronização automática não resolve sozinha."
          onBack={() => router.back()}
        />

        {itens.length === 0 ? (
          <EmptyState
            icon="checkmark-circle-outline"
            title="Nenhum registro com erro"
            subtitle="Tudo que estava pendente foi sincronizado ou descartado."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {itens.map((item) => (
              <View key={item.id} style={s.card}>
                <View style={s.cardHeader}>
                  <Ionicons name="alert-circle-outline" size={18} color={C.danger} />
                  <Text style={s.tipo}>{TIPO_LABEL[item.tipo]}</Text>
                </View>
                <Text style={s.meta}>
                  Criado em {formatarData(item.criado_em)} · {item.tentativas} tentativa(s)
                </Text>
                {item.ultimo_erro && <Text style={s.erro}>{item.ultimo_erro}</Text>}
                <Pressable style={s.btnDescartar} onPress={() => descartar(item)}>
                  <Ionicons name="trash-outline" size={16} color={C.danger} />
                  <Text style={s.btnDescartarText}>Descartar</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.danger + "30",
    padding: 14,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipo: { flex: 1, fontSize: 14, fontWeight: "600", color: C.text },
  meta: { fontSize: 12, color: C.textSec },
  erro: {
    fontSize: 12,
    color: C.danger,
    backgroundColor: C.danger + "0D",
    borderRadius: 8,
    padding: 8,
    marginTop: 2,
  },
  btnDescartar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.danger + "40",
  },
  btnDescartarText: { fontSize: 13, fontWeight: "600", color: C.danger },
});
