# database-schema.md — Schéma des données de LinguaLocal

Deux bases SQLite, encodage UTF-8.

| Base | Rôle | Accès dans l'app | Créée par |
|---|---|---|---|
| `fulfulde.db` | Dictionnaire | Lecture seule | Script Python d'import (sur le PC) |
| `user.db` | Favoris et historique | Lecture/écriture | L'application, au premier lancement |

Il n'existe pas de clé étrangère entre les deux bases : `favorites.translation_id` référence `translations.id` de `fulfulde.db` de façon logique. L'application gère le cas où l'identifiant n'existe plus (favori ignoré).

---

## 1. fulfulde.db

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE db_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- ex. : ('dictionary_version', '1.0'), ('built_at', '2026-11-20')

CREATE TABLE languages (
  id   INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,     -- 'fr', 'ff'
  name TEXT NOT NULL             -- 'Français', 'Fulfulde'
);

CREATE TABLE dialects (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,   -- 'Extrême-Nord'
  description TEXT,
  language_id INTEGER NOT NULL REFERENCES languages(id)
);

CREATE TABLE sources (
  id           INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,         -- 'Dictionnaire français-foulfouldé...'
  author       TEXT,
  year         INTEGER,
  license_note TEXT                   -- droits / conditions d'usage
);

CREATE TABLE entries (
  id                   INTEGER PRIMARY KEY,
  term                 TEXT NOT NULL,   -- forme française affichée
  term_normalized      TEXT NOT NULL,   -- minuscules, sans accents, espaces nettoyés
  language_id          INTEGER NOT NULL REFERENCES languages(id),
  grammatical_category TEXT,            -- nom, verbe, adjectif, expression...
  definition           TEXT
);

CREATE TABLE translations (
  id                    INTEGER PRIMARY KEY,
  entry_id              INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  target_term           TEXT NOT NULL,  -- équivalent fulfulde (graphie d'origine)
  target_term_normalized TEXT NOT NULL, -- pour une éventuelle recherche inverse future
  dialect_id            INTEGER REFERENCES dialects(id),
  example               TEXT,
  validation_status     TEXT NOT NULL DEFAULT 'unverified'
                        CHECK (validation_status IN ('verified','unverified')),
  source_id             INTEGER REFERENCES sources(id),
  source_reference      TEXT,           -- page, section
  note                  TEXT            -- graphie, usage
);

CREATE INDEX idx_entries_term_norm     ON entries(term_normalized);
CREATE INDEX idx_translations_entry    ON translations(entry_id);
CREATE INDEX idx_translations_status   ON translations(validation_status);
```

### Règles
- **Normalisation** : `term_normalized` est calculé par le script d'import avec la même fonction que celle de l'application (voir section 3).
- **Identifiants stables** : à chaque régénération, un même couple (terme, catégorie, équivalent fulfulde) doit conserver le même `translations.id`. Le script lit l'ancienne base ou un fichier de correspondance `id_map.csv` et réattribue les mêmes identifiants. Les nouvelles lignes reçoivent de nouveaux identifiants, jamais réutilisés.
- **Une entrée, plusieurs traductions** : un même terme français (même catégorie) donne une ligne dans `entries` et plusieurs lignes dans `translations`.
- **Homonymes** : un même terme avec deux catégories différentes donne deux entrées.

### Requêtes de recherche (référence)
```sql
-- Exacte (sur le terme normalisé)
SELECT e.*, t.* FROM entries e
JOIN translations t ON t.entry_id = e.id
WHERE e.term_normalized = :q;

-- Partielle (préfixe d'abord : utilise l'index)
WHERE e.term_normalized LIKE :q || '%';

-- Partielle (contient : plus lent, acceptable pour quelques milliers d'entrées)
WHERE e.term_normalized LIKE '%' || :q || '%';
```

Ordre de priorité : expression exacte, puis préfixe, puis « contient ».

---

## 2. user.db

```sql
CREATE TABLE favorites (
  id             INTEGER PRIMARY KEY,
  translation_id INTEGER NOT NULL UNIQUE,   -- référence logique vers fulfulde.db
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE search_history (
  id          INTEGER PRIMARY KEY,
  search_term TEXT NOT NULL,
  search_date TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_history_date ON search_history(search_date DESC);
```

### Règles
- Historique limité aux 50 dernières recherches (suppression des plus anciennes à l'insertion).
- Une recherche répétée met à jour la date au lieu de créer un doublon.
- Aucune donnée personnelle ni transmission externe.

---

## 3. Fonction de normalisation (identique Python et TypeScript)

Étapes, dans cet ordre :
1. Passer en minuscules.
2. Décomposer en Unicode NFD et supprimer les marques diacritiques (accents).
3. Remplacer les apostrophes typographiques (’) par l'apostrophe droite (').
4. Réduire les espaces multiples à un seul, puis supprimer les espaces en début et fin.

Cas d'attention :
- Appliquer la normalisation aux termes **français** (colonne `term_normalized`).
- Ne **pas** supprimer les lettres spéciales du fulfulde (ɓ, ɗ, ŋ, ƴ) dans l'affichage ; leur traitement dans `target_term_normalized` est décidé et documenté une fois, puis testé.
- Un jeu de cas de test commun (`normalization_cases.json`) est exécuté en Python et en Jest et doit donner les mêmes résultats.

---

## 4. Du CSV à la base

Fichier maître : `data-pipeline/data/validated.csv` (UTF-8).

| Colonne CSV | Destination |
|---|---|
| `french_term` | `entries.term` (+ `term_normalized` calculé) |
| `grammatical_category` | `entries.grammatical_category` |
| `definition` | `entries.definition` |
| `fulfulde_term` | `translations.target_term` (+ normalisé) |
| `dialect` | `dialects.name` (créé s'il n'existe pas) |
| `example` | `translations.example` |
| `source_reference` | `sources` (titre) + `translations.source_reference` |
| `validation_status` | `translations.validation_status` |
| `note` | `translations.note` |

### Étapes du script d'import
1. Lire `validated.csv`, rejeter les lignes invalides (terme vide, statut inconnu) et les lister dans un rapport.
2. Créer `fulfulde.db` à neuf avec le schéma ci-dessus.
3. Créer ou retrouver les lignes de `languages`, `dialects`, `sources`.
4. Pour chaque ligne : retrouver ou créer l'entrée (terme normalisé + catégorie), puis insérer la traduction.
5. Conserver les identifiants stables (`id_map.csv`).
6. Renseigner `db_meta` (version, date de génération).
7. Exécuter les contrôles : aucun `term` vide, aucun doublon exact, toutes les traductions rattachées à une entrée, statuts valides, comptage final.
8. Copier `fulfulde.db` dans les assets de l'application.

---

## 5. Contraintes pour l'agent de codage
- Ne jamais modifier `fulfulde.db` à la main : toujours régénérer depuis `validated.csv`.
- Ne jamais écrire dans `fulfulde.db` depuis l'application.
- Ne jamais compléter un champ absent par supposition.
- Une seule implémentation de la normalisation par langage, testée avec `normalization_cases.json`.
