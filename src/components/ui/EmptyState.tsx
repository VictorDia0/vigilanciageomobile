import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={s.root}>
      <Ionicons name={icon} size={48} color={C.textMut} />
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction && (
        <Pressable style={s.btn} onPress={onAction}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:     { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 24 },
  title:    { fontSize: 17, fontWeight: "600", color: C.text, textAlign: "center" },
  subtitle: { fontSize: 13, color: C.textSec, textAlign: "center", lineHeight: 20 },
  btn:      { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  btnText:  { color: "#FFF", fontWeight: "600", fontSize: 14 },
});
