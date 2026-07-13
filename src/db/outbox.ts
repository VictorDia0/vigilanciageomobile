import { getDb } from "./database";

export type OutboxTipo = "registrar_imovel";

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
  };
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
