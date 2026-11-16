# LinguaLocal

Application mobile **hors ligne** de recherche et de traduction lexicale du **français vers le fulfulde** (variante du Diamaré, Extrême-Nord du Cameroun).

> Projet académique (travail pratique), durée prévue : 10 jours ouvrés.
> **Statut : conception terminée (cahier des charges v1.1), application Expo initialisée sur une base de test de 30 entrées.**

## Objectif

Faciliter l'accès au fulfulde et contribuer à la préservation de la langue, malgré la rareté des ressources numériques, avec un outil qui fonctionne **sans connexion Internet**.

## Principe fondateur

**Aucune traduction inventée.** Chaque résultat provient d'un dictionnaire numérique, avec sa source et son statut de validation (« vérifié » ou « non vérifié »). Si un mot est absent, l'application le dit clairement.

## Fonctionnalités (MVP)

- Recherche d'un mot ou d'une expression française et affichage des équivalents fulfulde
- Recherche exacte et partielle, insensible aux majuscules et aux accents
- Plusieurs traductions par entrée, avec catégorie, définition, exemple, source et statut
- Message clair quand un mot est absent du dictionnaire
- Consultation du dictionnaire
- Favoris et historique des recherches (stockés sur l'appareil)
- Fonctionnement 100 % hors ligne

**Hors périmètre de la v1.0** : traduction de phrases libres, traduction automatique, audio, comptes utilisateurs, autres langues.

## Données

La source principale est le *Dictionnaire peul de l'agriculture et de la nature (Diamaré, Cameroun)* de Henry Tourneux et Yaya Daïrou (Karthala / CTA / CIRAD, 1998).

- L'ouvrage est organisé du peul vers le français : les paires sont **inversées** pour permettre la recherche du français vers le fulfulde.
- C'est un dictionnaire **thématique** (agriculture, nature, cuisine, faune, flore) : il ne couvre pas tout le vocabulaire courant (par exemple les salutations). L'application annonce ce périmètre à l'utilisateur.
- Les traductions extraites sont marquées « non vérifiées » tant qu'un locuteur ne les a pas relues.
- Les droits d'utilisation de la source et ses limites sont documentés dans le rapport du projet.

### Chaîne de préparation (hors application, scripts Python)

```
PDF → extraction (par police) → correction des lettres spéciales → inversion
    → nettoyage → validation (validated.csv) → import → fulfulde.db
```

`validated.csv` est la source de vérité : on corrige le CSV et on régénère la base, jamais l'inverse.

## Technologies

| Couche | Choix |
|---|---|
| Application | Expo + React Native + TypeScript |
| Données embarquées | SQLite (`expo-sqlite`) : `fulfulde.db` (dictionnaire, lecture seule) et `user.db` (favoris, historique) |
| Préparation des données | Python (pdfplumber / PyMuPDF, pandas) |
| Tests | Jest (application), pytest (scripts de données) |
| Livraison | APK généré avec EAS Build |

**Pas de backend** : la logique de recherche est dans l'application, la base est embarquée.

## Documentation

Les documents de référence sont dans `docs/` :

| Document | Contenu |
|---|---|
| `lingualocal_cahier_des_charges.pdf` | Cahier des charges v1.1 (mobile, sans backend) |
| `scope.md` | Périmètre du projet |
| `prd.md` | Besoins utilisateurs et fonctionnalités |
| `spec.md` | Comportements techniques attendus |
| `architecture.md` | Architecture et structure du dépôt |
| `database-schema.md` | Schéma des bases SQLite et pipeline CSV vers base |
| `ui-ux.md` | Écrans et identité visuelle |
| `api-contract.md` | Contrat des services internes |
| `roadmap.md` | Plan sur 10 jours |

Les instructions destinées aux agents de codage sont dans [`AGENTS.md`](AGENTS.md), à la racine.

## Structure du dépôt

```
LinguaLocal/
├─ AGENTS.md           instructions pour les agents de codage
├─ docs/               documents de référence
├─ data-pipeline/      scripts Python et données (PDF → fulfulde.db)
│  ├─ source/          Dictionnaire_Peul.pdf
│  ├─ data/            raw_peul_sample.csv, inverted_sample.csv
│  ├─ extract_proto.py prototype d'extraction (jour 1)
│  ├─ normalize.py     normalisation Python de référence
│  └─ build_seed_db.py base de test de 30 entrées
├─ shared/             cas de test communs (normalisation)
└─ app/                application Expo
   ├─ app/             écrans Expo Router (onglets)
   ├─ src/             db, services, lib, composants, thème
   └─ assets/db/       seed_test.db
```

## Démarrage rapide

```bash
cd app
npm install
npx expo start
```

La base embarquée au premier lancement est `app/assets/db/seed_test.db` (30 entrées
réellement extraites du dictionnaire, statut « non vérifié »). Pour la régénérer :

```bash
cd data-pipeline
python build_seed_db.py
```

## Équipe et rôles

- Tepgo Kapche Ange Yanelle : chef de projet / coordination
- Fowa Njami Michelle Rosee : données et lexique
- Fadimatou Saidou : back-end / API
- Kpoumie Njoya Ismaila Ramadan : front-end
- Koulsoumi Sadou : NLP / moteur de traduction

## Organisation Git

- Pas de travail direct sur la branche `main`
- Une branche par rôle (`feature/...`)
- Pull request et relecture avant fusion

## Licence

Code : MIT.
Les données linguistiques restent soumises aux droits et licences de leurs sources respectives.
