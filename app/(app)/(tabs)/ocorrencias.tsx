import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../../src/services/api';

interface Ocorrencia {
    id: number;
    titulo: string;
    descricao: string;
    status: string;
    created_at: string;
}

export default function OcorrenciasScreen() {
    const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOcorrencias = async () => {
        try {
            const response = await api.get('/ocorrencias');
            setOcorrencias(response.data.data || response.data);
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOcorrencias();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOcorrencias();
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente': return '#f59e0b';
            case 'em_andamento': return '#3b82f6';
            case 'concluida': return '#10b981';
            case 'cancelada': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pendente': return 'Pendente';
            case 'em_andamento': return 'Em Andamento';
            case 'concluida': return 'Concluída';
            case 'cancelada': return 'Cancelada';
            default: return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderItem = ({ item }: { item: Ocorrencia }) => (
        <TouchableOpacity style={styles.ocorrenciaCard}>
            <View style={styles.ocorrenciaHeader}>
                <View style={styles.ocorrenciaIcon}>
                    <MaterialIcons name="warning" size={20} color={getStatusColor(item.status)} />
                </View>
                <View style={styles.ocorrenciaInfo}>
                    <Text style={styles.ocorrenciaTitle}>{item.titulo}</Text>
                    <Text style={styles.ocorrenciaDate}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
            </View>
            <Text style={styles.ocorrenciaDesc} numberOfLines={2}>
                {item.descricao}
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#059669" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={ocorrencias}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
    },
    listContent: {
        padding: 16,
    },
    ocorrenciaCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    ocorrenciaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ocorrenciaIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    ocorrenciaInfo: {
        flex: 1,
    },
    ocorrenciaTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 2,
    },
    ocorrenciaDate: {
        fontSize: 11,
        color: '#9ca3af',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    ocorrenciaDesc: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
});