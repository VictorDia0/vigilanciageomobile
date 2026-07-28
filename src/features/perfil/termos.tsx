import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader } from "@/src/components/ui";

interface ItemLista {
  titulo: string;
  texto: string;
}

function Secao({
  icon,
  titulo,
  paragrafos,
  itens,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  titulo: string;
  paragrafos?: string[];
  itens?: ItemLista[];
}) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.iconWrap}>
          <Ionicons name={icon} size={18} color={C.primary} />
        </View>
        <Text style={s.titulo}>{titulo}</Text>
      </View>

      {paragrafos?.map((p, i) => (
        <Text key={i} style={s.texto}>{p}</Text>
      ))}

      {itens?.map((item) => (
        <View key={item.titulo} style={s.itemLista}>
          <Text style={s.itemTitulo}>{item.titulo}</Text>
          <Text style={s.texto}>{item.texto}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Termos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Screen topInset={false}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Termos e privacidade"
          subtitle="Rascunho de trabalho — a versão final é revisada e aprovada pela coordenação do SISVA."
          onBack={() => router.back()}
        />

        <Secao
          icon="document-text-outline"
          titulo="1. O que é o SISVA"
          paragrafos={[
            "O SISVA (Sistema de Vigilância Ambiental) é uma ferramenta de trabalho voltada às equipes de combate a endemias da prefeitura. O app de campo é destinado exclusivamente a agentes cadastrados pela coordenação, para uso em atividades oficiais de vigilância ambiental — visitas domiciliares, controle de focos, registro de ocorrências e acompanhamento de tratamentos.",
          ]}
        />

        <Secao
          icon="checkmark-done-outline"
          titulo="2. Responsabilidades do agente"
          itens={[
            {
              titulo: "Veracidade dos registros",
              texto: "As informações registradas (endereço, situação do imóvel, fotos, ocorrências) devem refletir fielmente o que foi observado em campo.",
            },
            {
              titulo: "Uso da conta",
              texto: "O acesso é pessoal e intransferível. O agente é responsável pelos registros feitos com seu login.",
            },
            {
              titulo: "Uso do GPS",
              texto: "A localização só é coletada no momento do registro de uma visita ou ocorrência — não há rastreamento contínuo em segundo plano.",
            },
          ]}
        />

        <Secao
          icon="shield-checkmark-outline"
          titulo="3. Privacidade e dados coletados (LGPD)"
          paragrafos={[
            "Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), o SISVA coleta apenas os dados necessários para a execução da vigilância ambiental:",
          ]}
          itens={[
            {
              titulo: "Dados de identificação",
              texto: "Nome, e-mail, matrícula e cidade de lotação do agente, usados para autenticação e para vincular cada registro a quem o realizou.",
            },
            {
              titulo: "Dados de localização",
              texto: "Coordenadas GPS capturadas no ato do registro de uma visita ou ocorrência, para georreferenciar imóveis e focos.",
            },
            {
              titulo: "Fotos",
              texto: "Imagens anexadas a visitas, ocorrências e, opcionalmente, a foto de perfil do agente.",
            },
            {
              titulo: "Dados de endereços visitados",
              texto: "Informações sobre imóveis e moradores estritamente relacionadas à finalidade sanitária da visita — nunca dados sensíveis não relacionados à vigilância ambiental.",
            },
          ]}
        />

        <Secao
          icon="lock-closed-outline"
          titulo="4. Uso e compartilhamento"
          paragrafos={[
            "Os dados coletados são de uso interno da administração municipal, tratados exclusivamente para fins de vigilância epidemiológica e ambiental (ex.: controle de dengue e outras arboviroses). Não são vendidos, cedidos ou compartilhados com terceiros fora da prefeitura, exceto quando exigido por obrigação legal ou por órgãos de saúde pública (ex.: repasse de dados agregados à Secretaria de Saúde).",
          ]}
        />

        <Secao
          icon="time-outline"
          titulo="5. Retenção e exclusão"
          paragrafos={[
            "Os registros de visitas e ocorrências são mantidos pelo prazo exigido pela legislação de vigilância em saúde, servindo de histórico oficial da atuação da equipe. Dados de conta (foto de perfil, dados pessoais) podem ser removidos mediante solicitação à coordenação, respeitando eventuais obrigações de guarda de registros oficiais.",
          ]}
        />

        <Secao
          icon="help-buoy-outline"
          titulo="6. Dúvidas e contato"
          paragrafos={[
            "Dúvidas sobre este texto ou sobre o tratamento dos seus dados podem ser encaminhadas à coordenação da vigilância ambiental do município. Um canal de suporte dedicado dentro do app está previsto para uma próxima versão.",
          ]}
        />
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 14, fontWeight: "700", color: C.text, flex: 1 },
  texto: { fontSize: 13, color: C.textSec, lineHeight: 19 },
  itemLista: { gap: 2 },
  itemTitulo: { fontSize: 13, fontWeight: "600", color: C.text },
});
