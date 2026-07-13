import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  type KeyboardTypeOptions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { Screen } from "@/src/components/ui";
import { TIPOS, TIPO_NOMES, TIPO_ICONES, TIPO_CORES } from "@/src/constants/ocorrencia";
import type { OcorrenciaTipo } from "@/src/types/ocorrencia";

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormData {
  tipo: OcorrenciaTipo;
  descricao: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  cep: string;
}

const FORM_INICIAL: FormData = {
  tipo: "dengue",
  descricao: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  cep: "",
};

// ─── Input reutilizável da tela ───────────────────────────────────────────────

interface InputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  required?: boolean;
}

function Input({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  required = false,
}: InputProps) {
  return (
    <View style={s.inputContainer}>
      <View style={s.inputLabelRow}>
        <Text style={s.inputLabel}>{label}</Text>
        {required && <Text style={s.requiredStar}>*</Text>}
      </View>
      <View style={[s.inputWrapper, multiline && s.inputWrapperMultiline]}>
        {icon && (
          <Ionicons name={icon} size={20} color={C.textMut} style={s.inputIcon} />
        )}
        <TextInput
          style={[s.input, multiline && s.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMut}
          multiline={multiline}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function NovaOcorrencia() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>(FORM_INICIAL);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.descricao.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, descreva a ocorrência.");
      return;
    }
    if (!form.endereco.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, informe o endereço.");
      return;
    }

    setLoading(true);
    try {
      // TODO: integrar com a API (POST /ocorrencias)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Sucesso", "Ocorrência registrada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a ocorrência.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </Pressable>
          <Text style={s.headerTitle}>Nova Ocorrência</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 54 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Tipo */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Tipo de Ocorrência</Text>
            <View style={s.tipoGrid}>
              {(TIPOS as OcorrenciaTipo[]).map((tipo) => {
                const ativo = form.tipo === tipo;
                const cor = TIPO_CORES[tipo];
                return (
                  <Pressable
                    key={tipo}
                    style={[
                      s.tipoBtn,
                      { borderColor: ativo ? cor : C.border },
                      ativo && s.tipoBtnActive,
                    ]}
                    onPress={() => set("tipo", tipo)}
                  >
                    <View
                      style={[
                        s.tipoIcon,
                        { backgroundColor: ativo ? cor + "15" : C.background },
                      ]}
                    >
                      <Ionicons
                        name={TIPO_ICONES[tipo]}
                        size={22}
                        color={ativo ? cor : C.textMut}
                      />
                    </View>
                    <Text
                      style={[s.tipoLabel, ativo && { color: cor, fontWeight: "600" }]}
                    >
                      {TIPO_NOMES[tipo]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Detalhes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Detalhes</Text>

            <Input
              label="Descrição"
              icon="document-text-outline"
              value={form.descricao}
              onChangeText={(t) => set("descricao", t)}
              placeholder="Descreva a ocorrência em detalhes..."
              multiline
              required
            />
            <Input
              label="Endereço"
              icon="location-outline"
              value={form.endereco}
              onChangeText={(t) => set("endereco", t)}
              placeholder="Rua, Av., etc."
              required
            />

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Número"
                  value={form.numero}
                  onChangeText={(t) => set("numero", t)}
                  placeholder="123"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Input
                  label="Complemento"
                  value={form.complemento}
                  onChangeText={(t) => set("complemento", t)}
                  placeholder="Apto, Bloco, etc."
                />
              </View>
            </View>

            <Input
              label="Bairro"
              value={form.bairro}
              onChangeText={(t) => set("bairro", t)}
              placeholder="Bairro"
            />

            <View style={s.row}>
              <View style={{ flex: 2 }}>
                <Input
                  label="Cidade"
                  value={form.cidade}
                  onChangeText={(t) => set("cidade", t)}
                  placeholder="Cidade"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="CEP"
                  value={form.cep}
                  onChangeText={(t) => set("cep", t)}
                  placeholder="00000-000"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Enviar */}
          <Pressable
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color="#FFF" />
                <Text style={s.submitBtnText}>Registrar Ocorrência</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: C.text },

  scroll:  { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: C.text, marginBottom: 4 },
  row: { flexDirection: "row", gap: 12 },

  // Input
  inputContainer: { gap: 6 },
  inputLabelRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  inputLabel:     { fontSize: 13, fontWeight: "500", color: C.textSec },
  requiredStar:   { fontSize: 14, color: C.danger, fontWeight: "600" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  inputWrapperMultiline: { alignItems: "flex-start", paddingVertical: 8 },
  inputIcon:      { marginRight: 10 },
  input:          { flex: 1, fontSize: 15, color: C.text, paddingVertical: 10 },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },

  // Tipo
  tipoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tipoBtn: {
    flex: 1,
    minWidth: "22%",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: C.surface,
  },
  tipoBtnActive: { backgroundColor: C.primary + "05" },
  tipoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tipoLabel: { fontSize: 11, color: C.textSec, textAlign: "center" },

  // Submit
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText:     { fontSize: 16, fontWeight: "600", color: "#FFF" },
});
