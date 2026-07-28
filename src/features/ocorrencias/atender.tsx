import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, LoadingView } from "@/src/components/ui";
import { SITUACAO_ENCONTRADA_CFG, SITUACOES_ENCONTRADAS } from "@/src/constants/ocorrencia";
import { ocorrenciaService, type FotoArquivo } from "@/src/services/ocorrenciaService";
import { locationService } from "@/src/services/locationService";
import { isErroDeRede } from "@/src/services/sync";
import { outbox } from "@/src/db/outbox";
import { useSyncStore } from "@/src/store/syncStore";
import type { Ocorrencia } from "@/src/types/ocorrencia";
import type { AtenderOcorrenciaPayload, SituacaoEncontrada } from "@/src/types/ocorrenciaAtendimento";

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Campo({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={s.campo}>
      <View style={s.campoLabelRow}>
        <Text style={s.campoLabel}>{label}</Text>
        {required && <Text style={s.campoRequired}>*</Text>}
      </View>
      {children}
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function AtenderOcorrencia() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ocorrenciaId = Number(id);
  const refreshPendentesSync = useSyncStore((s) => s.refresh);

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [nomeMorador, setNomeMorador] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [situacao, setSituacao] = useState<SituacaoEncontrada | null>(null);
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);

  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    ocorrenciaService
      .show(ocorrenciaId)
      .then((o) => {
        setOcorrencia(o);
        setEndereco(o.endereco ?? "");
      })
      .catch(() => Alert.alert("Erro", "Não foi possível carregar a ocorrência."))
      .finally(() => setCarregando(false));
  }, [ocorrenciaId]);

  // ─── Fotos ───────────────────────────────────────────────────────────────

  // Só câmera, sem opção de galeria — igual ao formulário de visita de
  // imóvel (TelaFormImovel.tsx). Evita o agente anexar foto antiga/de outro
  // local em vez de fotografar o atendimento na hora.
  const adicionarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Ative o acesso à câmera pra anexar fotos.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
    if (!resultado.canceled) setFotos((prev) => [...prev, resultado.assets[0].uri]);
  };

  const removerFoto = (uri: string) => setFotos((prev) => prev.filter((f) => f !== uri));

  // ─── Envio ───────────────────────────────────────────────────────────────

  const abrirConfirmacao = () => {
    if (!endereco.trim()) {
      Alert.alert("Campo obrigatório", "Confirme o endereço do atendimento.");
      return;
    }
    if (!situacao) {
      Alert.alert("Campo obrigatório", "Selecione a situação encontrada.");
      return;
    }
    if (fotos.length === 0) {
      Alert.alert("Campo obrigatório", "Anexe pelo menos uma foto do atendimento.");
      return;
    }
    setConfirmando(true);
  };

  const confirmarEnvio = async () => {
    if (!situacao) return;
    setEnviando(true);

    const posicao = await locationService.getCurrentPosition().catch(() => null);
    const dados: AtenderOcorrenciaPayload = {
      nome_morador: nomeMorador.trim() || null,
      telefone_contato: telefone.trim() || null,
      endereco_confirmado: endereco.trim(),
      situacao_encontrada: situacao,
      descricao: descricao.trim() || null,
      latitude: posicao?.latitude ?? null,
      longitude: posicao?.longitude ?? null,
    };
    const arquivosFotos: FotoArquivo[] = fotos.map((uri, i) => ({
      uri,
      name: `atendimento-${Date.now()}-${i}.jpg`,
      type: "image/jpeg",
    }));

    try {
      await ocorrenciaService.atender(ocorrenciaId, dados, arquivosFotos);
      setConfirmando(false);
      Alert.alert("Ocorrência resolvida", "Atendimento registrado com sucesso.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      if (isErroDeRede(err)) {
        outbox.enqueue("atender_ocorrencia", {
          ocorrencia_id: ocorrenciaId,
          dados,
          fotos: arquivosFotos,
        });
        refreshPendentesSync();
        setConfirmando(false);
        Alert.alert(
          "Sem conexão",
          "Atendimento salvo no aparelho — será enviado automaticamente quando a conexão voltar.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Erro",
          err?.response?.data?.message ?? "Não foi possível registrar o atendimento."
        );
      }
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <Screen topInset={false}>
        <LoadingView paddingVertical={64} />
      </Screen>
    );
  }

  return (
    <Screen topInset={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </Pressable>
          <Text style={s.headerTitle}>Atender Ocorrência</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {!!ocorrencia?.descricao && (
            <View style={s.contextoCard}>
              <Ionicons name="information-circle-outline" size={16} color={C.textMut} />
              <Text style={s.contextoTexto}>{ocorrencia.descricao}</Text>
            </View>
          )}

          <Campo label="SITUAÇÃO ENCONTRADA" required>
            <View style={s.chipRow}>
              {SITUACOES_ENCONTRADAS.map((sit) => {
                const cfg = SITUACAO_ENCONTRADA_CFG[sit];
                const ativo = situacao === sit;
                return (
                  <Pressable
                    key={sit}
                    style={[s.chip, { borderColor: ativo ? cfg.color : C.border }, ativo && { backgroundColor: cfg.color + "12" }]}
                    onPress={() => setSituacao(sit)}
                  >
                    <Ionicons name={cfg.icon} size={14} color={ativo ? cfg.color : C.textMut} />
                    <Text style={[s.chipText, ativo && { color: cfg.color, fontWeight: "600" }]}>
                      {cfg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Campo>

          <Campo label="Endereço" required>
            <TextInput
              style={s.input}
              value={endereco}
              onChangeText={setEndereco}
              placeholder="Endereço confirmado no local"
              placeholderTextColor={C.textMut}
            />
          </Campo>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Campo label="Nome do morador">
                <TextInput
                  style={s.input}
                  value={nomeMorador}
                  onChangeText={setNomeMorador}
                  placeholder="Opcional"
                  placeholderTextColor={C.textMut}
                />
              </Campo>
            </View>
            <View style={{ flex: 1 }}>
              <Campo label="Telefone">
                <TextInput
                  style={s.input}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="Opcional"
                  placeholderTextColor={C.textMut}
                  keyboardType="phone-pad"
                />
              </Campo>
            </View>
          </View>

          <Campo label="Descrição do atendimento">
            <TextInput
              style={[s.input, s.inputMultiline]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="O que foi encontrado, o que foi feito..."
              placeholderTextColor={C.textMut}
              multiline
            />
          </Campo>

          <Campo label="Fotos" required>
            <View style={s.fotosRow}>
              {fotos.map((uri) => (
                <View key={uri} style={s.fotoThumbWrap}>
                  <Image source={{ uri }} style={s.fotoThumb} />
                  <Pressable style={s.fotoRemoveBtn} onPress={() => removerFoto(uri)} hitSlop={8}>
                    <Ionicons name="close" size={14} color="#FFF" />
                  </Pressable>
                </View>
              ))}
              <Pressable style={s.fotoAddBtn} onPress={adicionarFoto}>
                <Ionicons name="camera-outline" size={22} color={C.textMut} />
              </Pressable>
            </View>
          </Campo>

          <Pressable style={s.btnResolver} onPress={abrirConfirmacao}>
            <Ionicons name="checkmark-done-outline" size={20} color="#FFF" />
            <Text style={s.btnResolverText}>Marcar ocorrência como resolvida</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Modal de confirmação ─────────────────────────────────────────── */}
      <Modal visible={confirmando} transparent animationType="fade" onRequestClose={() => setConfirmando(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Confirmar atendimento</Text>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {situacao && (
                <View style={s.modalBadge}>
                  <Ionicons
                    name={SITUACAO_ENCONTRADA_CFG[situacao].icon}
                    size={14}
                    color={SITUACAO_ENCONTRADA_CFG[situacao].color}
                  />
                  <Text style={[s.modalBadgeText, { color: SITUACAO_ENCONTRADA_CFG[situacao].color }]}>
                    {SITUACAO_ENCONTRADA_CFG[situacao].label}
                  </Text>
                </View>
              )}

              <Text style={s.modalLabel}>ENDEREÇO</Text>
              <Text style={s.modalValue}>{endereco}</Text>

              {!!nomeMorador && (
                <>
                  <Text style={s.modalLabel}>MORADOR</Text>
                  <Text style={s.modalValue}>{nomeMorador}</Text>
                </>
              )}
              {!!telefone && (
                <>
                  <Text style={s.modalLabel}>TELEFONE</Text>
                  <Text style={s.modalValue}>{telefone}</Text>
                </>
              )}
              {!!descricao && (
                <>
                  <Text style={s.modalLabel}>DESCRIÇÃO</Text>
                  <Text style={s.modalValue}>{descricao}</Text>
                </>
              )}

              <Text style={s.modalLabel}>FOTOS ({fotos.length})</Text>
              <View style={s.modalFotosRow}>
                {fotos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={s.modalFotoThumb} />
                ))}
              </View>
            </ScrollView>

            <View style={s.modalActions}>
              <Pressable style={s.modalBtnVoltar} onPress={() => setConfirmando(false)} disabled={enviando}>
                <Text style={s.modalBtnVoltarText}>Voltar</Text>
              </Pressable>
              <Pressable style={s.modalBtnConfirmar} onPress={confirmarEnvio} disabled={enviando}>
                {enviando ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={s.modalBtnConfirmarText}>Confirmar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: C.text },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 18 },

  contextoCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  contextoTexto: { flex: 1, fontSize: 13, color: C.textSec, lineHeight: 18 },

  row: { flexDirection: "row", gap: 12 },

  campo: { gap: 6 },
  campoLabelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  campoLabel: { fontSize: 12, fontWeight: "600", color: C.textMut, letterSpacing: 0.5 },
  campoRequired: { fontSize: 13, color: C.danger, fontWeight: "600" },

  input: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: C.surface,
  },
  chipText: { fontSize: 13, color: C.textSec },

  fotosRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  fotoThumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: "visible" },
  fotoThumb: { width: 72, height: 72, borderRadius: 10 },
  fotoRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  fotoAddBtn: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

  btnResolver: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.success,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  btnResolverText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: C.text },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.background,
    marginBottom: 4,
  },
  modalBadgeText: { fontSize: 12, fontWeight: "600" },
  modalLabel: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 0.5, marginTop: 8 },
  modalValue: { fontSize: 14, color: C.text, marginTop: 2 },
  modalFotosRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  modalFotoThumb: { width: 56, height: 56, borderRadius: 8 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  modalBtnVoltar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalBtnVoltarText: { fontSize: 14, fontWeight: "600", color: C.textSec },
  modalBtnConfirmar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.success,
  },
  modalBtnConfirmarText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
