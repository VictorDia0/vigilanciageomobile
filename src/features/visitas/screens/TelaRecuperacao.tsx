import { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C, shadows } from "@/src/theme/tokens";
import {
  Screen,
  PageHeader,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
  StatusPill,
  LoadingView,
} from "@/src/components/ui";
import { RESULTADOS_RECUPERACAO } from "@/src/constants/visita";
import { useRecuperacao } from "@/src/hooks/useRecuperacao";
import { useDashboardAgente } from "@/src/hooks/useDashboardAgente";
import type { RecuperacaoPendente } from "@/src/types/visita";

// ─── Card de imóvel fechado ──────────────────────────────────────────────────

function FechadoCard({
  item,
  onPress,
}: {
  item: RecuperacaoPendente;
  onPress: () => void;
}) {
  const dataTentativa = item.ultima_tentativa
    ? new Date(item.ultima_tentativa).toLocaleDateString("pt-BR")
    : "—";

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && s.cardPressed]}
      onPress={onPress}
    >
      <View style={[s.cardIcon, { backgroundColor: C.warning + "12" }]}>
        <Ionicons name="lock-closed" size={20} color={C.warning} />
      </View>
      <View style={s.cardInfo}>
        <Text style={s.cardTitle} numberOfLines={1}>
          {item.imovel.endereco_completo}
        </Text>
        <Text style={s.cardMeta}>
          {item.area?.nome ? `${item.area.nome} · ` : ""}
          Quarteirão {item.quadra.numero}
          {item.quadra.status === "concluida" ? " (encerrado)" : ""}
        </Text>
        <Text style={s.cardMeta}>
          {item.tentativas} tentativa(s) · última: {dataTentativa}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textMut} />
    </Pressable>
  );
}

// ─── Formulário de revisita ──────────────────────────────────────────────────

function FormRevisita({
  hook,
}: {
  hook: ReturnType<typeof useRecuperacao>;
}) {
  const { selecionado, form, setForm, salvar, salvando, fecharForm, error } = hook;
  if (!selecionado) return null;

  return (
    <View style={s.formCard}>
      <View style={s.formHeader}>
        <Text style={s.formTitle} numberOfLines={1}>
          {selecionado.imovel.endereco_completo}
        </Text>
        <Pressable onPress={fecharForm} hitSlop={8}>
          <Ionicons name="close" size={22} color={C.textSec} />
        </Pressable>
      </View>

      {error && <ErrorBanner message={error} />}

      <Text style={s.formLabel}>Resultado da revisita</Text>
      <View style={s.resultadoRow}>
        {RESULTADOS_RECUPERACAO.map((r) => {
          const ativo = form.situacao === r.value;
          return (
            <Pressable
              key={r.value}
              style={[
                s.resultadoBtn,
                ativo && { backgroundColor: r.color + "15", borderColor: r.color },
              ]}
              onPress={() => setForm({ ...form, situacao: r.value })}
            >
              <Ionicons
                name={r.icon}
                size={18}
                color={ativo ? r.color : C.textMut}
              />
              <Text
                style={[s.resultadoText, ativo && { color: r.color, fontWeight: "700" }]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Dados de tratamento — só quando conseguiu atender */}
      {form.situacao === "REC" && (
        <View style={s.tratamentoBox}>
          <View style={s.switchRow}>
            <Text style={s.formLabel}>Imóvel tratado?</Text>
            <Switch
              value={form.tratado}
              onValueChange={(v) => setForm({ ...form, tratado: v })}
              trackColor={{ true: C.primary }}
            />
          </View>

          <Text style={s.formLabel}>Focos eliminados</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={form.focos_eliminados}
            onChangeText={(t) => setForm({ ...form, focos_eliminados: t })}
          />

          {form.tratado && (
            <>
              <Text style={s.formLabel}>Larvicida (g)</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                value={form.quantidade_larvicida}
                onChangeText={(t) => setForm({ ...form, quantidade_larvicida: t })}
              />
              <Text style={s.formLabel}>Depósitos tratados</Text>
              <TextInput
                style={s.input}
                keyboardType="numeric"
                value={form.depositos_tratados}
                onChangeText={(t) => setForm({ ...form, depositos_tratados: t })}
              />
            </>
          )}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [s.btnSalvar, pressed && { opacity: 0.85 }, salvando && { opacity: 0.5 }]}
        disabled={salvando}
        onPress={salvar}
      >
        {salvando ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#FFF" />
            <Text style={s.btnSalvarText}>Registrar revisita</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function TelaRecuperacao() {
  const router = useRouter();
  const { data: dashboard, fetch: fetchDashboard, loading: loadingDash } =
    useDashboardAgente();
  const tratamentoId = dashboard.tratamento?.id ?? null;

  const hook = useRecuperacao(tratamentoId);
  const { pendentes, selecionado, loading, error, successMsg, carregar, abrirForm } = hook;

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tratamentoId) carregar();
  }, [tratamentoId, carregar]);

  return (
    <Screen>
      <PageHeader
        title="Recuperação"
        subtitle="Imóveis fechados do tratamento atual"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {successMsg && <SuccessBanner message={successMsg} />}
        {!selecionado && error && <ErrorBanner message={error} />}

        {loadingDash || loading ? (
          <LoadingView message="Carregando imóveis fechados..." />
        ) : !tratamentoId ? (
          <EmptyState
            icon="medical-outline"
            title="Nenhum tratamento ativo"
            subtitle="A recuperação usa o tratamento em andamento."
          />
        ) : selecionado ? (
          <FormRevisita hook={hook} />
        ) : pendentes.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="Nenhum imóvel fechado"
            subtitle="Todos os imóveis do tratamento foram atendidos. Bom trabalho!"
          />
        ) : (
          <View style={s.list}>
            <View style={s.listHeader}>
              <Text style={s.listTitle}>Para revisitar</Text>
              <StatusPill label={`${pendentes.length}`} color={C.warning} />
            </View>
            {pendentes.map((item) => (
              <FechadoCard
                key={item.imovel.id}
                item={item}
                onPress={() => abrirForm(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 14 },

  list: { gap: 10 },
  listHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  listTitle: { fontSize: 15, fontWeight: "600", color: C.text },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    ...shadows.small,
  },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.85 },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: C.text },
  cardMeta: { fontSize: 12, color: C.textSec },

  // Form
  formCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
    ...shadows.small,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  formTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: C.text },
  formLabel: { fontSize: 13, fontWeight: "600", color: C.textSec },

  resultadoRow: { flexDirection: "row", gap: 8 },
  resultadoBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  resultadoText: { fontSize: 11, color: C.textSec, textAlign: "center" },

  tratamentoBox: { gap: 8 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.bg,
  },

  btnSalvar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    marginTop: 4,
  },
  btnSalvarText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
