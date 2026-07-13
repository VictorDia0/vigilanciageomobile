import { View, StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { C } from "@/src/theme/tokens";

interface Props {
  children: React.ReactNode;
  /** Centraliza o conteúdo (loaders, estados vazios de tela cheia). */
  centered?: boolean;
  style?: ViewStyle;
}

/** Raiz de toda tela: fundo padrão, StatusBar e padding da safe area. */
export function Screen({ children, centered = false, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top }, centered && s.centered, style]}>
      <StatusBar style="dark" />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bg },
  centered: { alignItems: "center", justifyContent: "center" },
});
