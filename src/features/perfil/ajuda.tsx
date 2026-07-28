import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader } from "@/src/components/ui";

interface Pergunta {
  pergunta: string;
  resposta: string;
}

const FAQ: Pergunta[] = [
  {
    pergunta: "Registrei uma visita sem sinal de internet. E agora?",
    resposta:
      "Fica salva no aparelho e é enviada automaticamente quando a conexão voltar. Você também pode tocar em \"Sincronizar agora\" no Perfil a qualquer momento.",
  },
  {
    pergunta: "Preciso liberar a localização pra usar o app?",
    resposta:
      "Só quando for registrar uma visita ou ocorrência — o GPS não fica ativo o tempo todo.",
  },
  {
    pergunta: "Um relatório ficou \"Processando\" por muito tempo.",
    resposta:
      "A geração roda no servidor e pode levar alguns minutos dependendo do volume de dados. A tela atualiza sozinha quando terminar.",
  },
  {
    pergunta: "Errei um registro de visita ou ocorrência.",
    resposta:
      "Pelo app não é possível editar ou excluir um registro já enviado. Contate a coordenação para correção.",
  },
];

export default function Ajuda() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen topInset={false}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Ajuda e suporte" onBack={() => router.back()} />

        <View style={{ gap: 10 }}>
          {FAQ.map((item) => (
            <View key={item.pergunta} style={s.card}>
              <View style={s.perguntaRow}>
                <Ionicons name="help-circle-outline" size={18} color={C.primary} />
                <Text style={s.pergunta}>{item.pergunta}</Text>
              </View>
              <Text style={s.resposta}>{item.resposta}</Text>
            </View>
          ))}
        </View>

        <View style={s.contatoCard}>
          <View style={s.contatoIconWrap}>
            <Ionicons name="chatbubbles-outline" size={22} color={C.primary} />
          </View>
          <Text style={s.contatoTitulo}>Não achou o que precisava?</Text>
          <Text style={s.contatoTexto}>
            Um canal direto de suporte dentro do app está a caminho — vai cair direto na
            equipe responsável, através da nova função de suporte. Até lá, fale com a
            coordenação da vigilância pelos canais internos de sempre.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 8,
  },
  perguntaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pergunta: { flex: 1, fontSize: 14, fontWeight: "600", color: C.text },
  resposta: { fontSize: 13, color: C.textSec, lineHeight: 19, marginLeft: 26 },

  contatoCard: {
    backgroundColor: C.primary + "08",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.primary + "25",
    padding: 18,
    gap: 8,
  },
  contatoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  contatoTitulo: { fontSize: 15, fontWeight: "700", color: C.text },
  contatoTexto: { fontSize: 13, color: C.textSec, lineHeight: 19 },
});
