import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "../tokens";

const ACOES = [
    {
        label: "Nova ocorrência",
        icon: "add-circle-outline",
        color: C.primary,
        href: "/(app)/ocorrencias/nova",
    },
    {
        label: "Minhas áreas",
        icon: "map-outline",
        color: C.success,
        href: "/(app)/areas",
    },
    {
        label: "Iniciar visita",
        icon: "navigate-outline",
        color: C.warning,
        href: "/(app)/visitas",
    },
] as const;

export function AcoesRapidas() {
    const router = useRouter();
    return (
        <View style={s.grid}>
            {ACOES.map((acao) => (
                <Pressable
                    key={acao.label}
                    style={s.btn}
                    onPress={() => router.push(acao.href as any)}
                >
                    <Ionicons name={acao.icon} size={24} color={acao.color} />
                    <Text style={s.label}>{acao.label}</Text>
                </Pressable>
            ))}
        </View>
    );
}

const s = StyleSheet.create({
    grid: {
        flexDirection: "row",
        gap: 10,
    },
    btn: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: C.border,
    },
    label: {
        fontSize: 11,
        fontWeight: "500",
        color: C.textSecondary,
        textAlign: "center",
    },
});
