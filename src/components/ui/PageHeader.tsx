import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, onBack }: Props) {
  return (
    <View style={s.root}>
      {onBack && (
        <Pressable onPress={onBack} style={s.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
      )}
      <View style={s.text}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  backBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  text:     { flex: 1 },
  title:    { fontSize: 22, fontWeight: "700", color: C.text },
  subtitle: { fontSize: 13, color: C.textSec, marginTop: 2 },
});
