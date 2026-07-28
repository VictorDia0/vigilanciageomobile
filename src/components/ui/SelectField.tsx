import { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { C } from "@/src/theme/tokens";

export interface SelectOption<T> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface Props<T> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

/** Caixinha de seleção única — abre um modal com a lista de opções, em vez
 * de chips que quebram linha quando há muitas opções. */
export function SelectField<T>({ label, value, options, onChange, placeholder }: Props<T>) {
  const [aberto, setAberto] = useState(false);
  const selecionado = options.find((o) => o.value === value);

  const abrir = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAberto(true);
  };

  const escolher = (opt: SelectOption<T>) => {
    Haptics.selectionAsync();
    onChange(opt.value);
    setAberto(false);
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        style={s.campo}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selecionado?.label ?? placeholder ?? "nada selecionado"}`}
        accessibilityHint="Toque para escolher outra opção"
      >
        {selecionado?.icon && (
          <Ionicons name={selecionado.icon} size={16} color={selecionado.color ?? C.textSec} />
        )}
        <Text style={[s.valor, !selecionado && s.placeholder]} numberOfLines={1}>
          {selecionado?.label ?? placeholder ?? "Selecionar"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={C.textMut} />
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={s.backdrop}
          onPress={() => setAberto(false)}
          accessibilityLabel="Fechar"
          accessibilityRole="button"
        >
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={s.sheetTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {options.map((opt, i) => {
                const ativo = opt.value === value;
                return (
                  <Pressable
                    key={i}
                    style={[s.opcao, ativo && s.opcaoAtiva]}
                    onPress={() => escolher(opt)}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={opt.label}
                  >
                    {opt.icon && (
                      <Ionicons name={opt.icon} size={18} color={opt.color ?? C.textSec} />
                    )}
                    <Text style={[s.opcaoTexto, ativo && s.opcaoTextoAtivo]}>{opt.label}</Text>
                    {ativo && <Ionicons name="checkmark" size={18} color={C.primary} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 1 },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
  },
  valor: { flex: 1, fontSize: 14, color: C.text },
  placeholder: { color: C.textMut },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetTitle: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 8 },
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  opcaoAtiva: { backgroundColor: C.primary + "0D" },
  opcaoTexto: { flex: 1, fontSize: 14, color: C.text },
  opcaoTextoAtivo: { fontWeight: "600", color: C.primary },
});
