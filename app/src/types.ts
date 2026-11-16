/**
 * Types du contrat interne (docs/api-contract.md §1).
 * Toute évolution passe par ce document de référence.
 */
export type ValidationStatus = 'verified' | 'unverified';

export type Translation = {
  id: number;
  targetTerm: string;
  dialect: string | null;
  example: string | null;
  validationStatus: ValidationStatus;
  source: string | null;
  sourceReference: string | null;
  note: string | null;
};

export type EntryResult = {
  entryId: number;
  term: string;
  grammaticalCategory: string | null;
  definition: string | null;
  translations: Translation[];
};

export type SearchResponse =
  | { status: 'empty_query' }
  | { status: 'no_match'; query: string }
  | {
      status: 'ok';
      query: string;
      exact: EntryResult[];
      related: EntryResult[];
      words: EntryResult[];
    };

export type FavoriteItem = { translation: Translation; term: string; createdAt: string };
export type HistoryItem = { id: number; searchTerm: string; searchDate: string };
