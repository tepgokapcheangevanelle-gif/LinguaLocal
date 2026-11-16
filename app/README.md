# LinguaLocal — application Expo

Application mobile hors ligne (Expo Router, TypeScript, `expo-sqlite`).
Les documents de référence sont à la racine : `docs/` et `AGENTS.md`.

## Lancement

```bash
npm install
npx expo start
```

Puis ouvrir sur un appareil Android (Expo Go) ou un émulateur.

## Structure

- `app/` : écrans Expo Router (onglets Traduire, Dictionnaire, Favoris, Historique).
- `src/db/` : ouverture des bases, copie de la base embarquée, `user.db`.
- `src/services/` : recherches et lectures SQL (seul endroit qui parle à SQLite).
- `src/lib/normalize.ts` : normalisation partagée avec `data-pipeline/normalize.py`.
- `src/components/`, `src/theme/` : composants et identité visuelle.
- `assets/db/seed_test.db` : base de test (30 entrées extraites, non vérifiées).

## Base de test

`assets/db/seed_test.db` est générée depuis les paires réellement extraites :

```bash
cd ../data-pipeline
python build_seed_db.py
```

Au premier lancement, l'application la copie dans `documentDirectory/SQLite/fulfulde.db`.
