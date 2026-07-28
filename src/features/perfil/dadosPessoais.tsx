import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/src/theme/tokens";
import { Screen, PageHeader, ErrorBanner } from "@/src/components/ui";
import { useAuthStore } from "@/src/store/authStore";
import { userService } from "@/src/services/userService";

const TAMANHO_MAXIMO_MB = 2;

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.campo}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.valor}>{value}</Text>
    </View>
  );
}

export default function DadosPessoais() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const [enviando, setEnviando] = useState(false);
  const [ampliada, setAmpliada] = useState(false);
  const primeiroNome = (user?.name ?? "Usuário").split(" ")[0];

  const validarTamanho = async (uri: string): Promise<boolean> => {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists && "size" in info && info.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
      Alert.alert("Imagem muito grande", `A foto deve ter no máximo ${TAMANHO_MAXIMO_MB}MB.`);
      return false;
    }
    return true;
  };

  const enviarFoto = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!(await validarTamanho(asset.uri))) return;

    setEnviando(true);
    try {
      const nome = asset.fileName ?? `foto-perfil-${Date.now()}.jpg`;
      const tipo = asset.mimeType ?? "image/jpeg";
      const usuario = await userService.atualizarFoto({ uri: asset.uri, name: nome, type: tipo });
      updateUser({ foto_perfil_url: usuario.foto_perfil_url });
    } catch (err: any) {
      Alert.alert(
        "Erro",
        err?.response?.data?.message ?? "Não foi possível enviar a foto. Tente novamente."
      );
    } finally {
      setEnviando(false);
    }
  };

  const tirarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Ative o acesso à câmera para tirar uma foto.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!resultado.canceled) await enviarFoto(resultado.assets[0]);
  };

  const escolherDaGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Ative o acesso às fotos para escolher uma imagem.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!resultado.canceled) await enviarFoto(resultado.assets[0]);
  };

  const alterarFoto = () => {
    Alert.alert("Foto de perfil", "Como você quer atualizar sua foto?", [
      { text: "Tirar foto", onPress: tirarFoto },
      { text: "Escolher da galeria", onPress: escolherDaGaleria },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const removerFoto = () => {
    Alert.alert("Remover foto", "Tem certeza que deseja remover sua foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          setEnviando(true);
          try {
            const usuario = await userService.removerFoto();
            updateUser({ foto_perfil_url: usuario.foto_perfil_url });
            setAmpliada(false);
          } catch {
            Alert.alert("Erro", "Não foi possível remover a foto. Tente novamente.");
          } finally {
            setEnviando(false);
          }
        },
      },
    ]);
  };

  const abrirAvatar = () => {
    if (user?.foto_perfil_url) {
      setAmpliada(true);
    } else {
      alterarFoto();
    }
  };

  return (
    <Screen topInset={false}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="Dados pessoais" onBack={() => router.back()} />

        <ErrorBanner message="Edição dos demais campos ainda não disponível pelo app — solicite à coordenação." />

        <View style={s.avatarSection}>
          <Pressable
            style={s.avatarWrap}
            onPress={abrirAvatar}
            disabled={enviando}
            accessibilityLabel={user?.foto_perfil_url ? "Ver foto de perfil ampliada" : "Adicionar foto de perfil"}
          >
            {user?.foto_perfil_url ? (
              <Image source={{ uri: user.foto_perfil_url }} style={s.avatarImg} contentFit="cover" />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarFallbackText}>{primeiroNome.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {enviando && (
              <View style={s.avatarOverlay}>
                <ActivityIndicator color="#FFF" />
              </View>
            )}
          </Pressable>

          <Pressable style={s.btnFoto} onPress={alterarFoto} disabled={enviando} accessibilityLabel="Alterar foto de perfil">
            <Ionicons name="camera-outline" size={16} color={C.primary} />
            <Text style={s.btnFotoText}>Alterar foto</Text>
          </Pressable>

          {user?.foto_perfil_url && (
            <Pressable onPress={removerFoto} disabled={enviando} accessibilityLabel="Remover foto de perfil">
              <Text style={s.btnRemoverText}>Remover foto</Text>
            </Pressable>
          )}
        </View>

        <Modal visible={ampliada} transparent animationType="fade" onRequestClose={() => setAmpliada(false)}>
          <Pressable style={s.modalBackdrop} onPress={() => setAmpliada(false)}>
            <Pressable style={s.modalContent} onPress={(e) => e.stopPropagation()}>
              <Pressable style={s.modalClose} onPress={() => setAmpliada(false)} accessibilityLabel="Fechar">
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>

              {user?.foto_perfil_url && (
                <Image
                  source={{ uri: user.foto_perfil_url }}
                  style={s.modalImg}
                  contentFit="cover"
                />
              )}

              <View style={s.modalActions}>
                <Pressable
                  style={s.modalBtn}
                  onPress={() => {
                    setAmpliada(false);
                    alterarFoto();
                  }}
                  disabled={enviando}
                >
                  <Ionicons name="camera-outline" size={18} color="#FFF" />
                  <Text style={s.modalBtnText}>Trocar foto</Text>
                </Pressable>
                <Pressable
                  style={[s.modalBtn, s.modalBtnDanger]}
                  onPress={removerFoto}
                  disabled={enviando}
                >
                  <Ionicons name="trash-outline" size={18} color="#FFF" />
                  <Text style={s.modalBtnText}>Remover</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <View style={s.card}>
          <Campo label="NOME" value={user?.name ?? "—"} />
          <View style={s.divider} />
          <Campo label="E-MAIL" value={user?.email ?? "—"} />
          <View style={s.divider} />
          <Campo label="MATRÍCULA" value={user?.agente?.matricula ?? "—"} />
          <View style={s.divider} />
          <Campo label="TELEFONE" value={user?.agente?.telefone ?? "—"} />
          <View style={s.divider} />
          <Campo label="STATUS" value={user?.agente?.status ?? "—"} />
          <View style={s.divider} />
          <Campo label="CIDADE" value={user?.cidade?.nome ?? "—"} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },

  avatarSection: { alignItems: "center", gap: 8, marginBottom: 4 },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 40, fontWeight: "600", color: "#FFF" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnFoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.primary + "40",
    backgroundColor: C.primary + "0D",
  },
  btnFotoText: { fontSize: 13, fontWeight: "600", color: C.primary },
  btnRemoverText: { fontSize: 12, color: C.danger },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: { width: "100%", alignItems: "center", gap: 20, paddingHorizontal: 24 },
  modalClose: {
    position: "absolute",
    top: -48,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  modalImg: {
    width: Math.min(Dimensions.get("window").width - 80, 340),
    height: Math.min(Dimensions.get("window").width - 80, 340),
    borderRadius: 20,
  },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  modalBtnDanger: { backgroundColor: C.danger },
  modalBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  campo: { padding: 16, gap: 4 },
  label: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 1 },
  valor: { fontSize: 15, color: C.text },
  divider: { height: 1, backgroundColor: C.border },
});
