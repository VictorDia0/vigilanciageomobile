import { getDb } from "./database";
import type { AtenderOcorrenciaPayload } from "../types/ocorrenciaAtendimento";

export type OutboxTipo =
  | "registrar_imovel"
  | "fechar_visita"
  | "encerrar_quadra"
  | "registrar_recuperacao"
  | "atender_ocorrencia";

export interface OutboxItem<T = any> {
  id: number;
  client_uuid: string;
  tipo: OutboxTipo;
  payload: T;
  criado_em: string;
  tentativas: number;
  ultimo_erro: string | null;
}

/** Payload da ação composta: criar imóvel (se novo) + registrar visita */
export interface RegistrarImovelOffline {
  visita_id: number;
  quadra_id: number;
  imovel: {
    logradouro: string;
    numero: string | null;
    sem_numero: boolean;
    tipo_imovel: string;
  };
  registro: {
    horario_visita: string;
    situacao: string;
    focos_eliminados: number;
    tratado: boolean;
    quantidade_larvicida: number | null;
    depositos_tratados: number | null;
    latitude?: number;
    longitude?: number;
    mocked?: boolean;
    // ── Anti-fraude ──
    lat_inicio?: number | null;
    lng_inicio?: number | null;
    precisao_gps_inicio?: number | null;
    lat_fim?: number | null;
    lng_fim?: number | null;
    precisao_gps_fim?: number | null;
    distancia_metros?: number | null;
    distancia_flag?: boolean;
    iniciada_em?: string;
    finalizada_em?: string;
    tempo_visita_segundos?: number;
    gps_mocked?: boolean;
    gps_disponivel?: boolean;
    plataforma?: "ios" | "android";
    versao_app?: string;
  };
}

/** Encerra a sessão do dia (quadra continua em_andamento) */
export interface FecharVisitaOffline {
  visita_id: number;
}

/** Fecha a sessão do dia (se houver) e marca a quadra como concluída (definitivo) */
export interface EncerrarQuadraOffline {
  visita_id: number | null;
  quadra_id: number;
}

export interface RegistrarRecuperacaoOffline {
  imovel_id: number;
  payload: {
    tratamento_id: number;
    situacao: string;
    horario_visita: string;
    focos_eliminados: number;
    tratado: boolean;
    quantidade_larvicida: number | null;
    depositos_tratados: number | null;
    latitude?: number;
    longitude?: number;
    mocked?: boolean;
  };
}

/** Fotos guardam a URI local — resolvida de novo (arquivo lido do
 * aparelho) só na hora de sincronizar, não fica nada em memória parado. */
export interface AtenderOcorrenciaOffline {
  ocorrencia_id: number;
  dados: AtenderOcorrenciaPayload;
  fotos: { uri: string; name: string; type: string }[];
}

function uuid(): string {
  // suficiente p/ idempotência local — não precisa ser cripto-seguro
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const outbox = {
  enqueue(tipo: OutboxTipo, payload: object): string {
    const client_uuid = uuid();
    getDb().runSync(
      "INSERT INTO outbox (client_uuid, tipo, payload) VALUES (?, ?, ?)",
      [client_uuid, tipo, JSON.stringify(payload)]
    );
    return client_uuid;
  },

  pendentes(): OutboxItem[] {
    const rows = getDb().getAllSync<any>(
      "SELECT * FROM outbox ORDER BY id ASC"
    );
    return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
  },

  total(): number {
    const row = getDb().getFirstSync<{ n: number }>(
      "SELECT COUNT(*) as n FROM outbox"
    );
    return row?.n ?? 0;
  },

  /** Itens que já tentaram sincronizar pelo menos uma vez e falharam por erro
   * de negócio (não é falta de rede — vai continuar falhando até alguém agir). */
  comFalha(): number {
    const row = getDb().getFirstSync<{ n: number }>(
      "SELECT COUNT(*) as n FROM outbox WHERE tentativas > 0"
    );
    return row?.n ?? 0;
  },

  /** Mensagem do erro mais recente entre os itens com falha, pra diagnóstico. */
  ultimoErro(): string | null {
    const row = getDb().getFirstSync<{ ultimo_erro: string | null }>(
      "SELECT ultimo_erro FROM outbox WHERE tentativas > 0 ORDER BY id ASC LIMIT 1"
    );
    return row?.ultimo_erro ?? null;
  },

  /** Itens que já falharam pelo menos uma vez — pra tela de gerenciamento
   * manual (ver motivo, descartar o que não tem mais salvação). */
  listarComFalha(): OutboxItem[] {
    const rows = getDb().getAllSync<any>(
      "SELECT * FROM outbox WHERE tentativas > 0 ORDER BY id ASC"
    );
    return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
  },

  remover(id: number) {
    getDb().runSync("DELETE FROM outbox WHERE id = ?", [id]);
  },

  registrarErro(id: number, erro: string) {
    getDb().runSync(
      "UPDATE outbox SET tentativas = tentativas + 1, ultimo_erro = ? WHERE id = ?",
      [erro, id]
    );
  },
};
