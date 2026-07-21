import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { C, shadows } from "@/src/theme/tokens";
import { StatusPill } from "@/src/components/ui";
import { situacaoCfg } from "@/src/constants/visita";
import type { Imovel } from "@/src/types/imovel";

interface Props {
  imovel: Imovel;
}

export function ImovelItem({ imovel }: Props) {
  const router = useRouter();
  const sitVal = imovel.visita_dados?.situacao?.value ?? "";
  const cfg = situacaoCfg(sitVal || null);
  const horario = imovel.visita_dados?.horario_visita;
  const tipo = imovel.tipo_imovel?.label ?? "Imóvel";
  const podeAbrirDetalhes = imovel.id > 0 && !imovel.pendente_sync;

  return (
    <Pressable
      style={s.card}
      disabled={!podeAbrirDetalhes}
      onPress={() =>
        router.push({
          pathname: "/(app)/visitas/imovel/[id]",
          params: { id: String(imovel.id), imovel: JSON.stringify(imovel) },
        })
      }
    >
      <View style={[s.icon, { backgroundColor: cfg.color + "12" }]}>
        <Ionicons name={cfg.icon} size={22} color={cfg.color} />
      </View>

      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>
          {imovel.endereco_completo || "Endereço não informado"}
        </Text>
        <View style={s.meta}>
          <View style={s.tag}>
            <Ionicons name="home-outline" size={12} color={C.textMut} />
            <Text style={s.tagText}>{tipo}</Text>
          </View>
          {horario ? (
            <>
              <View style={s.dot} />
              <View style={s.tag}>
                <Ionicons name="time-outline" size={12} color={C.textMut} />
                <Text style={s.tagText}>{horario}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {imovel.pendente_sync ? (
        <Ionicons name="cloud-upload-outline" size={18} color={C.warning} />
      ) : null}
      {sitVal ? <StatusPill label={cfg.label} color={cfg.color} /> : null}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    ...shadows.small,
  },
  icon:    { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  info:    { flex: 1, gap: 4 },
  title:   { fontSize: 14, fontWeight: "600", color: C.text },
  meta:    { flexDirection: "row", alignItems: "center", gap: 4 },
  tag:     { flexDirection: "row", alignItems: "center", gap: 4 },
  tagText: { fontSize: 12, color: C.textSec },
  dot:     { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMut },
});
