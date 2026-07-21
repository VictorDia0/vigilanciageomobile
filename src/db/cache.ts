import { getDb } from "./database";

/**
 * Cache de leitura simples (Fase 2 do offline-first): guarda o último
 * resultado bem-sucedido de uma chamada GET para servir quando a chamada
 * falhar por erro de rede (ver isErroDeRede em services/sync.ts).
 */
export const cacheLeitura = {
  set(chave: string, valor: unknown): void {
    getDb().runSync(
      "INSERT OR REPLACE INTO cache_leitura (chave, valor, atualizado_em) VALUES (?, ?, datetime('now'))",
      [chave, JSON.stringify(valor)]
    );
  },

  get<T>(chave: string): T | null {
    const row = getDb().getFirstSync<{ valor: string }>(
      "SELECT valor FROM cache_leitura WHERE chave = ?",
      [chave]
    );
    return row ? JSON.parse(row.valor) : null;
  },
};
