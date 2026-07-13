import { View, Text, StyleSheet } from "react-native";
import { C } from "../tokens";

const CONFIG: Record<string, { color: string; label: string }> = {
    ativo: { color: C.success, label: "Ativo" },
    pendente: { color: C.warning, label: "Pendente" },
    em_andamento: { color: C.primary, label: "Em andamento" },
    concluido: { color: C.success, label: "Concluído" },
    concluida: { color: C.success, label: "Concluída" },
};

export function StatusBadge({ status }: { status: string }) {
    const { color, label } = CONFIG[status] ?? CONFIG.pendente;
    return (
        <View style={[s.badge, { backgroundColor: color + "18" }]}>
            <View style={[s.dot, { backgroundColor: color }]} />
            <Text style={[s.text, { color }]}>{label}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    text: {
        fontSize: 11,
        fontWeight: "600"
    },
});