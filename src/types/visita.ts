import type { AgenteResumo } from "./agente";
import type { Quadra } from "./quadra";
import type { Imovel } from "./imovel";

export type { StatusValor, LabeledField } from "./comum";
import type { StatusValor, LabeledField } from "./comum";

// ─── Enums (espelham Laravel) ─────────────────────────────────────────────────
export type SituacaoImovel = "N" | "R" | "REC" | "F";

export type StatusVisita      = "aberta" | "em_andamento" | "concluida" | "cancelada";

/**
 * Como a quadra selecionada será aberta:
 * - iniciar:   quadra nao_iniciada → abre a 1ª sessão
 * - continuar: já existe sessão ABERTA (ex.: app fechou no meio do dia)
 * - retomar:   quadra em_andamento, sessão de ontem fechada → abre NOVA sessão
 */
export type ModoInicio = "iniciar" | "continuar" | "retomar";

// ─── Entidades ────────────────────────────────────────────────────────────────
export interface Visita {
  id: number;
  data: string | null;
  status: StatusValor;           // { value: "aberta", label: "Aberta" }
  agente?: AgenteResumo;
  quadra?: Quadra;
  imoveis?: Imovel[];
  total_imoveis?: number;
  total_focos_eliminados?: number;
  total_larvicida?: number;
  total_depositos?: number;
  created_at: string | null;
}

export interface VisitaImovelPivot {
  horario_visita: string | null;  // ← null pois pivot pode não ter
  situacao: LabeledField<SituacaoImovel>;
  focos_eliminados: number;
  tratado: boolean;
  quantidade_larvicida: number | null;
  depositos_tratados: number | null;
}

export interface QuadraResumo {
  id: number;
  numero: number;                 // ← é `numero` no QuadraResource, não `nome`
  status: string;
  agente_id: number | null;       // ← vem do QuadraResource
}

// ─── Payloads de API ──────────────────────────────────────────────────────────
export interface AbrirVisitaPayload {
  quadra_id: number;
  tratamento_id: number;
}

export interface RegistrarImovelPayload {
  imovel_id: number;
  horario_visita: string;
  situacao: SituacaoImovel;
  focos_eliminados: number;
  tratado: boolean;
  quantidade_larvicida: number | null;
  depositos_tratados: number | null;
  /** idempotência p/ sync offline — servidor ignora duplicatas */
  client_uuid?: string;
  /** paths retornados por visitaService.uploadFoto */
  fotos?: string[];
  /** GPS capturado no momento do registro — usado pelo backend p/ detecção de anomalia */
  latitude?: number;
  longitude?: number;
  /** true quando o provider de localização do dispositivo estava mockado */
  mocked?: boolean;

  // ── Anti-fraude (backend ainda não lê estes campos — enviados para quando ler) ──
  /** GPS capturado ao abrir o formulário do imóvel */
  lat_inicio?: number | null;
  lng_inicio?: number | null;
  precisao_gps_inicio?: number | null;
  /** GPS capturado ao salvar (mesmo instante de `latitude`/`longitude` acima) */
  lat_fim?: number | null;
  lng_fim?: number | null;
  precisao_gps_fim?: number | null;
  /** Distância entre o GPS de início e o de fim do preenchimento, em metros */
  distancia_metros?: number | null;
  /** true se distancia_metros > 50 */
  distancia_flag?: boolean;
  /** ISO 8601 — abertura do formulário do imóvel */
  iniciada_em?: string;
  /** ISO 8601 — submit do formulário */
  finalizada_em?: string;
  tempo_visita_segundos?: number;
  /** true se qualquer uma das leituras de GPS (início ou fim) veio de um provider mockado */
  gps_mocked?: boolean;
  /** false quando nenhuma das duas leituras de GPS foi obtida */
  gps_disponivel?: boolean;
  plataforma?: "ios" | "android";
  versao_app?: string;
}

// ─── Recuperação (imóveis fechados) ──────────────────────────────────────────
export interface RecuperacaoPendente {
  imovel: Imovel;
  quadra: QuadraResumo;
  area?: { id: number; nome: string };
  ultima_tentativa: string | null;
  tentativas: number;
}

export interface RegistrarRecuperacaoPayload {
  tratamento_id: number;
  situacao: SituacaoImovel; // REC | R | F
  horario_visita: string;
  focos_eliminados: number;
  tratado: boolean;
  quantidade_larvicida: number | null;
  depositos_tratados: number | null;
  latitude?: number;
  longitude?: number;
  mocked?: boolean;
}

// (Estado de formulário local vive junto do hook que o usa: src/hooks/useVisitas.ts)