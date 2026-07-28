import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "../tokens";
import { StatusBadge } from "./StatusBadge";
import { ocorrenciaStatusCfg, tipoOcorrenciaCfg } from "@/src/constants/ocorrencia";
import type { Ocorrencia } from "@/src/types/ocorrencia";

export function OcorrenciaItem({ oc }: { oc: Ocorrencia }) {
    const color = ocorrenciaStatusCfg(oc.status).color;
    const statusLabel = ocorrenciaStatusCfg(oc.status).label;
    const tipoLabel = tipoOcorrenciaCfg(oc.tipo).label;
    const dataLabel = oc.data_ocorrencia
        ? new Date(oc.data_ocorrencia).toLocaleDateString("pt-BR")
        : null;
    const rotulo = [tipoLabel, oc.endereco, dataLabel, `status ${statusLabel}`]
        .filter(Boolean)
        .join(", ");

    return (
        <View style={s.row} accessible accessibilityLabel={rotulo}>
            <View style={[s.icon, { backgroundColor: color + "18" }]}>
                <Ionicons name="alert-circle-outline" size={18} color={color} />
            </View>
            <View style={s.content}>
                <Text style={s.tipo}>{tipoOcorrenciaCfg(oc.tipo).label}</Text>
                {!!oc.endereco && (
                    <Text style={s.endereco} numberOfLines={1}>{oc.endereco}</Text>
                )}
                {!!oc.data_ocorrencia && (
                    <Text style={s.data}>
                        {new Date(oc.data_ocorrencia).toLocaleDateString("pt-BR")}
                    </Text>
                )}
            </View>
            <StatusBadge status={oc.status} />
        </View>
    );
}

const s = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10
    },
    icon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center"
    },
    content: {
        flex: 1,
        gap: 2
    },
    tipo: {
        fontSize: 13,
        fontWeight: "600",
        color: C.text
    },
    endereco: {
        fontSize: 11,
        color: C.textSecondary
    },
    data: {
        fontSize: 11,
        color: C.textMuted
    },
});