import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl
} from "react-native";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/authStore";
import { useDashboardAgente } from "@/src/hooks/useDashboardAgente";
import { C } from "./tokens";
import { MetricCard } from "./components/MetricCard";
import { OcorrenciaItem } from "./components/OcorrenciaItem";
import { TratamentoCard, TratamentoVazio } from "./components/TratamentoCard";
import { AcoesRapidas } from "./components/AcoesRapidas";
import { s } from "./styles";

export default function Dashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuthStore();
    const { data, loading, error, fetch } = useDashboardAgente();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetch();
        setRefreshing(false);
    };

    const primeiroNome = user?.name?.split(" ")[0] ?? "Agente";
    const progressoQuadras =
        data.quadras.total > 0
            ? Math.round((data.quadras.concluidas / data.quadras.total) * 100)
            : 0;

    const hora = new Date().getHours();
    const saudacao =
        hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
    const dataFormatada = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const tratamentoStatus =
        typeof data.tratamento?.status === "object"
            ? data.tratamento.status.value
            : (data.tratamento?.status ?? "em_andamento");

    return (
        <View style={[s.root, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <ScrollView
                contentContainerStyle={[
                    s.scroll,
                    { paddingBottom: insets.bottom + 100 },
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={C.primary}
                    />
                }
            >
                {/* Header */}
                <View style={s.header}>
                    <View>
                        <Text style={s.greeting}>{saudacao},</Text>
                        <Text style={s.userName}>{primeiroNome}</Text>
                        <Text style={s.date}>{dataFormatada}</Text>
                    </View>
                    <Pressable
                        style={s.avatar}
                        onPress={() => router.push("/(app)/perfil")}
                    >
                        <Text style={s.avatarText}>
                            {primeiroNome.charAt(0).toUpperCase()}
                        </Text>
                    </Pressable>
                </View>

                {/* Tratamento */}
                {loading ? (
                    <ActivityIndicator style={{ padding: 20 }} color={C.primary} />
                ) : data.tratamento ? (
                    <TratamentoCard
                        tratamento={data.tratamento}
                        status={tratamentoStatus}
                    />
                ) : (
                    <TratamentoVazio />
                )}

                {/* Métricas */}
                <View style={s.metricsGrid}>
                    <MetricCard
                        title="Áreas"
                        value={data.areas.total}
                        icon="map-outline"
                        color={C.primary}
                    />
                    <MetricCard
                        title="Quadras"
                        value={data.quadras.total}
                        icon="grid-outline"
                        color={C.success}
                    />
                    <MetricCard
                        title="Ocorrencias Pendentes"
                        value={data.ocorrencias.pendentes}
                        icon="alert-circle-outline"
                        color={C.warning}
                    />
                    <MetricCard
                        title="Ocorrencias em andamento"
                        value={data.ocorrencias.em_andamento}
                        icon="time-outline"
                        color={C.primary}
                    />
                </View>

                {/* Progresso das quadras */}
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Progresso das quadras</Text>
                    <View style={s.progressContainer}>
                        <View style={s.progressCircle}>
                            <Text style={s.progressCircleValue}>{progressoQuadras}%</Text>
                        </View>
                        <View style={s.progressStats}>
                            {[
                                {
                                    label: "Concluídas",
                                    value: data.quadras.concluidas,
                                    color: C.success,
                                },
                                {
                                    label: "Em andamento",
                                    value: data.quadras.em_andamento,
                                    color: C.primary,
                                },
                                {
                                    label: "Não iniciadas",
                                    value: data.quadras.nao_iniciadas,
                                    color: C.textMuted,
                                },
                            ].map((item) => (
                                <View key={item.label} style={s.progressStat}>
                                    <View style={[s.dot, { backgroundColor: item.color }]} />
                                    <Text style={s.progressStatLabel}>{item.label}</Text>
                                    <Text style={s.progressStatValue}>{item.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Ocorrências recentes */}
                <View style={s.card}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>Ocorrências recentes</Text>
                        <Pressable onPress={() => router.push("/(app)/ocorrencias")}>
                            <Text style={s.sectionLink}>Ver todas</Text>
                        </Pressable>
                    </View>
                    {data.ocorrencias.lista.length === 0 ? (
                        <View style={s.emptyState}>
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={36}
                                color={C.textMuted}
                            />
                            <Text style={s.emptyText}>Nenhuma ocorrência recente</Text>
                        </View>
                    ) : (
                        data.ocorrencias.lista.map((oc, i) => (
                            <View key={oc.id}>
                                {i > 0 && <View style={s.divider} />}
                                <OcorrenciaItem oc={oc} />
                            </View>
                        ))
                    )}
                </View>

                {/* Ações rápidas */}
                <AcoesRapidas />

                {/* Erro */}
                {!!error && (
                    <View style={s.errorBanner}>
                        <Ionicons name="warning-outline" size={16} color={C.danger} />
                        <Text style={s.errorText}>{error}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}