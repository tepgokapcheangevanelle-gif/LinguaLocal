# roadmap.md — Plan de développement (10 jours ouvrés)

## 1. Stratégie
Deux pistes avancent **en parallèle**, avec les agents de codage :

- **Piste Données (D)** : PDF → `fulfulde.db`. C'est le chemin critique.
- **Piste Application (A)** : app Expo qui lit la base. Elle démarre dès le jour 1 sur une **petite base de test** (30 entrées écrites à la main), puis reçoit la vraie base.

Le jour 3 est le point de jonction : la vraie `fulfulde.db` remplace la base de test.

## 2. Ce que l'on sait de la source
| Constat | Impact sur le plan |
|---|---|
| Dictionnaire de Tourneux et Yaya (1998), Diamaré, 550 pages | Source principale |
| Texte réel dans le PDF | Extraction directe, **pas d'OCR** |
| Sens peul → français ; index français-fulfulde absent de l'extrait | Étape d'**inversion** obligatoire |
| Dictionnaire thématique (agriculture, nature) | Couverture annoncée honnêtement ; suggestions de l'app = mots présents |
| Lettres spéciales mal codées (÷, é…) | Correction **par police** pendant l'extraction |
| Définitions parfois scientifiques ou très longues | Filtre : elles deviennent des définitions, pas des clés de recherche |

## 3. Pipeline de données

| Étape | Script | Sortie |
|---|---|---|
| 1. Extraction par police | `extract.py` | `raw_peul.csv` (une ligne par sens : mot peul, pluriel, catégorie, gloss français, exemple, page) |
| 2. Correction des lettres | `fix_chars.py` | `raw_peul_fixed.csv` |
| 3. Inversion | `invert.py` | `raw.csv` (français → fulfulde) |
| 4. Nettoyage | `clean.py` | `clean.csv` + rapport de rejets |
| 5. Validation | manuelle | `validated.csv` |
| 6. Import | `build_db.py` | `fulfulde.db` + `id_map.csv` |
| 7. Contrôles | `checks.py` | Rapport de cohérence |

Toutes les lignes sortent de l'extraction avec `validation_status = unverified`. Seules les lignes relues par un locuteur ou recoupées avec une autre source passent à `verified`.

## 4. Planning

| Jour | Piste D (données) | Piste A (application) | Livrable de la journée |
|---|---|---|---|
| **1** | Prototype d'extraction sur ~20 pages ; confirmation visuelle des correspondances de lettres ; mesure du taux d'erreur | Dépôt, projet Expo, navigation par onglets, thème, `seed_test.db` (30 entrées) | Prototype validé ou plan B décidé ; app qui s'ouvre |
| **2** | Extraction des 550 pages ; `invert.py` ; premières statistiques (nombre d'entrées, rejets) | `normalize.ts` + tests ; `initDatabases` ; copie de la base des assets | `raw.csv` complet ; normalisation testée |
| **3** | Nettoyage ; `validated.csv` v0 ; `build_db.py` ; `checks.py` ; **vraie `fulfulde.db`** | `searchEntries`, `listEntries`, `getEntry`, `countEntries` ; Jest | **Jonction** : l'app cherche dans la vraie base |
| **4** | Parité Python / Jest (`normalization_cases.json`) ; correction des erreurs fréquentes repérées | Écran Traducteur : saisie, cartes de résultats, badges, états vides | Parcours de recherche complet |
| **5** | Échantillon de 100 entrées préparé pour relecture par un locuteur | Écran Dictionnaire (liste, filtre, détail) ; en-tête d'accueil | Consultation du dictionnaire |
| **6** | Relecture de l'échantillon par un locuteur ; mise à jour des statuts | Favoris et historique (`user.db`) | Fonctions secondaires terminées |
| **7** | Régénération de la base avec les corrections ; contrôles | Finitions interface, copie, polices, test des lettres ɓ ɗ ŋ ƴ sur un vrai téléphone | Version fonctionnelle |
| **8** | Complément de données si temps (petite liste de mots courants saisie à la main, source notée) | Tests Jest complets, cas limites, performance | Tests verts |
| **9** | Gel de `fulfulde.db` ; version du dictionnaire fixée | Build APK (EAS) ; recette en mode avion ; corrections | Version candidate |
| **10** | Documentation de la source, des licences et des limites | Guide d'installation ; rapport de tests ; support de démonstration | Livrables et soutenance prêts |

## 5. Points de contrôle (« go / no-go »)

| Quand | Question | Si non |
|---|---|---|
| Fin du jour 1 | L'extraction du prototype est-elle exploitable (peu d'erreurs, lettres corrigées) ? | Réduire l'ambition : extraire seulement les entrées simples ; compléter par saisie manuelle d'une liste de mots courants |
| Fin du jour 3 | La base contient-elle assez d'entrées valides pour une démonstration ? | Priorité absolue à la qualité du sous-ensemble ; limiter la v1.0 à un thème (par ex. cultures, animaux, cuisine) |
| Fin du jour 7 | L'app est-elle complète sur le parcours principal ? | Couper favoris/historique avant de toucher à la recherche |
| Fin du jour 9 | L'APK fonctionne-t-il en mode avion ? | Corriger avant tout nouveau développement |

## 6. Ordre de coupe (si le temps manque)
1. Mode sombre
2. Relance depuis l'historique
3. Historique
4. Favoris
5. Écran de détail enrichi

Ne jamais couper : recherche, résultats avec source et statut, message d'absence honnête, fonctionnement hors ligne, tests.

## 7. Plan B pour les données
Si l'extraction automatique ne donne pas une qualité suffisante :
1. Extraire uniquement les entrées qui respectent le format standard (mot, catégorie, puce, gloss court).
2. Compléter à la main un fichier `manual.csv` de 100 à 300 mots courants, chacun avec sa source.
3. Annoncer clairement le périmètre dans l'application et dans le rapport.

## 8. Répartition du travail avec les agents

| Agent / tâche | Documents à lui donner |
|---|---|
| Agent Données | `scope.md`, `database-schema.md`, `AGENTS.md`, ce `roadmap.md` §2 à §3 |
| Agent Application | `scope.md`, `prd.md`, `spec.md`, `architecture.md`, `api-contract.md`, `ui-ux.md`, `AGENTS.md` |
| Agent Tests | `spec.md` §9, `api-contract.md`, `database-schema.md` §3 |

L'humain garde : le choix des mots validés, la relecture linguistique, les arbitrages de périmètre et la recette finale.

## 9. Définition de « terminé » (par fonctionnalité)
- Le code est dans le bon module, sans SQL dans les écrans.
- Les tests concernés passent.
- Le comportement correspond à `spec.md`.
- Aucune traduction ne s'affiche sans correspondance en base.
- Testé hors ligne.
