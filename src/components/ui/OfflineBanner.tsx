import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";

interface Props {
  online: boolean;
  pendentes: number;
  /** Itens que já tentaram sincronizar e falharam por erro real — não vão
   * se resolver sozinhos só de esperar. */
  comFalha?: number;
}

/** O espaço da safe area (notch/status bar) já é reservado uma única vez
 * pelo layout do grupo (app) — este componente só cuida do próprio padding
 * interno, sem tocar em insets.top. */
export function OfflineBanner({ online, pendentes, comFalha = 0 }: Props) {
  if (online && pendentes === 0) return null;

  const falhouDeVerdade = online && comFalha > 0;

  return (
    <View style={[s.root, { paddingTop: 6 }, falhouDeVerdade && s.rootErro]}>
      <Ionicons
        name={!online ? "cloud-offline-outline" : falhouDeVerdade ? "alert-circle-outline" : "cloud-upload-outline"}
        size={14}
        color="#FFF"
      />
      <Text style={s.text}>
        {!online
          ? "Sem conexão — os registros serão sincronizados automaticamente."
          : falhouDeVerdade
          ? `${comFalha} registro(s) não sincronizaram (erro do servidor) — veja em Perfil > Sincronizar agora.`
          : `Sincronizando ${pendentes} registro(s) pendente(s)...`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: C.warning,
  },
  rootErro: { backgroundColor: C.danger },
  text: { fontSize: 12, fontWeight: "600", color: "#FFF", flexShrink: 1, textAlign: "center" },
});
