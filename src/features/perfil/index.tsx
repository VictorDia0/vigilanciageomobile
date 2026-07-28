import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { Screen } from "@/src/components/ui";
import { useAuthStore } from "@/src/store/authStore";
import { ocorrenciaService } from "@/src/services/ocorrenciaService";
import { sincronizarPendentes } from "@/src/services/sync";
import { useSyncStore } from "@/src/store/syncStore";

// ─── Componentes locais ───────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  color?: string;
  onPress: () => void;
}

function MenuItem({ icon, label, value, onPress, color = C.text }: MenuItemProps) {
  return (
    <Pressable style={s.menuItem} onPress={onPress}>
      <View style={s.menuLeft}>
        <Ionicons name={icon} size={20} color={color} />
        <Text style={s.menuLabel}>{label}</Text>
      </View>
      <View style={s.menuRight}>
        {value ? <Text style={s.menuValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={C.textMut} />
      </View>
    </Pressable>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [totalOcorrencias, setTotalOcorrencias] = useState<number | null>(null);
  const pendentes = useSyncStore((s) => s.pendentes);
  const comFalha = useSyncStore((s) => s.comFalha);
  const ultimoErro = useSyncStore((s) => s.ultimoErro);
  const refreshPendentes = useSyncStore((s) => s.refresh);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    refreshPendentes();
    if (!user?.agente?.id) return;
    ocorrenciaService
      .list()
      .then((lista) => {
        // agente_id referencia agentes.id, não users.id — são IDs diferentes.
        setTotalOcorrencias(lista.filter((o) => o.agente_id === user.agente!.id).length);
      })
      .catch(() => setTotalOcorrencias(null));
  }, [user?.agente?.id, refreshPendentes]);

  const handleSincronizar = async () => {
    if (sincronizando) return;
    setSincronizando(true);
    try {
      const r = await sincronizarPendentes();
      refreshPendentes();
      const erro = useSyncStore.getState().ultimoErro;
      if (r.falhas > 0) {
        Alert.alert(
          "Alguns registros não foram enviados",
          `${r.falhas} registro(s) foram recusados pelo servidor e continuam salvos no aparelho.${
            erro ? `\n\nMotivo: ${erro}` : ""
          }\n\nCorrija a causa (ex.: junto à coordenação) — a sincronização automática vai continuar tentando, mas não vai resolver sozinha.`,
          [
            { text: "Ver detalhes", onPress: () => router.push("/(app)/perfil/sync-erros") },
            { text: "OK", style: "cancel" },
          ]
        );
      } else {
        Alert.alert(
          "Sincronização concluída",
          r.enviados > 0
            ? `${r.enviados} registro(s) enviado(s).`
            : "Nada para sincronizar no momento."
        );
      }
    } catch {
      Alert.alert("Erro", "Não foi possível sincronizar agora.");
    } finally {
      setSincronizando(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const nomeCompleto = user?.name ?? "Usuário";
  const primeiroNome = nomeCompleto.split(" ")[0];
  const email = user?.email ?? "usuario@email.com";

  return (
    <Screen topInset={false}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header do perfil */}
        <View style={s.profileHeader}>
          {user?.foto_perfil_url ? (
            <Image source={{ uri: user.foto_perfil_url }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>
                {primeiroNome.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={s.userName}>{nomeCompleto}</Text>
          <Text style={s.userCargo}>Agente de Combate a Endemias</Text>
          <Text style={s.userEmail}>{email}</Text>
        </View>

        {/* Estatísticas — agente e ocorrências reais; sem dado fabricado */}
        <Card>
          <View style={s.statsGrid}>
            <View style={s.statItem}>
              {totalOcorrencias === null ? (
                <ActivityIndicator color={C.primary} size="small" />
              ) : (
                <Text style={s.statValue}>{totalOcorrencias}</Text>
              )}
              <Text style={s.statLabel}>Ocorrências</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{user?.agente?.matricula ?? "—"}</Text>
              <Text style={s.statLabel}>Matrícula</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{user?.agente?.status ?? "—"}</Text>
              <Text style={s.statLabel}>Status</Text>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card>
          <MenuItem
            icon="cloud-upload-outline"
            label="Sincronizar agora"
            value={
              sincronizando
                ? "Sincronizando..."
                : comFalha > 0
                ? `${comFalha} com erro`
                : pendentes > 0
                ? `${pendentes} pendente(s)`
                : "Tudo em dia"
            }
            color={comFalha > 0 ? C.danger : pendentes > 0 ? C.warning : C.text}
            onPress={handleSincronizar}
          />
          {comFalha > 0 && (
            <>
              <View style={s.divider} />
              <MenuItem
                icon="alert-circle-outline"
                label="Registros com erro"
                value={`${comFalha}`}
                color={C.danger}
                onPress={() => router.push("/(app)/perfil/sync-erros")}
              />
            </>
          )}
          <View style={s.divider} />
          <MenuItem
            icon="document-text-outline"
            label="Meus relatórios"
            onPress={() => router.push("/(app)/perfil/relatorios")}
          />
          <View style={s.divider} />
          <MenuItem
            icon="lock-closed-outline"
            label="Alterar senha"
            onPress={() => router.push("/(app)/perfil/senha")}
          />
          <View style={s.divider} />
          <MenuItem
            icon="person-outline"
            label="Dados pessoais"
            onPress={() => router.push("/(app)/perfil/dados-pessoais")}
          />
          <View style={s.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notificações"
            onPress={() => router.push("/(app)/perfil/notificacoes")}
          />
          <View style={s.divider} />
          <MenuItem
            icon="document-text-outline"
            label="Termos e privacidade"
            onPress={() => router.push("/(app)/perfil/termos")}
          />
          <View style={s.divider} />
          <MenuItem
            icon="help-circle-outline"
            label="Ajuda e suporte"
            onPress={() => router.push("/(app)/perfil/ajuda")}
          />
          <View style={s.divider} />
          <MenuItem
            icon="log-out-outline"
            label="Sair"
            color={C.danger}
            onPress={handleLogout}
          />
        </Card>

        <Text style={s.version}>Versão 1.0.0</Text>
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  profileHeader: { alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  avatarText: { fontSize: 40, fontWeight: "600", color: "#FFF" },
  userName:   { fontSize: 24, fontWeight: "700", color: C.text, marginBottom: 4 },
  userCargo:  { fontSize: 14, color: C.primary, fontWeight: "500", marginBottom: 4 },
  userEmail:  { fontSize: 13, color: C.textSec },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },

  statsGrid:   { flexDirection: "row", alignItems: "center", padding: 16 },
  statItem:    { flex: 1, alignItems: "center" },
  statValue:   { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 4 },
  statLabel:   { fontSize: 12, color: C.textSec },
  statDivider: { width: 1, height: 40, backgroundColor: C.border },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuLeft:  { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { fontSize: 15, color: C.text },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  menuValue: { fontSize: 13, color: C.textSec },
  divider:   { height: 1, backgroundColor: C.border, marginLeft: 52 },

  version: {
    textAlign: "center",
    fontSize: 12,
    color: C.textMut,
    marginTop: 8,
    marginBottom: 16,
  },
});
