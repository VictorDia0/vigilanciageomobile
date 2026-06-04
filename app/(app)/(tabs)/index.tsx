// app/(app)/(tabs)/index.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { api } from '../../../src/services/api';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// ==================== TIPOS ====================

interface DashboardStats {
  hoje: number;
  semana: number;
  mes: number;
  pendentes: number;
  totalVisitas: number;
  visitasFinalizadas: number;
  ocorrenciasAbertas: number;
}

interface CicloTratamento {
  numero: number;
  status: 'ok' | 'agora' | 'pendente';
  semanaAtual: number;
  data?: string;
  diaSemana?: string;
}

interface Area {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
  progresso?: number;
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    hoje: 0,
    semana: 0,
    mes: 0,
    pendentes: 0,
    totalVisitas: 48,
    visitasFinalizadas: 12,
    ocorrenciasAbertas: 5,
  });

  const [cicloAtual, setCicloAtual] = useState<CicloTratamento>({
    numero: 1,
    status: 'agora',
    semanaAtual: 2,
    data: '24/10/2023',
    diaSemana: 'Terça-feira',
  });

  const [tratamentos, setTratamentos] = useState([
    { numero: 1, status: 'ok' },
    { numero: 2, status: 'ok' },
    { numero: 3, status: 'agora' },
    { numero: 4, status: 'pendente' },
    { numero: 5, status: 'pendente' },
    { numero: 6, status: 'pendente' },
  ]);

  // ==================== API CALLS ====================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas do agente
      const statsResponse = await api.get('/agente/dashboard/stats');
      if (statsResponse.data) {
        setStats(statsResponse.data);
      }

      // Buscar áreas do agente
      const areasResponse = await api.get('/agente/areas');
      setAreas(areasResponse.data?.data || areasResponse.data || []);

      // Buscar ciclo de tratamento atual
      const cicloResponse = await api.get('/agente/ciclo-atual');
      if (cicloResponse.data) {
        setCicloAtual(cicloResponse.data);
        setTratamentos(cicloResponse.data.tratamentos || tratamentos);
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      // Dados mockados para desenvolvimento
      setStats({
        hoje: 8,
        semana: 42,
        mes: 156,
        pendentes: 3,
        totalVisitas: 48,
        visitasFinalizadas: 12,
        ocorrenciasAbertas: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  // ==================== COMPONENTES ====================

  const CicloTratamentoCard = () => (
    <Animatable.View animation="fadeInUp" delay={100} duration={600}>
      <LinearGradient
        colors={['#ffffff', '#fefefe']}
        style={styles.cicloCard}
      >
        <View style={styles.cicloHeader}>
          <View>
            <Text style={styles.cicloTitle}>CICLO DE TRATAMENTO</Text>
            <Text style={styles.cicloNumero}>{cicloAtual.numero}º Tratamento</Text>
          </View>
          <View style={styles.semanaBadge}>
            <Text style={styles.semanaLabel}>SEMANA ATUAL</Text>
            <Text style={styles.semanaValue}>Semana {cicloAtual.semanaAtual}</Text>
          </View>
        </View>

        <View style={styles.cicloDataRow}>
          <View style={styles.dataItem}>
            <Feather name="calendar" size={16} color="#059669" />
            <Text style={styles.dataLabel}>{cicloAtual.diaSemana}</Text>
          </View>
          <View style={styles.dataItem}>
            <Feather name="clock" size={16} color="#059669" />
            <Text style={styles.dataLabel}>{cicloAtual.data}</Text>
          </View>
        </View>

        <View style={styles.tratamentosContainer}>
          {tratamentos.map((item) => (
            <TouchableOpacity
              key={item.numero}
              style={[
                styles.tratamentoItem,
                item.status === 'agora' && styles.tratamentoAtivo,
                item.status === 'pendente' && styles.tratamentoPendente,
              ]}
              onPress={() => {
                if (item.status !== 'pendente') {
                  router.push(`/(app)/tratamento/${item.numero}`);
                }
              }}
            >
              <Text style={[
                styles.tratamentoNumero,
                item.status === 'agora' && styles.tratamentoAtivoText,
                item.status === 'pendente' && styles.tratamentoPendenteText,
              ]}>
                {item.numero}
              </Text>
              <Text style={[
                styles.tratamentoStatus,
                item.status === 'agora' && styles.tratamentoAtivoText,
                item.status === 'pendente' && styles.tratamentoPendenteText,
              ]}>
                {item.status === 'ok' && 'OK'}
                {item.status === 'agora' && 'AGORA'}
                {item.status === 'pendente' && 'PENDENTE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </Animatable.View>
  );

  const StatsRow = () => (
    <View style={styles.statsRow}>
      <Animatable.View animation="fadeInLeft" delay={200} duration={600} style={styles.statsCardLarge}>
        <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.statsCardGradient}>
          <View style={styles.statsCardContent}>
            <Text style={styles.statsCardNumber}>{stats.ocorrenciasAbertas}</Text>
            <Text style={styles.statsCardLabel}>Ocorrências Abertas</Text>
            <Text style={styles.statsCardSub}>Ação Necessária</Text>
          </View>
          <Feather name="alert-triangle" size={48} color="rgba(255,255,255,0.2)" style={styles.statsCardIcon} />
        </LinearGradient>
      </Animatable.View>

      <Animatable.View animation="fadeInRight" delay={250} duration={600} style={styles.statsCardLarge}>
        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statsCardGradient}>
          <View style={styles.statsCardContent}>
            <Text style={styles.statsCardNumber}>{stats.visitasFinalizadas}/{stats.totalVisitas}</Text>
            <Text style={styles.statsCardLabel}>Total Visitas</Text>
            <Text style={styles.statsCardSub}>Finalizadas hoje</Text>
          </View>
          <Feather name="check-circle" size={48} color="rgba(255,255,255,0.2)" style={styles.statsCardIcon} />
        </LinearGradient>
      </Animatable.View>
    </View>
  );

  const StatsGrid = () => (
    <View style={styles.statsGrid}>
      <Animatable.View animation="fadeInUp" delay={300} duration={600} style={styles.statMiniCard}>
        <LinearGradient colors={['#ecfdf5', '#d1fae5']} style={styles.statMiniGradient}>
          <Feather name="home" size={24} color="#059669" />
          <Text style={styles.statMiniNumber}>{stats.hoje}</Text>
          <Text style={styles.statMiniLabel}>Visitas Hoje</Text>
        </LinearGradient>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={350} duration={600} style={styles.statMiniCard}>
        <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.statMiniGradient}>
          <Feather name="calendar" size={24} color="#3b82f6" />
          <Text style={styles.statMiniNumber}>{stats.semana}</Text>
          <Text style={styles.statMiniLabel}>Esta Semana</Text>
        </LinearGradient>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={400} duration={600} style={styles.statMiniCard}>
        <LinearGradient colors={['#fffbeb', '#fef3c7']} style={styles.statMiniGradient}>
          <Feather name="bar-chart-2" size={24} color="#f59e0b" />
          <Text style={styles.statMiniNumber}>{stats.mes}</Text>
          <Text style={styles.statMiniLabel}>Este Mês</Text>
        </LinearGradient>
      </Animatable.View>

      <Animatable.View animation="fadeInUp" delay={450} duration={600} style={styles.statMiniCard}>
        <LinearGradient colors={['#fef2f2', '#fee2e2']} style={styles.statMiniGradient}>
          <Feather name="clock" size={24} color="#ef4444" />
          <Text style={styles.statMiniNumber}>{stats.pendentes}</Text>
          <Text style={styles.statMiniLabel}>Pendentes</Text>
        </LinearGradient>
      </Animatable.View>
    </View>
  );

  const AreasList = () => (
    <View style={styles.areasSection}>
      <Animatable.View animation="fadeInLeft" delay={500} duration={600} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Minhas Áreas</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/areas')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </Animatable.View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={styles.loader} />
      ) : areas.length === 0 ? (
        <View style={styles.emptyAreas}>
          <FontAwesome5 name="map-marked-alt" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Nenhuma área atribuída</Text>
        </View>
      ) : (
        areas.map((area, index) => (
          <Animatable.View key={area.id} animation="fadeInUp" delay={550 + index * 50} duration={600}>
            <TouchableOpacity
              style={styles.areaCard}
              onPress={() => router.push(`/(app)/area/${area.id}`)}
            >
              <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.areaCardGradient}>
                <View style={styles.areaCardHeader}>
                  <View style={styles.areaIconContainer}>
                    <LinearGradient colors={['#059669', '#10b981']} style={styles.areaIconGradient}>
                      <Feather name="map-pin" size={20} color="#fff" />
                    </LinearGradient>
                  </View>
                  <View style={styles.areaInfo}>
                    <Text style={styles.areaName}>{area.nome}</Text>
                    <Text style={styles.areaCode}>Código: {area.codigo}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#cbd5e1" />
                </View>
                
                {area.progresso !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${area.progresso}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{area.progresso}% concluído</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        ))
      )}
    </View>
  );

  // ==================== BOTÃO FLUTUANTE ====================

  const FabButton = () => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.fab}
      onPress={() => router.push('/(app)/nova-ocorrencia')}
    >
      <LinearGradient colors={['#059669', '#10b981']} style={styles.fabGradient}>
        <Feather name="plus" size={28} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );

  // ==================== RENDER ====================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {/* Header com perfil */}
        <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.agentName}>{user?.name || 'Carlos Silva'}</Text>
              <Text style={styles.agentArea}>Área {user?.area_codigo || '04'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Feather name="log-out" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Conteúdo principal */}
        <View style={styles.content}>
          <CicloTratamentoCard />
          <StatsRow />
          <StatsGrid />
          <AreasList />
        </View>
      </ScrollView>

      <FabButton />
    </SafeAreaView>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  agentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  agentArea: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Ciclo de Tratamento
  cicloCard: {
    borderRadius: 20,
    marginBottom: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  cicloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  cicloTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
  },

  cicloNumero: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },

  semanaBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },

  semanaLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },

  semanaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },

  cicloDataRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },

  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dataLabel: {
    fontSize: 13,
    color: '#334155',
  },

  tratamentosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  tratamentoItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 50,
    backgroundColor: '#f8fafc',
  },

  tratamentoAtivo: {
    backgroundColor: '#059669',
  },

  tratamentoPendente: {
    backgroundColor: '#fef2f2',
  },

  tratamentoNumero: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },

  tratamentoStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },

  tratamentoAtivoText: {
    color: '#fff',
  },

  tratamentoPendenteText: {
    color: '#ef4444',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  statsCardLarge: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  statsCardGradient: {
    padding: 16,
    minHeight: 110,
    position: 'relative',
    overflow: 'hidden',
  },

  statsCardContent: {
    zIndex: 2,
  },

  statsCardNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },

  statsCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },

  statsCardSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  statsCardIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },

  statMiniCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  statMiniGradient: {
    padding: 14,
    alignItems: 'center',
  },

  statMiniNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },

  statMiniLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  // Áreas
  areasSection: {
    marginTop: 8,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  seeAllText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
  },

  areaCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },

  areaCardGradient: {
    padding: 14,
  },

  areaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  areaIconContainer: {
    marginRight: 12,
  },

  areaIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  areaInfo: {
    flex: 1,
  },

  areaName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  areaCode: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  progressContainer: {
    marginTop: 12,
  },

  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },

  progressText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'right',
  },

  loader: {
    marginTop: 40,
  },

  emptyAreas: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});