import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C } from "@/src/theme/tokens";
import { Screen } from "@/src/components/ui";
import { useAuthStore } from "@/src/store/authStore";

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

// Páginas do menu ainda não implementadas → aviso amigável
function emBreve() {
  Alert.alert("Em breve", "Esta seção ainda está em desenvolvimento.");
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)");
        },
      },
    ]);
  };

  const nomeCompleto = user?.name ?? "Usuário";
  const primeiroNome = nomeCompleto.split(" ")[0];
  const email = user?.email ?? "usuario@email.com";

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header do perfil */}
        <View style={s.profileHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {primeiroNome.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={s.userName}>{nomeCompleto}</Text>
          <Text style={s.userCargo}>Agente de Campo</Text>
          <Text style={s.userEmail}>{email}</Text>
        </View>

        {/* Estatísticas — TODO: buscar da API quando o endpoint existir */}
        <Card>
          <View style={s.statsGrid}>
            <View style={s.statItem}>
              <Text style={s.statValue}>127</Text>
              <Text style={s.statLabel}>Visitas</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>45</Text>
              <Text style={s.statLabel}>Ocorrências</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>98%</Text>
              <Text style={s.statLabel}>Aprovação</Text>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card>
          <MenuItem icon="person-outline" label="Dados pessoais" onPress={emBreve} />
          <View style={s.divider} />
          <MenuItem
            icon="notifications-outline"
            label="Notificações"
            value="Ativadas"
            onPress={emBreve}
          />
          <View style={s.divider} />
          <MenuItem icon="shield-outline" label="Segurança" onPress={emBreve} />
          <View style={s.divider} />
          <MenuItem
            icon="document-text-outline"
            label="Termos e privacidade"
            onPress={emBreve}
          />
          <View style={s.divider} />
          <MenuItem
            icon="help-circle-outline"
            label="Ajuda e suporte"
            onPress={emBreve}
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
