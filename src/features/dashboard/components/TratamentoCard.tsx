import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../tokens";
import { StatusBadge } from "./StatusBadge";
import type { Tratamento } from "@/src/types/tratamento";

interface Props {
    tratamento: Tratamento;
    status: string;
}

export function TratamentoCard({ tratamento, status }: Props) {
    const progresso = tratamento.total_areas
        ? Math.round(
            ((tratamento.areas_concluidas ?? 0) / tratamento.total_areas) * 100,
        )
        : 0;

    return (
        <View style={s.card}>
            <View style={s.header}>
                <Text style={s.numero}>{tratamento.numero}° Tratamento</Text>
                <StatusBadge status={status} />
            </View>

            {tratamento.total_areas != null && (
                <View style={s.progress}>
                    <View style={s.progressBar}>
                        <View style={[s.progressFill, { width: `${progresso}%` }]} />
                    </View>
                    <Text style={s.progressText}>
                        {tratamento.areas_concluidas ?? 0} de {tratamento.total_areas} áreas
                        concluídas
                    </Text>
                </View>
            )}

            <View style={s.dates}>
                <View>
                    <Text style={s.dateLabel}>Início</Text>
                    <Text style={s.dateValue}>{tratamento.data_inicio ?? "—"}</Text>
                </View>
                <View style={s.dateDivider} />
                <View>
                    <Text style={s.dateLabel}>Término</Text>
                    <Text style={s.dateValue}>{tratamento.data_fim ?? "—"}</Text>
                </View>
            </View>
        </View>
    );
}

export function TratamentoVazio() {
    return (
        <View style={[s.card, s.empty]}>
            <Ionicons name="medical-outline" size={40} color={C.textMuted} />
            <Text style={s.emptyText}>Nenhum tratamento ativo</Text>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    numero: {
        fontSize: 18,
        fontWeight: "700",
        color: C.text
    },
    progress: {
        marginBottom: 12,
        gap: 6
    },
    progressBar: {
        height: 6,
        backgroundColor: C.border,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: C.primary,
        borderRadius: 3
    },
    progressText: {
        fontSize: 11,
        color: C.textSecondary
    },
    dates: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: C.border,
    },
    dateLabel: {
        fontSize: 11,
        color: C.textMuted,
        marginBottom: 2
    },
    dateValue: {
        fontSize: 13,
        fontWeight: "600",
        color: C.text
    },
    dateDivider: {
        width: 1,
        height: 32,
        backgroundColor: C.border,
        marginHorizontal: 24,
    },
    empty: {
        alignItems: "center",
        paddingVertical: 20,
        gap: 8
    },
    emptyText: {
        fontSize: 13,
        color: C.textMuted
    },
});
