import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  const handleLogin = async () => {
    const ok = await login(email.trim().toLowerCase(), senha);
    if (ok) router.replace("/(app)");
  };

  const disabled = !email || !senha || loading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#090909" />

      {/* Marca */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>⬡</Text>
        </View>
        <Text style={styles.logoText}>VIGIA<Text style={styles.logoAccent}>GEO</Text></Text>
        <Text style={styles.logoSub}>Sistema de Vigilância em Saúde</Text>
      </View>

      {/* Formulário */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Entrar</Text>

        {/* Email */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="agente@saude.gov.br"
            placeholderTextColor="#3a3a3a"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />
        </View>

        {/* Senha */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="••••••••"
              placeholderTextColor="#3a3a3a"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!senhaVisivel}
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setSenhaVisivel((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeIcon}>{senhaVisivel ? "🙈" : "👁"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Erro */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Botão */}
        <TouchableOpacity
          style={[styles.btn, disabled && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={disabled}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#090909" />
          ) : (
            <Text style={styles.btnText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Rodapé */}
      <Text style={styles.footer}>
        Acesso restrito a agentes autorizados
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090909",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 40,
  },

  // Header / Logo
  header: {
    alignItems: "center",
    gap: 6,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoIcon: {
    fontSize: 28,
    color: "#090909",
  },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#f8f8f8",
    letterSpacing: 4,
  },
  logoAccent: {
    color: "#10b981",
  },
  logoSub: {
    fontSize: 12,
    color: "#4a4a4a",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
  },

  // Formulário
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f8f8f8",
    marginBottom: 4,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6a6a6a",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#f8f8f8",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputFlex: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  eyeBtn: {
    backgroundColor: "#131313",
    borderWidth: 1,
    borderColor: "#1e1e1e",
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Erro
  errorBox: {
    backgroundColor: "#1a0a0a",
    borderWidth: 1,
    borderColor: "#3a1010",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#f87171",
    fontSize: 13,
  },

  // Botão
  btn: {
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    color: "#090909",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Rodapé
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#2a2a2a",
    letterSpacing: 0.5,
  },
});