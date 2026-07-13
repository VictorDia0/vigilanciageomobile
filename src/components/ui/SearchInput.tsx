import { View, TextInput, Pressable, StyleSheet, type KeyboardTypeOptions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, shadows } from "@/src/theme/tokens";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
}

export function SearchInput({ value, onChangeText, placeholder, keyboardType }: Props) {
  return (
    <View style={s.root}>
      <Ionicons name="search-outline" size={20} color={C.textMut} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={C.textMut}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={20} color={C.textMut} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    marginVertical: 12,
    gap: 10,
    ...shadows.small,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: C.text },
});
