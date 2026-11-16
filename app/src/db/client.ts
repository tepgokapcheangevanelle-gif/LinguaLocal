import * as SQLite from 'expo-sqlite';

const DICTIONARY_ASSET = require('../../assets/db/seed_test.db');
const DICTIONARY_FILENAME = 'fulfulde.db';
const USER_FILENAME = 'user.db';

const USER_SCHEMA = `
  CREATE TABLE IF NOT EXISTS favorites (
    id             INTEGER PRIMARY KEY,
    translation_id INTEGER NOT NULL UNIQUE,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS search_history (
    id          INTEGER PRIMARY KEY,
    search_term TEXT NOT NULL,
    search_date TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_history_date ON search_history(search_date DESC);
`;

export class DictionaryUnavailableError extends Error {}
export class UserDataUnavailableError extends Error {}

let dictionaryDb: SQLite.SQLiteDatabase | null = null;
let userDb: SQLite.SQLiteDatabase | null = null;
let initialization: Promise<void> | null = null;

/**
 * Importe la base embarquée dans le répertoire SQLite (mobile) ou dans le
 * stockage du navigateur (web). `expo-sqlite` gère les deux plateformes et
 * n'écrase pas une base déjà importée.
 */
async function installDictionaryFromAssets(): Promise<void> {
  await SQLite.importDatabaseFromAssetAsync(DICTIONARY_FILENAME, {
    assetId: DICTIONARY_ASSET,
  });
}

async function openDatabases(): Promise<void> {
  try {
    await installDictionaryFromAssets();
    dictionaryDb = await SQLite.openDatabaseAsync(DICTIONARY_FILENAME);
    // Le dictionnaire est en lecture seule dans l'application (AGENTS.md §3).
    await dictionaryDb.execAsync('PRAGMA query_only = ON;');
  } catch (error) {
    dictionaryDb = null;
    throw error instanceof DictionaryUnavailableError
      ? error
      : new DictionaryUnavailableError('Impossible d’ouvrir le dictionnaire embarqué.', {
          cause: error,
        });
  }

  // L'application reste utilisable sans user.db (favoris et historique désactivés).
  try {
    userDb = await SQLite.openDatabaseAsync(USER_FILENAME);
    await userDb.execAsync(USER_SCHEMA);
  } catch {
    userDb = null;
  }
}

export function initDatabases(): Promise<void> {
  if (!initialization) {
    initialization = openDatabases().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export function getDictionaryDb(): SQLite.SQLiteDatabase {
  if (!dictionaryDb) {
    throw new DictionaryUnavailableError('La base du dictionnaire n’est pas ouverte.');
  }
  return dictionaryDb;
}

export function getUserDb(): SQLite.SQLiteDatabase {
  if (!userDb) {
    throw new UserDataUnavailableError('La base utilisateur n’est pas disponible.');
  }
  return userDb;
}

export async function getDictionaryInfo(): Promise<{ version: string; builtAt: string }> {
  const rows = await getDictionaryDb().getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM db_meta WHERE key IN ('dictionary_version', 'built_at')",
  );
  const meta = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { version: meta.dictionary_version ?? '', builtAt: meta.built_at ?? '' };
}
