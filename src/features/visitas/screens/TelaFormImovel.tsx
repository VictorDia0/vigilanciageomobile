import {
    View,
    Text,
    Pressable,
    TextInput,
    Switch,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { C } from "@/src/theme/tokens";
import { PageHeader, ErrorBanner } from "@/src/components/ui";
import { SITUACOES_FORM, TIPOS_IMOVEL } from "@/src/constants/visita";
import { useVisitasContext } from "../context/VisitasContext";
import type { ImovelFormState } from "@/src/hooks/useVisitas";

// ─── Sub-componentes locais ───────────────────────────────────────────────────

function FieldLabel({ text }: { text: string }) {
    return <Text style={s.fieldLabel}>{text}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
    return <View style={s.card}>{children}</View>;
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export function TelaFormImovel() {
    const { form, loading, error, setForm, salvarImovel, voltar } =
        useVisitasContext();

    const set = <K extends keyof ImovelFormState>(key: K, value: ImovelFormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const tirarFoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permissão necessária", "Ative a permissão da câmera para anexar fotos.");
            return;
        }
        const resultado = await ImagePicker.launchCameraAsync({
            quality: 0.6,
            allowsEditing: false,
        });
        if (!resultado.canceled && resultado.assets[0]) {
            set("fotos", [...form.fotos, resultado.assets[0].uri]);
        }
    };

    const removerFoto = (uri: string) => {
        set("fotos", form.fotos.filter((f) => f !== uri));
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <PageHeader title="Registrar Imóvel" onBack={voltar} />
            {error && <ErrorBanner message={error} />}

            <ScrollView
                contentContainerStyle={[s.scroll, { paddingBottom:  100 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Endereço */}
                <Card>
                    <FieldLabel text="LOGRADOURO" />
                    <TextInput
                        style={s.input}
                        placeholder="Rua, Avenida, Travessa..."
                        placeholderTextColor={C.textMut}
                        value={form.logradouro}
                        onChangeText={(v) => set("logradouro", v)}
                    />

                    <View style={s.numRow}>
                        <View style={{ flex: 1 }}>
                            <FieldLabel text="NÚMERO" />
                            <TextInput
                                style={[s.input, form.sem_numero && s.inputDisabled]}
                                placeholder="123"
                                placeholderTextColor={C.textMut}
                                keyboardType="number-pad"
                                value={form.numero}
                                onChangeText={(v) => set("numero", v)}
                                editable={!form.sem_numero}
                            />
                        </View>
                        <View style={s.semNumWrap}>
                            <Text style={s.switchLabel}>Sem número</Text>
                            <Switch
                                value={form.sem_numero}
                                onValueChange={(v) => {
                                    set("sem_numero", v);
                                    if (v) set("numero", "");
                                }}
                                trackColor={{ false: C.border, true: C.primary + "88" }}
                                thumbColor={form.sem_numero ? C.primary : C.textMut}
                            />
                        </View>
                    </View>
                </Card>

                {/* Tipo */}
                <Card>
                    <FieldLabel text="TIPO DO IMÓVEL" />
                    <View style={s.tipoGrid}>
                        {TIPOS_IMOVEL.map((t) => (
                            <Pressable
                                key={t.value}
                                style={[
                                    s.tipoBtn,
                                    form.tipo_imovel === t.value && s.tipoBtnActive,
                                ]}
                                onPress={() => set("tipo_imovel", t.value)}
                            >
                                <Ionicons
                                    name={t.icon}
                                    size={18}
                                    color={form.tipo_imovel === t.value ? C.primary : C.textMut}
                                />
                                <Text
                                    style={[
                                        s.tipoBtnText,
                                        form.tipo_imovel === t.value && s.tipoBtnTextActive,
                                    ]}
                                >
                                    {t.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Card>

                {/* Situação */}
                <Card>
                    <FieldLabel text="SITUAÇÃO DA VISITA" />
                    <View style={s.situacaoGrid}>
                        {SITUACOES_FORM.map((sit) => (
                            <Pressable
                                key={sit.value}
                                style={[
                                    s.situacaoBtn,
                                    form.situacao === sit.value && {
                                        backgroundColor: sit.color + "15",
                                        borderColor: sit.color,
                                    },
                                ]}
                                onPress={() => set("situacao", sit.value)}
                            >
                                <View style={[s.situacaoDot, { backgroundColor: sit.color }]} />
                                <Text
                                    style={[
                                        s.situacaoBtnText,
                                        form.situacao === sit.value && {
                                            color: sit.color,
                                            fontWeight: "600",
                                        },
                                    ]}
                                >
                                    {sit.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Card>

                {/* Focos */}
                <Card>
                    <FieldLabel text="FOCOS ENCONTRADOS E ELIMINADOS" />
                    <View style={s.counter}>
                        <Pressable
                            style={s.counterBtn}
                            onPress={() =>
                                set(
                                    "focos_eliminados",
                                    String(Math.max(0, parseInt(form.focos_eliminados || "0") - 1)),
                                )
                            }
                        >
                            <Ionicons name="remove" size={22} color={C.text} />
                        </Pressable>
                        <Text style={s.counterVal}>{form.focos_eliminados || "0"}</Text>
                        <Pressable
                            style={s.counterBtn}
                            onPress={() =>
                                set(
                                    "focos_eliminados",
                                    String(parseInt(form.focos_eliminados || "0") + 1),
                                )
                            }
                        >
                            <Ionicons name="add" size={22} color={C.text} />
                        </Pressable>
                    </View>
                </Card>

                {/* Larvicida */}
                <Card>
                    <View style={s.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.switchLabel}>Tratado com larvicida</Text>
                            <Text style={s.switchSub}>Aplicação de produto químico</Text>
                        </View>
                        <Switch
                            value={form.tratado}
                            onValueChange={(v) => set("tratado", v)}
                            trackColor={{ false: C.border, true: C.success + "88" }}
                            thumbColor={form.tratado ? C.success : C.textMut}
                        />
                    </View>

                    {form.tratado && (
                        <View style={s.larvicidaFields}>
                            <View>
                                <FieldLabel text="QUANTIDADE DE LARVICIDA (g)" />
                                <TextInput
                                    style={s.input}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    placeholderTextColor={C.textMut}
                                    value={form.quantidade_larvicida}
                                    onChangeText={(v) => set("quantidade_larvicida", v)}
                                />
                            </View>
                            <View>
                                <FieldLabel text="DEPÓSITOS TRATADOS" />
                                <TextInput
                                    style={s.input}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={C.textMut}
                                    value={form.depositos_tratados}
                                    onChangeText={(v) => set("depositos_tratados", v)}
                                />
                            </View>
                        </View>
                    )}
                </Card>

                {/* Fotos */}
                <Card>
                    <FieldLabel text="FOTOS (OPCIONAL)" />
                    <View style={s.fotosRow}>
                        {form.fotos.map((uri) => (
                            <View key={uri} style={s.fotoThumbWrap}>
                                <Image source={{ uri }} style={s.fotoThumb} />
                                <Pressable
                                    style={s.fotoRemoveBtn}
                                    onPress={() => removerFoto(uri)}
                                    hitSlop={8}
                                >
                                    <Ionicons name="close" size={14} color="#FFF" />
                                </Pressable>
                            </View>
                        ))}
                        <Pressable style={s.fotoAddBtn} onPress={tirarFoto}>
                            <Ionicons name="camera-outline" size={22} color={C.textMut} />
                        </Pressable>
                    </View>
                </Card>

                <Pressable
                    style={[s.btnSalvar, loading && s.btnDisabled]}
                    onPress={salvarImovel}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                            <Text style={s.btnSalvarText}>Salvar imóvel</Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        gap: 10,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: C.textMut,
        letterSpacing: 1,
    },

    input: {
        backgroundColor: C.bg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: C.text,
    },
    inputDisabled: { opacity: 0.4 },
    inputMultiline: { height: 80, textAlignVertical: "top", paddingTop: 12 },

    numRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
    semNumWrap: { alignItems: "center", gap: 4, paddingBottom: 6 },

    tipoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tipoBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.bg,
    },
    tipoBtnActive: { borderColor: C.primary, backgroundColor: C.primary + "10" },
    tipoBtnText: { fontSize: 13, color: C.textSec },
    tipoBtnTextActive: { color: C.primary, fontWeight: "600" },

    situacaoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    situacaoBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.surface,
    },
    situacaoDot: { width: 8, height: 8, borderRadius: 4 },
    situacaoBtnText: { fontSize: 13, color: C.textSec },

    counter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
    },
    counterBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
    },
    counterVal: {
        fontSize: 32,
        fontWeight: "800",
        color: C.text,
        minWidth: 48,
        textAlign: "center",
    },

    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    switchLabel: { fontSize: 15, fontWeight: "500", color: C.text },
    switchSub: { fontSize: 12, color: C.textSec, marginTop: 2 },
    larvicidaFields: { gap: 12, paddingTop: 4 },

    fotosRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    fotoThumbWrap: { position: "relative" },
    fotoThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: C.bg },
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
        width: 64,
        height: 64,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: C.border,
        borderStyle: "dashed",
        backgroundColor: C.bg,
        alignItems: "center",
        justifyContent: "center",
    },

    btnSalvar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: C.primary,
        borderRadius: 14,
        height: 56,
    },
    btnSalvarText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
    btnDisabled: { opacity: 0.5 },
    scroll: {
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 12,
    },
});
