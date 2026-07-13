import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  color: string;
}

export function StatusPill({ label, color }: Props) {
  return (
    <View style={[s.root, { backgroundColor: color + "18" }]}>
      <Text style={[s.text, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 11, fontWeight: "500" },
});
