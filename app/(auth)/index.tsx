// app/(auth)/login.tsx - Versão corrigida (sem bug no input)
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/src/store/authStore";

// Cores consistentes com as outras telas
const C = {
  primary: "#0A5CFF",
  success: "#00C47A",
  warning: "#FFB800",
  danger: "#FF3B30",
  
  background: "#F5F7FA",
  surface: "#FFFFFF",
  
  text: "#1A1F36",
  textSecondary: "#5A6A7D",
  textMuted: "#9AA5B4",
  
  border: "#E8ECF0",
  borderFocus: "#0A5CFF",
  
  error: "#FF3B30",
  errorBg: "#FFF5F5",
  errorBorder: "#FFE8E8",
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loading, error } = useAuthStore();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [senhaFocused, setSenhaFocused] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    const ok = await login(email.trim().toLowerCase(), senha);
    if (ok) router.replace("/(app)");
  };

  const disabled = !email || !senha || loading;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="locate" size={32} color={C.primary} />
              </View>
              <Text style={styles.logoTitle}>
                VIGIA<Text style={styles.logoAccent}>GEO</Text>
              </Text>
              <Text style={styles.logoSubtitle}>
                Sistema de Vigilância em Saúde
              </Text>
            </View>

            {/* Card de Login */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Acessar sistema</Text>
                <Text style={styles.cardSubtitle}>
                  Acesso restrito a agentes de campo
                </Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={C.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* E-mail */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>E-mail</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.fieldInput,
                    emailFocused && styles.fieldInputFocused,
                    pressed && styles.fieldInputPressed,
                  ]}
                  onPress={() => emailRef.current?.focus()}
                >
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="agente@saude.gov.br"
                    placeholderTextColor={C.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => senhaRef.current?.focus()}
                    selectionColor={C.primary}
                    clearButtonMode="while-editing"
                  />
                </Pressable>
              </View>

              {/* Senha */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Senha</Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.fieldInput,
                    senhaFocused && styles.fieldInputFocused,
                    pressed && styles.fieldInputPressed,
                  ]}
                  onPress={() => senhaRef.current?.focus()}
                >
                  <TextInput
                    ref={senhaRef}
                    style={[styles.input, { flex: 1 }]}
                    placeholder="••••••••••"
                    placeholderTextColor={C.textMuted}
                    value={senha}
                    onChangeText={setSenha}
                    onFocus={() => setSenhaFocused(true)}
                    onBlur={() => setSenhaFocused(false)}
                    secureTextEntry={!senhaVisivel}
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    selectionColor={C.primary}
                  />
                  <Pressable
                    onPress={() => setSenhaVisivel((v) => !v)}
                    style={styles.eyeButton}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={senhaVisivel ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={senhaFocused ? C.primary : C.textMuted}
                    />
                  </Pressable>
                </Pressable>
              </View>

              {/* Esqueceu a senha */}
              <Pressable style={styles.forgotButton}>
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </Pressable>

              {/* Botão Login */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                  disabled && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={disabled}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>ENTRAR</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Rodapé */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Portal exclusivo para agentes de campo
              </Text>
            </View>

            <Text style={styles.copyright}>Victor Dias © 2026</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    flexGrow: 1,
    justifyContent: "center",
  },
  
  // Logo
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.primary + "20",
  },
  
  logoTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: C.text,
    letterSpacing: 4,
    marginBottom: 4,
  },
  
  logoAccent: {
    color: C.primary,
  },
  
  logoSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    letterSpacing: 0.5,
  },
  
  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    marginBottom: 20,
  },
  
  cardHeader: {
    marginBottom: 24,
  },
  
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: C.text,
    marginBottom: 4,
  },
  
  cardSubtitle: {
    fontSize: 14,
    color: C.textSecondary,
  },
  
  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  
  errorText: {
    flex: 1,
    fontSize: 13,
    color: C.danger,
  },
  
  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSecondary,
    marginBottom: 8,
  },
  
  fieldInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    height: 48,
  },
  
  fieldInputPressed: {
    backgroundColor: C.surface,
  },
  
  fieldInputFocused: {
    borderColor: C.primary,
    backgroundColor: C.surface,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    height: "100%",
    padding: 0,
  },
  
  eyeButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  
  // Forgot password
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  
  forgotText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "500",
  },
  
  // Login Button
  loginButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  
  loginButtonPressed: {
    opacity: 0.85,
  },
  
  loginButtonDisabled: {
    opacity: 0.5,
  },
  
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  

  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  
  footerText: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  
  copyright: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 16,
    opacity: 0.6,
  },
});