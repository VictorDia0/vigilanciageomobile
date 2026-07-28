import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader } from "@/src/components/ui";

interface Preferencia {
  key: string;
  label: string;
  descricao: string;
}

const PREFERENCIAS: Preferencia[] = [
  { key: "ocorrencias", label: "Novas ocorrências na minha área", descricao: "Avisa quando uma ocorrência é registrada na sua área de atuação." },
  { key: "tratamentos", label: "Ciclos de tratamento", descricao: "Avisa sobre início e prazo de ciclos de tratamento ativos." },
  { key: "sync", label: "Falhas de sincronização", descricao: "Avisa quando um registro offline não conseguiu ser enviado." },
];

export default function Notificacoes() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ativas, setAtivas] = useState<Record<string, boolean>>({
    ocorrencias: true,
    tratamentos: true,
    sync: true,
  });

  const alternar = (key: string) =>
    setAtivas((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <Screen topInset={false}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Notificações"
          subtitle="Preferência salva apenas neste aparelho — envio via push ainda não implementado."
          onBack={() => router.back()}
        />

        <View style={s.card}>
          {PREFERENCIAS.map((p, i) => (
            <View key={p.key}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.item}>
                <View style={s.itemText}>
                  <Text style={s.itemLabel}>{p.label}</Text>
                  <Text style={s.itemDesc}>{p.descricao}</Text>
                </View>
                <Switch
                  value={ativas[p.key]}
                  onValueChange={() => alternar(p.key)}
                  trackColor={{ false: C.border, true: C.primary + "80" }}
                  thumbColor={ativas[p.key] ? C.primary : "#FFF"}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12 },
  itemText: { flex: 1, gap: 4 },
  itemLabel: { fontSize: 14, fontWeight: "600", color: C.text },
  itemDesc: { fontSize: 12, color: C.textSec },
  divider: { height: 1, backgroundColor: C.border },
});
