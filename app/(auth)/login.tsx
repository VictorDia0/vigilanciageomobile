import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { api } from "../../src/services/api";

const { height } = Dimensions.get("window");

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    async function handleLogin() {
    if (!email || !password) {
        setErro("Preencha todos os campos.");
        return;
    }

    setErro("");
    setLoading(true);

    try {
        const response = await api.post("/auth/login", {
            email,
            password,
        });
        
        console.log("Login bem sucedido:", response.data);
        
        // Como o token está no cookie, vamos simular um token
        // OU fazer uma segunda requisição para pegar o usuário
        const userData = response.data?.data || response.data;
        
        // Salvar dados do usuário (sem token por enquanto)
        await SecureStore.setItemAsync("user", JSON.stringify(userData));
        
        // Para testes, podemos criar um token temporário
        const tempToken = "temp_" + Date.now();
        await SecureStore.setItemAsync("token", tempToken);
        
        router.replace("/(app)/(tabs)");
    } catch (error: any) {
        console.error("Erro completo:", error);
        const mensagem = error.response?.data?.message || "Erro ao fazer login.";
        setErro(mensagem);
    } finally {
        setLoading(false);
    }
}

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <StatusBar style="light" />
            <LinearGradient
                colors={["#059669", "#10b981", "#34d399"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <MaterialIcons name="shield" size={60} color="#fff" />
                        </View>
                        <Text style={styles.appName}>Vigia Geo</Text>
                        <Text style={styles.tagline}>
                            Proteção e monitoramento inteligente
                        </Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>Bem-vindo, Agente!</Text>
                        <Text style={styles.subtitle}>
                            Faça login para acessar o sistema
                        </Text>

                        <View style={styles.inputContainer}>
                            <Feather name="mail" size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                placeholder="Seu email"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Feather name="lock" size={20} color="#9ca3af" />
                            <TextInput
                                style={styles.input}
                                placeholder="Sua senha"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Feather
                                    name={showPassword ? "eye-off" : "eye"}
                                    size={20}
                                    color="#9ca3af"
                                />
                            </TouchableOpacity>
                        </View>

                        {erro ? (
                            <View style={styles.erroContainer}>
                                <Feather name="alert-circle" size={14} color="#dc2626" />
                                <Text style={styles.erroTexto}>{erro}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.loginButton,
                                loading && styles.loginButtonDisabled,
                            ]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Entrar</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.forgotButton}
                            onPress={() =>
                                Alert.alert(
                                    "Recuperar Senha",
                                    "Entre em contato com o administrador",
                                )
                            }
                        >
                            <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.version}>Versão 1.0.0</Text>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 30 },
    header: {
        alignItems: "center",
        paddingTop: height * 0.08,
        paddingBottom: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    appName: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 8 },
    tagline: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
    formContainer: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
        color: "#1f2937",
    },
    erroContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#fef2f2",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#fecaca",
    },
    erroTexto: { color: "#dc2626", fontSize: 13, flex: 1 },
    loginButton: {
        backgroundColor: "#059669",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    loginButtonDisabled: { opacity: 0.6 },
    loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    forgotButton: { alignItems: "center", marginTop: 16 },
    forgotText: { color: "#059669", fontSize: 14 },
    version: {
        textAlign: "center",
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
        marginTop: 20,
    },
});