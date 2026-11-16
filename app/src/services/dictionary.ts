import { getDictionaryDb } from '@/db/client';
import { normalize } from '@/lib/normalize';
import type { EntryResult, SearchResponse, Translation, ValidationStatus } from '@/types';

type Row = {
  entry_id: number;
  term: string;
  grammatical_category: string | null;
  definition: string | null;
  translation_id: number;
  target_term: string;
  dialect: string | null;
  example: string | null;
  validation_status: ValidationStatus;
  source: string | null;
  source_reference: string | null;
  note: string | null;
};

const SELECT_ROWS = `
  SELECT e.id                   AS entry_id,
         e.term                 AS term,
         e.grammatical_category AS grammatical_category,
         e.definition           AS definition,
         t.id                   AS translation_id,
         t.target_term          AS target_term,
         d.name                 AS dialect,
         t.example              AS example,
         t.validation_status    AS validation_status,
         s.title                AS source,
         t.source_reference     AS source_reference,
         t.note                 AS note
    FROM entries e
    JOIN translations t ON t.entry_id = e.id
    LEFT JOIN dialects d ON d.id = t.dialect_id
    LEFT JOIN sources s ON s.id = t.source_id
`;

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function groupRows(rows: Row[]): EntryResult[] {
  const byEntry = new Map<number, EntryResult>();

  for (const row of rows) {
    let entry = byEntry.get(row.entry_id);
    if (!entry) {
      entry = {
        entryId: row.entry_id,
        term: row.term,
        grammaticalCategory: row.grammatical_category,
        definition: row.definition,
        translations: [],
      };
      byEntry.set(row.entry_id, entry);
    }

    const translation: Translation = {
      id: row.translation_id,
      targetTerm: row.target_term,
      dialect: row.dialect,
      example: row.example,
      validationStatus: row.validation_status,
      source: row.source,
      sourceReference: row.source_reference,
      note: row.note,
    };
    entry.translations.push(translation);
  }

  return sortEntries([...byEntry.values()]);
}

function sortEntries(entries: EntryResult[]): EntryResult[] {
  return entries.sort((a, b) => {
    const aVerified = a.translations.some((t) => t.validationStatus === 'verified') ? 0 : 1;
    const bVerified = b.translations.some((t) => t.validationStatus === 'verified') ? 0 : 1;
    if (aVerified !== bVerified) return aVerified - bVerified;
    return normalize(a.term).localeCompare(normalize(b.term));
  });
}

function withoutIds(entries: EntryResult[], excluded: Set<number>): EntryResult[] {
  return entries.filter((entry) => !excluded.has(entry.entryId));
}

export async function searchEntries(query: string): Promise<SearchResponse> {
  const q = normalize(query);
  if (!q) return { status: 'empty_query' };

  const db = getDictionaryDb();
  const like = escapeLike(q);

  const exact = groupRows(
    await db.getAllAsync<Row>(`${SELECT_ROWS} WHERE e.term_normalized = ? ORDER BY t.id`, q),
  );
  const exactIds = new Set(exact.map((entry) => entry.entryId));

  const excludedClause = exactIds.size > 0 ? `AND e.id NOT IN (${[...exactIds].map(() => '?').join(',')})` : '';
  const excludedParams = [...exactIds];

  const prefixRows = await db.getAllAsync<Row>(
    `${SELECT_ROWS}
      WHERE e.term_normalized LIKE ? ESCAPE '\\' ${excludedClause}
      ORDER BY e.term_normalized, t.id
      LIMIT 300`,
    [`${like}%`, ...excludedParams],
  );
  const prefix = withoutIds(groupRows(prefixRows), exactIds);

  const prefixIds = new Set([...exactIds, ...prefix.map((entry) => entry.entryId)]);
  const containsClause =
    prefixIds.size > 0 ? `AND e.id NOT IN (${[...prefixIds].map(() => '?').join(',')})` : '';
  const containsRows = await db.getAllAsync<Row>(
    `${SELECT_ROWS}
      WHERE e.term_normalized LIKE ? ESCAPE '\\' ${containsClause}
      ORDER BY e.term_normalized, t.id
      LIMIT 300`,
    [`%${like}%`, ...prefixIds],
  );
  const contains = withoutIds(groupRows(containsRows), prefixIds);
  const related = [...prefix, ...contains].slice(0, 30);

  let words: EntryResult[] = [];
  const parts = q.split(' ').filter((part) => part.length > 1);
  if (exact.length === 0 && parts.length > 1) {
    const seen = new Set<number>();
    for (const part of parts) {
      const rows = await db.getAllAsync<Row>(
        `${SELECT_ROWS} WHERE e.term_normalized = ? ORDER BY t.id`,
        part,
      );
      for (const entry of groupRows(rows)) {
        if (seen.has(entry.entryId)) continue;
        seen.add(entry.entryId);
        words.push(entry);
      }
    }
    words = sortEntries(words);
  }

  if (exact.length === 0 && related.length === 0 && words.length === 0) {
    return { status: 'no_match', query };
  }

  return { status: 'ok', query, exact, related, words };
}

export async function listEntries(options: {
  offset: number;
  limit: number;
  filter?: string;
}): Promise<EntryResult[]> {
  const db = getDictionaryDb();
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const filter = options.filter ? normalize(options.filter) : '';

  let idRows: { id: number }[];
  if (filter) {
    const like = escapeLike(filter);
    idRows = await db.getAllAsync<{ id: number }>(
      `SELECT id FROM entries WHERE term_normalized LIKE ? ESCAPE '\\'
       ORDER BY term_normalized LIMIT ? OFFSET ?`,
      [`${like}%`, limit, options.offset],
    );
    if (idRows.length === 0 && options.offset === 0) {
      idRows = await db.getAllAsync<{ id: number }>(
        `SELECT id FROM entries WHERE term_normalized LIKE ? ESCAPE '\\'
         ORDER BY term_normalized LIMIT ? OFFSET ?`,
        [`%${like}%`, limit, options.offset],
      );
    }
  } else {
    idRows = await db.getAllAsync<{ id: number }>(
      'SELECT id FROM entries ORDER BY term_normalized LIMIT ? OFFSET ?',
      [limit, options.offset],
    );
  }

  if (idRows.length === 0) return [];

  const placeholders = idRows.map(() => '?').join(',');
  const rows = await db.getAllAsync<Row>(
    `${SELECT_ROWS} WHERE e.id IN (${placeholders}) ORDER BY e.term_normalized, t.id`,
    idRows.map((row) => row.id),
  );
  return groupRows(rows);
}

export async function getEntry(entryId: number): Promise<EntryResult | null> {
  const db = getDictionaryDb();
  const rows = await db.getAllAsync<Row>(
    `${SELECT_ROWS} WHERE e.id = ? ORDER BY t.id`,
    entryId,
  );
  return rows.length > 0 ? groupRows(rows)[0] : null;
}

export async function countEntries(): Promise<number> {
  const db = getDictionaryDb();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM entries e
      WHERE EXISTS (SELECT 1 FROM translations t WHERE t.entry_id = e.id)`,
  );
  return row?.total ?? 0;
}
