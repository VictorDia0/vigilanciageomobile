import * as SQLite from "expo-sqlite";

/**
 * Banco local do app (expo-sqlite).
 * Fase 1: apenas a outbox (fila de ações pendentes de sincronização).
 * Fase 2: cache de quadras/imóveis para operação 100% offline.
 */
let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("vigilancia.db");
    migrate(db);
  }
  return db;
}

function migrate(database: SQLite.SQLiteDatabase) {
  database.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_uuid TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL,            -- ex.: 'registrar_imovel'
      payload TEXT NOT NULL,         -- JSON da ação
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      tentativas INTEGER NOT NULL DEFAULT 0,
      ultimo_erro TEXT
    );

    -- Cache de leitura (Fase 2): último resultado bem-sucedido de uma
    -- chamada GET, servido quando a chamada falha por erro de rede.
    CREATE TABLE IF NOT EXISTS cache_leitura (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
