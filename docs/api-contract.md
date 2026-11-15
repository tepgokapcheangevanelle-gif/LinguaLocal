# api-contract.md — Contrat des services internes

Il n'y a pas d'API réseau. Le « contrat » est l'ensemble des fonctions TypeScript de `src/services/`, utilisées par les hooks et les écrans. Les écrans n'écrivent jamais de SQL.

Toutes les fonctions sont **asynchrones** (`Promise`) et ne lèvent d'erreur que pour une panne de base (voir §7).

## 1. Types partagés (`src/types.ts`)

```ts
export type ValidationStatus = 'verified' | 'unverified';

export type Translation = {
  id: number;
  targetTerm: string;               // équivalent fulfulde (graphie d'origine)
  dialect: string | null;
  example: string | null;
  validationStatus: ValidationStatus;
  source: string | null;            // titre de la source
  sourceReference: string | null;   // page, section
  note: string | null;
};

export type EntryResult = {
  entryId: number;
  term: string;                     // terme français affiché
  grammaticalCategory: string | null;
  definition: string | null;
  translations: Translation[];      // au moins 1
};

export type SearchResponse =
  | { status: 'empty_query' }
  | { status: 'no_match'; query: string }
  | { status: 'ok'; query: string; exact: EntryResult[]; related: EntryResult[]; words: EntryResult[] };

export type FavoriteItem = { translation: Translation; term: string; createdAt: string };
export type HistoryItem = { id: number; searchTerm: string; searchDate: string };
```

## 2. Bibliothèque (`src/lib/normalize.ts`)

| Fonction | Signature | Comportement |
|---|---|---|
| `normalize` | `(text: string) => string` | Minuscules, accents retirés, apostrophes typographiques vers `'`, espaces réduits et rognés. Fonction pure, testée avec `normalization_cases.json`. |

## 3. Bases (`src/db/client.ts`)

| Fonction | Signature | Comportement |
|---|---|---|
| `initDatabases` | `() => Promise<void>` | Copie `fulfulde.db` des assets si absente ou si l'asset est plus récent (`db_meta.dictionary_version`), crée `user.db` et ses tables. À appeler une fois au démarrage. |
| `getDictionaryDb` | `() => SQLiteDatabase` | Base du dictionnaire (lecture seule). Erreur si `initDatabases` n'a pas réussi. |
| `getUserDb` | `() => SQLiteDatabase` | Base utilisateur. |
| `getDictionaryInfo` | `() => Promise<{ version: string; builtAt: string }>` | Lit `db_meta`. |

## 4. Recherche et dictionnaire (`src/services/`)

| Fonction | Signature | Retour et règles |
|---|---|---|
| `searchEntries` | `(query: string) => Promise<SearchResponse>` | Algorithme de `spec.md` §2. Requête vide : `empty_query`. Ne modifie pas l'historique. |
| `listEntries` | `(opts: { offset: number; limit: number; filter?: string }) => Promise<EntryResult[]>` | Tri alphabétique sur `term_normalized`. `limit` max 100. `filter` normalisé (préfixe puis « contient »). |
| `getEntry` | `(entryId: number) => Promise<EntryResult \| null>` | `null` si inconnue. |
| `countEntries` | `() => Promise<number>` | Nombre d'entrées ayant au moins une traduction. |

## 5. Favoris (`favorites.ts`)

| Fonction | Signature | Règles |
|---|---|---|
| `addFavorite` | `(translationId: number) => Promise<void>` | Idempotente. |
| `removeFavorite` | `(translationId: number) => Promise<void>` | Aucune erreur si absent. |
| `isFavorite` | `(translationId: number) => Promise<boolean>` | |
| `listFavorites` | `() => Promise<FavoriteItem[]>` | Plus récents d'abord ; identifiants introuvables dans le dictionnaire ignorés. |
| `getFavoriteIds` | `() => Promise<Set<number>>` | Pour afficher l'état ♡ d'une liste en une requête. |

## 6. Historique (`history.ts`)

| Fonction | Signature | Règles |
|---|---|---|
| `addHistory` | `(term: string) => Promise<void>` | Appelée à la soumission d'une recherche non vide, qu'elle trouve ou non un résultat. Doublon (même `normalize`) : met la date à jour. Conserve 50 entrées maximum. |
| `listHistory` | `() => Promise<HistoryItem[]>` | Plus récentes d'abord. |
| `clearHistory` | `() => Promise<void>` | Après confirmation dans l'interface. |

## 7. Erreurs

```ts
export class DictionaryUnavailableError extends Error {}  // fulfulde.db absente ou illisible
export class UserDataUnavailableError extends Error {}    // user.db illisible
```

| Situation | Comportement |
|---|---|
| `DictionaryUnavailableError` | L'écran affiche « Dictionnaire indisponible » avec « Réessayer » |
| `UserDataUnavailableError` | Favoris et historique désactivés, message discret, recherche toujours possible |
| Résultat vide | Ce n'est pas une erreur : `no_match` ou liste vide |

## 8. Hooks (`src/hooks/`)

| Hook | Rôle |
|---|---|
| `useSearch()` | Gère `query`, `state` (`idle`, `loading`, `ok`, `no_match`, `empty_query`, `error`), `submit()` ; appelle `searchEntries` puis `addHistory` |
| `useDictionary(filter)` | Pagination et filtre de la liste |
| `useFavorites()` | Liste + `toggle(translationId)` |
| `useHistory()` | Liste + `clear()` |

## 9. Garanties du contrat
- Aucune fonction ne retourne un texte de traduction qui ne provient pas de la base.
- Les requêtes SQL sont paramétrées.
- `fulfulde.db` n'est jamais écrite par l'application.
- Les types de ce fichier sont la seule définition de référence : toute modification passe par ce document.
