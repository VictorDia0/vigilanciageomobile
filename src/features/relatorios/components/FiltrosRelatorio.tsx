import { View, Text, TextInput, StyleSheet } from "react-native";
import { C } from "@/src/theme/tokens";
import { SelectField } from "@/src/components/ui";
import { TIPO_NOMES, TIPOS as TIPOS_OCORRENCIA, OCORRENCIA_STATUS_CFG } from "@/src/constants/ocorrencia";
import { SITUACAO_CFG } from "@/src/constants/visita";
import type { RelatorioTipo } from "@/src/types/relatorio";
import type { OcorrenciaStatus, OcorrenciaTipo } from "@/src/types/ocorrencia";
import type { SituacaoImovel } from "@/src/types/visita";
import type { Area } from "@/src/types/area";

export interface FiltrosState {
  dataInicio: string; // "DD/MM/AAAA"
  dataFim: string;
  tipoOcorrencia: OcorrenciaTipo | null;
  status: OcorrenciaStatus | null;
  areaId: number | null;
  situacao: SituacaoImovel | null;
  ano: string;
  numero: string;
}

export const FILTROS_VAZIOS: FiltrosState = {
  dataInicio: "",
  dataFim: "",
  tipoOcorrencia: null,
  status: null,
  areaId: null,
  situacao: null,
  ano: String(new Date().getFullYear()),
  numero: "",
};

const OPCOES_TIPO_OCORRENCIA = [
  { value: null, label: "Todos os tipos" },
  ...(TIPOS_OCORRENCIA as OcorrenciaTipo[]).map((t) => ({ value: t, label: TIPO_NOMES[t] })),
];

const OPCOES_STATUS = [
  { value: null, label: "Todos os status" },
  ...(Object.keys(OCORRENCIA_STATUS_CFG) as OcorrenciaStatus[]).map((st) => ({
    value: st,
    label: OCORRENCIA_STATUS_CFG[st].label,
    icon: OCORRENCIA_STATUS_CFG[st].icon,
    color: OCORRENCIA_STATUS_CFG[st].color,
  })),
];

const OPCOES_SITUACAO = [
  { value: null, label: "Todas as situações" },
  ...(Object.keys(SITUACAO_CFG) as SituacaoImovel[]).map((sit) => ({
    value: sit,
    label: SITUACAO_CFG[sit].label,
    icon: SITUACAO_CFG[sit].icon,
    color: SITUACAO_CFG[sit].color,
  })),
];

interface Props {
  tipo: RelatorioTipo;
  filtros: FiltrosState;
  onChange: (patch: Partial<FiltrosState>) => void;
  areas: Area[];
}

function CampoPeriodo({ filtros, onChange }: Pick<Props, "filtros" | "onChange">) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>PERÍODO</Text>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={s.input}
            value={filtros.dataInicio}
            onChangeText={(v) => onChange({ dataInicio: v })}
            placeholder="Início (DD/MM/AAAA)"
            placeholderTextColor={C.textMut}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            style={s.input}
            value={filtros.dataFim}
            onChangeText={(v) => onChange({ dataFim: v })}
            placeholder="Fim (DD/MM/AAAA)"
            placeholderTextColor={C.textMut}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
      </View>
      <Text style={s.dica}>Deixe em branco para os últimos 30 dias.</Text>
    </View>
  );
}

function CampoArea({ filtros, onChange, areas }: Pick<Props, "filtros" | "onChange" | "areas">) {
  if (areas.length === 0) return null;
  return (
    <SelectField
      label="ÁREA"
      value={filtros.areaId}
      onChange={(v) => onChange({ areaId: v })}
      options={[
        { value: null, label: "Todas as áreas" },
        ...areas.map((a) => ({ value: a.id, label: a.nome })),
      ]}
    />
  );
}

export function FiltrosRelatorio({ tipo, filtros, onChange, areas }: Props) {
  if (tipo === "ocorrencias") {
    return (
      <View style={{ gap: 16 }}>
        <CampoPeriodo filtros={filtros} onChange={onChange} />
        <SelectField
          label="TIPO DE OCORRÊNCIA"
          value={filtros.tipoOcorrencia}
          onChange={(v) => onChange({ tipoOcorrencia: v })}
          options={OPCOES_TIPO_OCORRENCIA}
        />
        <SelectField
          label="STATUS"
          value={filtros.status}
          onChange={(v) => onChange({ status: v })}
          options={OPCOES_STATUS}
        />
      </View>
    );
  }

  if (tipo === "visitas") {
    return (
      <View style={{ gap: 16 }}>
        <CampoPeriodo filtros={filtros} onChange={onChange} />
        <CampoArea filtros={filtros} onChange={onChange} areas={areas} />
        <SelectField
          label="SITUAÇÃO DO IMÓVEL"
          value={filtros.situacao}
          onChange={(v) => onChange({ situacao: v })}
          options={OPCOES_SITUACAO}
        />
      </View>
    );
  }

  if (tipo === "tratamentos") {
    return (
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>ANO</Text>
          <TextInput
            style={s.input}
            value={filtros.ano}
            onChangeText={(v) => onChange({ ano: v })}
            placeholder={String(new Date().getFullYear())}
            placeholderTextColor={C.textMut}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text style={s.label}>Nº DO TRATAMENTO (OPCIONAL)</Text>
          <TextInput
            style={s.input}
            value={filtros.numero}
            onChangeText={(v) => onChange({ numero: v })}
            placeholder="Ex.: 3"
            placeholderTextColor={C.textMut}
            keyboardType="numeric"
          />
        </View>
        <CampoArea filtros={filtros} onChange={onChange} areas={areas} />
      </View>
    );
  }

  // depositos
  return (
    <View style={{ gap: 16 }}>
      <CampoPeriodo filtros={filtros} onChange={onChange} />
      <CampoArea filtros={filtros} onChange={onChange} areas={areas} />
      <View style={{ gap: 6 }}>
        <Text style={s.label}>Nº DO TRATAMENTO (OPCIONAL)</Text>
        <TextInput
          style={s.input}
          value={filtros.numero}
          onChangeText={(v) => onChange({ numero: v })}
          placeholder="Ex.: 3"
          placeholderTextColor={C.textMut}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "600", color: C.textMut, letterSpacing: 1 },
  dica: { fontSize: 11, color: C.textMut },
  row: { flexDirection: "row", gap: 8 },
  input: {
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: C.text,
  },
});
