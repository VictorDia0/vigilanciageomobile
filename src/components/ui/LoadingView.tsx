import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { C } from "@/src/theme/tokens";

interface Props {
  message?: string;
  /** Preenche a tela (flex: 1) em vez de só ocupar o bloco. */
  fill?: boolean;
  paddingVertical?: number;
}

export function LoadingView({ message, fill = false, paddingVertical = 60 }: Props) {
  return (
    <View style={[s.root, { paddingVertical }, fill && s.fill]}>
      <ActivityIndicator size="large" color={C.primary} />
      {message ? <Text style={s.text}>{message}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: "center", justifyContent: "center", gap: 12 },
  fill: { flex: 1 },
  text: { fontSize: 14, color: C.textSec },
});
