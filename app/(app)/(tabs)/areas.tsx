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
import { Feather } from '@expo/vector-icons';
import { api } from '../../../src/services/api';

interface Area {
    id: number;
    nome: string;
    ativo: boolean;
    quadras?: any[];
    agentes?: any[];
    totais?: {
        quadras: number;
        agentes: number;
    };
}

export default function AreasScreen() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAreas = async () => {
        try {
            const response = await api.get('/areas');
            setAreas(response.data.data || response.data);
        } catch (error) {
            console.error('Erro ao carregar áreas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAreas();
        setRefreshing(false);
    };

    const renderItem = ({ item }: { item: Area }) => (
        <TouchableOpacity style={styles.areaCard}>
            <View style={styles.areaHeader}>
                <View style={styles.areaIcon}>
                    <Feather name="map-pin" size={24} color="#059669" />
                </View>
                <View style={styles.areaInfo}>
                    <Text style={styles.areaName}>{item.nome}</Text>
                    <View style={[styles.statusBadge, item.ativo ? styles.activeBadge : styles.inactiveBadge]}>
                        <Text style={[styles.statusText, item.ativo ? styles.activeText : styles.inactiveText]}>
                            {item.ativo ? 'Ativo' : 'Inativo'}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.areaStats}>
                <View style={styles.stat}>
                    <Feather name="layers" size={16} color="#6b7280" />
                    <Text style={styles.statText}>
                        {item.quadras?.length || item.totais?.quadras || 0} quadras
                    </Text>
                </View>
                <View style={styles.stat}>
                    <Feather name="users" size={16} color="#6b7280" />
                    <Text style={styles.statText}>
                        {item.agentes?.length || item.totais?.agentes || 0} agentes
                    </Text>
                </View>
            </View>
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
                data={areas}
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
    areaCard: {
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
    areaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    areaIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    areaInfo: {
        flex: 1,
    },
    areaName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 6,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    activeBadge: {
        backgroundColor: '#d1fae5',
    },
    inactiveBadge: {
        backgroundColor: '#fee2e2',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    activeText: {
        color: '#059669',
    },
    inactiveText: {
        color: '#ef4444',
    },
    areaStats: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    statText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 6,
    },
});