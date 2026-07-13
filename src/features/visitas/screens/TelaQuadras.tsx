import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import {
  PageHeader,
  EmptyState,
  ErrorBanner,
  LoadingView,
  SearchInput,
} from "@/src/components/ui";
import { QuadraCard } from "../components/QuadraCard";
import { useVisitasContext } from "../context/VisitasContext";
import type { Quadra } from "@/src/types/quadra";

export function TelaQuadras() {
  const { areaSelecionada, loading, error, selecionarQuadra, voltar, tratamentoId } =
    useVisitasContext();
  const router = useRouter();

  const quadras = useMemo(() => areaSelecionada?.quadras ?? [], [areaSelecionada]);
  const [busca, setBusca] = useState("");

  const quadrasFiltradas = useMemo(() => {
    const query = busca.trim();
    if (!query) return quadras;
    return quadras.filter((q) => q.numero.toString().includes(query));
  }, [quadras, busca]);

  // Quadra concluída NÃO reabre — só oferece a lista de recuperação
  const handleSelecionar = useCallback(
    (quadra: Quadra) => {
      if (quadra.status === "concluida") {
        Alert.alert(
          `Quarteirão ${quadra.numero} encerrado`,
          "Este quarteirão já foi concluído e não pode ser reaberto.\n\nImóveis que ficaram fechados podem ser revisitados na Recuperação.",
          [
            { text: "Voltar", style: "cancel" },
            {
              text: "Ver recuperação",
              onPress: () => router.push("/(app)/visitas/recuperacao"),
            },
          ]
        );
        return;
      }
      selecionarQuadra(quadra, tratamentoId);
    },
    [selecionarQuadra, tratamentoId, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Quadra }) => (
      <QuadraCard quadra={item} onPress={() => handleSelecionar(item)} />
    ),
    [handleSelecionar]
  );

  const header = (
    <PageHeader
      title={areaSelecionada?.nome ?? "Quarteirões"}
      subtitle="Selecione o quarteirão para trabalhar"
      onBack={voltar}
    />
  );

  if (loading) {
    return (
      <View style={s.container}>
        {header}
        <LoadingView message="Carregando..." fill />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.container}>
        {header}
        <ErrorBanner message={error} />
      </View>
    );
  }

  if (quadras.length === 0) {
    return (
      <View style={s.container}>
        {header}
        <EmptyState
          icon="grid-outline"
          title="Nenhum quarteirão"
          subtitle="Esta área não possui quarteirões cadastrados."
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {header}

      <SearchInput
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar por número..."
        keyboardType="number-pad"
      />

      <FlatList
        data={quadrasFiltradas}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={5}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="Nenhum resultado"
            subtitle="Tente buscar por outro número."
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16 },
  list:      { paddingBottom: 100, gap: 8 },
});
