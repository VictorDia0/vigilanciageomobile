import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/src/theme/tokens";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={s.error}>
      <Ionicons name="warning-outline" size={15} color={C.danger} />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <View style={s.success}>
      <Ionicons name="checkmark-circle" size={15} color={C.success} />
      <Text style={s.successText}>{message}</Text>
    </View>
  );
}

/** Banner de aviso tocável (ex.: pendências de sincronização). */
export function WarningBanner({
  message,
  icon = "information-circle-outline",
  onPress,
}: {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color={C.warning} />
      <Text style={s.warningText}>{message}</Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable style={s.warning} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={s.warning}>{content}</View>;
}

const s = StyleSheet.create({
  error:       { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: C.danger + "10", borderRadius: 10, padding: 12 },
  errorText:   { flex: 1, fontSize: 13, color: C.danger },
  success:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.success + "10", borderRadius: 10, padding: 12 },
  successText: { flex: 1, fontSize: 13, color: C.success },
  warning:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.warning + "12", borderWidth: 1, borderColor: C.warning + "30", borderRadius: 12, padding: 12 },
  warningText: { flex: 1, fontSize: 13, fontWeight: "500", color: C.text },
});
