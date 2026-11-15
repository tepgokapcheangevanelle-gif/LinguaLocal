# architecture.md — Architecture de LinguaLocal

## 1. Principe
Application mobile autonome : **pas de backend**. Le « serveur » est le code de l'application, la « base distante » est un fichier SQLite embarqué.

```
PC (hors app)                               Téléphone
─────────────                               ─────────
Dictionnaire_Peul.pdf                       APK
   ↓ extraction (Python)                    ├─ Écrans React Native
raw.csv → clean.csv → validated.csv         ├─ Services TypeScript (recherche, favoris…)
   ↓ import (Python)                        ├─ fulfulde.db (assets, lecture seule)
fulfulde.db ───── copie dans assets ──────► └─ user.db (créée sur l'appareil)
```

## 2. Pile technique
| Besoin | Choix |
|---|---|
| Framework | Expo + React Native + TypeScript |
| Navigation | Expo Router, onglets |
| SQLite | `expo-sqlite` |
| Copier la base des assets | `expo-asset` + `expo-file-system` |
| Presse-papiers | `expo-clipboard` |
| Tests | Jest (+ `jest-expo`) |
| Données hors app | Python 3 (pdfplumber ou PyMuPDF, pandas, éventuellement Tesseract) |
| Build APK | EAS Build |

Principe de sobriété : pas de bibliothèque d'état globale ni d'ORM ; des fonctions simples et des hooks suffisent.

## 3. Structure du dépôt

```
lingualocal/
├─ AGENTS.md
├─ docs/                       scope, prd, spec, architecture, database-schema, ui-ux, api-contract, roadmap
├─ data-pipeline/              (Python, hors app)
│  ├─ source/Dictionnaire_Peul.pdf
│  ├─ extract.py               PDF → raw.csv
│  ├─ clean.py                 raw.csv → clean.csv
│  ├─ build_db.py              validated.csv → fulfulde.db (+ id_map.csv)
│  ├─ checks.py                contrôles de cohérence
│  ├─ normalize.py             normalisation Python
│  ├─ data/ raw.csv, clean.csv, validated.csv, id_map.csv
│  └─ tests/
├─ shared/
│  └─ normalization_cases.json cas de test communs Python / Jest
└─ app/                        (Expo)
   ├─ app/                     écrans (Expo Router)
   │  ├─ (tabs)/index.tsx          Accueil
   │  ├─ (tabs)/translate.tsx      Traducteur
   │  ├─ (tabs)/dictionary.tsx     Dictionnaire
   │  ├─ (tabs)/favorites.tsx
   │  ├─ (tabs)/history.tsx
   │  └─ entry/[id].tsx            Détail d'une entrée
   ├─ src/
   │  ├─ db/          client.ts (ouverture, init, versions), schema-user.ts
   │  ├─ services/    search.ts, dictionary.ts, favorites.ts, history.ts
   │  ├─ lib/         normalize.ts
   │  ├─ components/  ResultCard, ValidationBadge, EmptyState, SearchBar…
   │  ├─ hooks/       useSearch, useFavorites…
   │  └─ theme/       couleurs, typographie
   ├─ assets/db/fulfulde.db
   └─ __tests__/
```

## 4. Couches de l'application
| Couche | Rôle | Règle |
|---|---|---|
| Écrans (`app/`) | Affichage et interactions | N'écrivent aucune requête SQL |
| Hooks | État de l'écran (chargement, résultat, erreur) | Appellent les services |
| Services (`src/services/`) | Logique métier et requêtes SQL | Seul endroit qui parle à SQLite |
| DB (`src/db/`) | Ouverture, copie, versions des bases | Gère `fulfulde.db` en lecture seule |
| Lib | Fonctions pures (`normalize`) | Testées par Jest |

Les fonctions des services forment le « contrat d'API » interne, décrit dans `api-contract.md`.

## 5. Cycle de vie des bases
1. **Premier lancement** : si `fulfulde.db` n'existe pas dans le stockage, le copier depuis les assets ; créer `user.db` avec ses tables.
2. **Lancements suivants** : ouvrir les deux bases. Comparer `db_meta.dictionary_version` (asset vs stockage) ; si l'asset est plus récent, remplacer `fulfulde.db` et conserver `user.db`.
3. `fulfulde.db` est ouverte en lecture seule ; aucune écriture côté application.

## 6. Pipeline de données (hors application)

| Étape | Script | Entrée → sortie | Contrôle humain |
|---|---|---|---|
| 1. Extraction | `extract.py` | PDF → `raw.csv` | Échantillon relu à la main |
| 2. Nettoyage | `clean.py` | `raw.csv` → `clean.csv` | Rapport des lignes rejetées |
| 3. Validation | (manuelle) | `clean.csv` → `validated.csv` | Relecture, colonne `validation_status` |
| 4. Import | `build_db.py` | `validated.csv` → `fulfulde.db` | Rapport d'import |
| 5. Contrôles | `checks.py` | `fulfulde.db` | Doublons, orphelins, comptage |
| 6. Livraison | copie | `fulfulde.db` → `app/assets/db/` | — |

`validated.csv` reste la source de vérité. La base est toujours régénérée, jamais éditée.

## 6 bis. Sécurité et confidentialité
- Aucune donnée ne quitte l'appareil ; aucune permission réseau n'est demandée.
- Requêtes SQL paramétrées.
- Pas de compte, pas de secret à stocker.

## 7. Décisions et alternatives écartées
| Décision | Alternative écartée | Raison |
|---|---|---|
| Pas de backend | FastAPI sur serveur | Contrainte hors ligne, délai de 10 jours |
| SQLite embarquée | JSON en mémoire | Requêtes, index et passage à l'échelle |
| Deux bases | Une seule base | Mises à jour du dictionnaire sans perdre les favoris |
| Administration par CSV | Écran admin dans l'app | Simplicité, sécurité, délai |
| Recherche à la soumission | Recherche à chaque frappe | Simplicité de la v1.0 |

## 8. Build et livraison
- Développement : Expo en mode dev sur appareil ou émulateur.
- Livrable : APK généré avec EAS Build, avec `fulfulde.db` dans les assets.
- Test de recette : installation de l'APK, mode avion, parcours complet.
