import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader } from "@/src/components/ui";
import { userService } from "@/src/services/userService";

export default function AlterarSenha() {
  const router = useRouter();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);

  const salvar = async () => {
    if (!atual || !nova || !confirmacao) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
      return;
    }
    if (nova.length < 6) {
      Alert.alert("Senha muito curta", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (nova !== confirmacao) {
      Alert.alert("Senhas não conferem", "A confirmação não é igual à nova senha.");
      return;
    }

    setLoading(true);
    try {
      await userService.atualizarSenha({
        current_password: atual,
        new_password: nova,
        new_password_confirmation: confirmacao,
      });
      Alert.alert("Sucesso", "Senha alterada com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Erro", err?.response?.data?.message ?? "Não foi possível alterar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <PageHeader title="Alterar senha" onBack={() => router.back()} />

        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>SENHA ATUAL</Text>
            <TextInput
              style={s.input}
              secureTextEntry
              value={atual}
              onChangeText={setAtual}
              placeholder="••••••••"
              placeholderTextColor={C.textMut}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>NOVA SENHA</Text>
            <TextInput
              style={s.input}
              secureTextEntry
              value={nova}
              onChangeText={setNova}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={C.textMut}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>CONFIRMAR NOVA SENHA</Text>
            <TextInput
              style={s.input}
              secureTextEntry
              value={confirmacao}
              onChangeText={setConfirmacao}
              placeholder="Repita a nova senha"
              placeholderTextColor={C.textMut}
            />
          </View>

          <Pressable style={[s.btn, loading && s.btnDisabled]} onPress={salvar} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Salvar</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  form: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 1 },
  input: {
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
  },
  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.6 },
});
