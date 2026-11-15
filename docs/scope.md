# scope.md — Périmètre de LinguaLocal

## 1. Mission
Application mobile hors ligne qui recherche un mot ou une expression **française** dans un dictionnaire embarqué et affiche les équivalents **fulfulde** (variante de l'Extrême-Nord du Cameroun) avec leur source et leur statut de validation.

## 2. Règle fondatrice
**Aucune traduction inventée.** Résultat uniquement si la base contient une correspondance. Sinon : message « Aucune correspondance dans le dictionnaire ».

## 3. Inclus (v1.0)
- Recherche français → fulfulde : exacte et partielle, insensible à la casse et aux accents
- Expression complète prioritaire sur les mots isolés
- Plusieurs traductions par entrée, avec métadonnées (catégorie, définition, exemple, variante, source, statut)
- Badge visible « non vérifié » pour les traductions non validées
- Parcours du dictionnaire (liste + détail)
- Historique des recherches et favoris (locaux)
- Copie d'un résultat
- Fonctionnement 100 % hors ligne

## 4. Exclu
- Traduction de phrases inédites, traduction automatique, API distante
- Backend, comptes utilisateurs, synchronisation
- Audio, reconnaissance vocale, autres langues
- Recherche inverse fulfulde → français
- Administration dans l'application (le dictionnaire se gère hors de l'app via CSV)

## 5. Décisions techniques figées
| Sujet | Décision |
|---|---|
| Plateforme | Expo + React Native + TypeScript |
| Backend | Aucun |
| Données | SQLite embarquée (`expo-sqlite`) |
| Bases | `fulfulde.db` (lecture seule) + `user.db` (favoris, historique) |
| Source de vérité des données | `validated.csv` sur le PC |
| Préparation des données | Scripts Python hors application |
| Tests | Jest |

## 6. Priorités
1. Données propres et traçables (CSV validé → base)
2. Recherche fiable (normalisation identique Python / TypeScript)
3. Écrans : Traducteur, Dictionnaire
4. Favoris, historique, accueil
5. Finitions

## 7. Critères de réussite
- Fonctionne en mode avion
- Une recherche valide renvoie la bonne traduction avec source et statut
- Mot absent → message clair, rien d'inventé
- Favoris et historique persistent après redémarrage
- Les tests principaux passent

## 8. Contraintes
- 10 jours ouvrés
- Respect des licences des sources linguistiques
- Jeu de données réaliste : 300 à 1 000 entrées, qualité avant quantité

## 9. Hors décision de l'agent
L'agent de codage ne modifie pas ce périmètre. Tout ajout de fonctionnalité doit être validé par le responsable du projet.
