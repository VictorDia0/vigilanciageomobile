export type SituacaoEncontrada =
  | "confirmado"
  | "nao_encontrado"
  | "falso_alarme"
  | "encaminhado";

export interface OcorrenciaAtendimento {
  id: number;
  nome_morador: string | null;
  telefone_contato: string | null;
  endereco_confirmado: string;
  situacao_encontrada: SituacaoEncontrada;
  descricao: string | null;
  fotos: string[] | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
}

export interface AtenderOcorrenciaPayload {
  nome_morador?: string | null;
  telefone_contato?: string | null;
  endereco_confirmado: string;
  situacao_encontrada: SituacaoEncontrada;
  descricao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
