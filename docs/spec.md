# spec.md — Spécifications techniques de comportement

## 1. Normalisation
Fonction unique `normalize(text)` (TypeScript) et son équivalent Python, définies dans `database-schema.md` §3 :
1. minuscules ; 2. suppression des accents (NFD puis retrait des marques) ; 3. apostrophes typographiques vers `'` ; 4. espaces multiples réduits, bords retirés.

Les deux implémentations passent les mêmes cas de `normalization_cases.json`.

## 2. Algorithme de recherche `searchEntries(query)`

**Entrée** : chaîne saisie. **Sortie** : un objet `SearchResponse`.

```ts
type Translation = {
  id: number;
  targetTerm: string;
  dialect: string | null;
  example: string | null;
  validationStatus: 'verified' | 'unverified';
  source: string | null;        // titre de la source
  sourceReference: string | null;
  note: string | null;
};

type EntryResult = {
  entryId: number;
  term: string;
  grammaticalCategory: string | null;
  definition: string | null;
  translations: Translation[];
};

type SearchResponse =
  | { status: 'empty_query' }
  | { status: 'no_match'; query: string }
  | { status: 'ok'; query: string; exact: EntryResult[]; related: EntryResult[]; words: EntryResult[] };
```

**Étapes**
1. `q = normalize(query)`. Si `q` est vide : retourner `empty_query`, aucune écriture en historique.
2. **Exact** : `term_normalized = q`.
3. **Proches** : `term_normalized LIKE q%` (préfixe), puis `LIKE %q%`, en excluant les entrées déjà dans `exact`. Limite : 30 résultats proches.
4. **Mots isolés** : seulement si `q` contient plusieurs mots **et** que `exact` est vide : chercher chaque mot (exact) séparément. Ces résultats vont dans `words` et sont présentés comme « mots de votre saisie », jamais comme une traduction de la phrase.
5. Si `exact`, `related` et `words` sont tous vides : `no_match`.
6. Tri dans chaque groupe : entrées avec au moins une traduction `verified` d'abord, puis ordre alphabétique de `term_normalized`.
7. Pas de bouton exact/partiel : la recherche applique toujours exact puis proches. L'interface étiquette les deux groupes.

**Règles**
- Aucune entrée sans traduction n'est retournée (jointure sur `translations`).
- Aucun texte n'est généré ni complété : tout vient de la base.
- La requête SQL utilise des paramètres liés (jamais de concaténation).

## 3. Dictionnaire
- `listEntries(offset, limit, filter?)` : ordre alphabétique de `term_normalized`, pagination par 50, `filter` appliqué comme préfixe/« contient » normalisé.
- `getEntry(id)` : entrée et toutes ses traductions, ou `null` si inconnue.
- `countEntries()` : nombre d'entrées pour l'accueil.

## 4. Favoris (`user.db`)
- `addFavorite(translationId)` : insertion, idempotente (déjà présent = aucune erreur).
- `removeFavorite(translationId)`.
- `listFavorites()` : lit `user.db`, puis charge les détails des traductions depuis `fulfulde.db`. Les identifiants introuvables sont ignorés à l'affichage.
- L'état « favori » d'une traduction est visible partout où elle s'affiche.

## 5. Historique (`user.db`)
- `addHistory(term)` : appelé à chaque recherche **soumise** non vide, qu'elle trouve ou non un résultat.
- Une recherche répétée (même `normalize`) met à jour la date, sans doublon.
- Conservation : 50 entrées maximum, les plus anciennes supprimées.
- `listHistory()` : plus récentes d'abord. `clearHistory()` : vide après confirmation.

## 6. Affichage
- Badge « Vérifié » ou « Non vérifié » sur chaque traduction.
- Champs absents (exemple, définition, note) : non affichés, jamais remplacés par un texte inventé.
- Source absente : « Source non renseignée ».
- Caractères Unicode (ɓ, ɗ, ŋ, ƴ) affichés avec une police qui les supporte ; vérification manuelle obligatoire.
- Copie : texte `terme français : équivalent fulfulde`, confirmation brève.

## 7. Initialisation et erreurs
- Au premier lancement : copier `fulfulde.db` des assets vers le stockage, créer `user.db` et ses tables.
- Si la copie ou l'ouverture de `fulfulde.db` échoue : écran d'erreur « Dictionnaire indisponible » avec bouton « Réessayer ».
- Si `user.db` échoue : l'app reste utilisable ; favoris et historique sont désactivés avec message discret.
- Mise à jour du dictionnaire : comparer `db_meta.dictionary_version` de l'asset avec celle du stockage ; si l'asset est plus récent, remplacer `fulfulde.db` sans toucher à `user.db`.

## 8. Performance
- Recherche courante < 1 s sur la base livrée.
- Requêtes sur colonnes indexées ; recherche déclenchée à la soumission (pas à chaque frappe) pour la v1.0.
- Liste du dictionnaire paginée, rendue avec `FlatList`.

## 9. Tests (Jest) — cas obligatoires
| Domaine | Cas |
|---|---|
| Normalisation | casse, accents, apostrophes, espaces multiples, chaîne vide |
| Recherche | exact, préfixe, contient, ordre vérifié avant non vérifié, plusieurs traductions, homonymes |
| Cas limites | requête vide, espaces seuls, mot absent, phrase multi-mots avec mots connus |
| Favoris | ajout, ajout répété, retrait, identifiant disparu |
| Historique | doublon, limite de 50, effacement |
| Parité | `normalization_cases.json` identique à la sortie Python |
