import { StyleSheet } from "react-native";
import { C } from "./tokens";

export const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.background
    },
    scroll: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 16
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    greeting: {
        fontSize: 13,
        color: C.textMuted
    },
    userName: {
        fontSize: 24,
        fontWeight: "700",
        color: C.text,
        marginVertical: 2,
    },
    date: {
        fontSize: 12,
        color: C.textSecondary
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: C.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFF"
    },
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
    },
    metricsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: C.text,
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionLink: {
        fontSize: 13,
        color: C.primary,
        fontWeight: "500"
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20
    },
    progressCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: C.primary + "10",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: C.primary,
    },
    progressCircleValue: {
        fontSize: 18,
        fontWeight: "700",
        color: C.primary
    },
    progressStats: {
        flex: 1,
        gap: 10
    },
    progressStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    progressStatLabel: {
        flex: 1,
        fontSize: 12,
        color: C.textSecondary
    },
    progressStatValue: {
        fontSize: 14,
        fontWeight: "600",
        color: C.text
    },
    divider: {
        height: 1,
        backgroundColor: C.border
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 20,
        gap: 8
    },
    emptyText: {
        fontSize: 13,
        color: C.textMuted
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: C.danger + "10",
        padding: 12,
        borderRadius: 12,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: C.danger
    },
});