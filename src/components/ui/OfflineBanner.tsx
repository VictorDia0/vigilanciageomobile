import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";

interface Props {
  online: boolean;
  pendentes: number;
}

export function OfflineBanner({ online, pendentes }: Props) {
  const insets = useSafeAreaInsets();
  if (online && pendentes === 0) return null;

  return (
    <View style={[s.root, { paddingTop: insets.top + 6 }]}>
      <Ionicons
        name={online ? "cloud-upload-outline" : "cloud-offline-outline"}
        size={14}
        color="#FFF"
      />
      <Text style={s.text}>
        {online
          ? `Sincronizando ${pendentes} registro(s) pendente(s)...`
          : "Sem conexão — os registros serão sincronizados automaticamente."}
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
  text: { fontSize: 12, fontWeight: "600", color: "#FFF", flexShrink: 1, textAlign: "center" },
});
