# AGENTS.md — Instructions pour les agents de codage

## 1. Le projet en 3 lignes
**LinguaLocal** est une application mobile **100 % hors ligne** (Expo + React Native + TypeScript) qui cherche un mot ou une expression **française** dans un dictionnaire SQLite embarqué et affiche les équivalents **fulfulde** (Diamaré, Extrême-Nord du Cameroun), avec source et statut de validation.
Pas de backend. Le dictionnaire est préparé hors de l'app par des scripts Python à partir du PDF `Dictionnaire_Peul.pdf` (Tourneux et Yaya, 1998).

## 2. À lire avant d'agir (dans cet ordre)
1. `docs/scope.md` : ce qui est inclus et exclu
2. `docs/prd.md` : besoins utilisateurs
3. `docs/spec.md` : comportements exacts (recherche, favoris, historique)
4. `docs/architecture.md` : structure du dépôt, couches
5. `docs/database-schema.md` : bases, normalisation, mapping CSV
6. `docs/api-contract.md` : fonctions et types à respecter
7. `docs/ui-ux.md` : écrans, couleurs, textes
8. `docs/roadmap.md` : plan, priorités, plan B

Si deux documents se contredisent, l'ordre ci-dessus fait foi (le plus haut l'emporte). Signale la contradiction à l'humain.

## 3. Règles non négociables
1. **Jamais de traduction inventée.** Tout texte fulfulde affiché vient de `fulfulde.db`. Aucun texte généré, complété ni deviné, ni dans le code, ni dans les données, ni dans les tests (sauf données de test clairement marquées).
2. **`validated.csv` est la source de vérité.** On ne modifie jamais `fulfulde.db` à la main ; on corrige le CSV et on régénère.
3. **`fulfulde.db` est en lecture seule** dans l'application. Favoris et historique vont dans `user.db`.
4. **UTF-8 partout.** Les lettres ɓ ɗ ŋ ƴ ne doivent jamais être altérées, ni dans les fichiers, ni dans les bases, ni à l'affichage.
5. **Une seule fonction de normalisation** par langage (`normalize.py`, `normalize.ts`), vérifiées par `shared/normalization_cases.json`.
6. **Pas de backend, pas d'appel réseau.** N'ajoute aucune dépendance qui en demande.
7. **Pas de SQL dans les écrans.** Les requêtes sont dans `src/services/` uniquement, avec des paramètres liés.
8. **Chaque traduction a sa source et son statut** ; une traduction non vérifiée porte un badge « Non vérifié ».
9. **Ne change pas le périmètre.** Pas de nouvelle fonctionnalité sans validation humaine.

## 4. Règles pour la piste Données (Python)
- Pas d'OCR : le PDF contient du texte réel. Utilise `pdfplumber` (ou PyMuPDF) pour lire les caractères **avec leur police**.
- **Lettres spéciales** : dans les polices Doulos (`BandaWinSILDoulosL…`, `SahelWinSILDoulosL…`), certains caractères sont des substituts (par ex. `÷`, `é`, `»`). Corrige uniquement les caractères issus de ces polices ; le français en Times New Roman reste inchangé. La table de correspondance est confirmée visuellement sur des pages échantillons avant d'être figée dans `fix_chars.py`.
- **Structure d'une entrée** : mot peul / pluriel (classes), catégorie → puce `•` + équivalent français → exemple peul puis traduction → notes. Les sous-entrées sont marquées par un symbole (`Ö` après extraction).
- **Inversion** : les équivalents français deviennent les termes de recherche. Filtre : noms scientifiques (latin, parenthèses de famille) et définitions longues ne deviennent pas des clés ; ils vont en `definition`.
- Les champs absents restent vides. Ne complète jamais par supposition.
- Chaque ligne exportée garde : page source, `source_reference`, `validation_status = unverified` par défaut.
- Chaque script produit un **rapport** (lignes lues, rejetées et pourquoi, comptage final). Pas de rejet silencieux.
- Les scripts sont rejouables de bout en bout (même entrée = même sortie, mêmes `translation_id` via `id_map.csv`).

## 5. Règles pour la piste Application (Expo / TypeScript)
- TypeScript strict. Types uniquement ceux de `api-contract.md`.
- Pile : Expo, Expo Router, `expo-sqlite`, `expo-asset`, `expo-file-system`, `expo-clipboard`. Pas d'ORM ni de gestion d'état globale pour la v1.0.
- Couches : écrans → hooks → services → db. Les écrans ne touchent pas à SQLite.
- Interface : suivre `ui-ux.md` (couleurs, textes, états vides). Police embarquée qui supporte ɓ ɗ ŋ ƴ.
- Recherche à la soumission, pas à chaque frappe.
- Ne bloque jamais l'interface : listes paginées (`FlatList`), pas de calcul lourd sur le thread principal.

## 6. Tests
- **Jest** pour l'application ; **pytest** pour les scripts de données.
- Cas obligatoires : `spec.md` §9.
- Les tests de normalisation Python et TypeScript lisent le même fichier `shared/normalization_cases.json`.
- Avant de déclarer une tâche terminée : lancer les tests concernés et les faire passer.

## 7. Conventions
- Noms de code en anglais, textes d'interface en français.
- Petits commits, un sujet par commit, message à l'impératif (`add search service`).
- Fichiers courts et modulaires ; pas de duplication de la logique de normalisation.
- Commentaires utiles là où la logique linguistique n'est pas évidente (règles d'extraction, normalisation).

## 8. Quand demander à l'humain
Demande avant d'agir si :
- une règle de ce fichier ou un document semble impossible à respecter ;
- une correspondance de lettres est incertaine ;
- une décision linguistique est nécessaire (variante, orthographe, sens) ;
- un changement de périmètre, de pile ou de schéma de base est envisagé ;
- les données extraites semblent douteuses (taux d'erreur élevé à l'échantillon).

Ne devine pas. Signale l'incertitude et propose des options.

## 9. Ce que tu ne fais jamais
- Inventer ou « corriger » des mots fulfulde de mémoire.
- Importer des données externes sans source ni licence notées.
- Supprimer ou réécrire `validated.csv` sans sauvegarde.
- Ajouter une connexion réseau, un compte, un suivi ou de la télémétrie.
- Modifier ces règles.

## 10. Définition de « terminé »
Fonctionnalité conforme à `spec.md`, testée, fonctionnant en mode avion, sans traduction affichée hors base, et mentionnée dans le rapport de tests.
