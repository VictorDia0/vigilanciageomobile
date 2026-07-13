import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../tokens";

interface Props {
    title: string;
    value: number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

export function MetricCard({ title, value, icon, color }: Props) {
    return (
        <View style={s.card}>
            <View style={[s.icon, { backgroundColor: color + "18" }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={s.info}>
                <Text style={s.value}>{value}</Text>
                <Text style={s.title}>{title}</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: C.surface,
        borderRadius: 12, padding: 12,
        borderWidth: 1,
        borderColor: C.border,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center"
    },
    info: {
        flex: 1
    },
    value: {
        fontSize: 20,
        fontWeight: "700",
        color: C.text
    },
    title: {
        fontSize: 11,
        color: C.textSecondary,
        marginTop: 1
    },
});