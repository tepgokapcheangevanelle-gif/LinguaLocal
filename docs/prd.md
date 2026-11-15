# prd.md — Product Requirements de LinguaLocal

## 1. Vision
Une application mobile, simple et hors ligne, qui permet de retrouver l'équivalent fulfulde d'un mot ou d'une expression française, avec la garantie que chaque résultat vient d'une source identifiée.

## 2. Utilisateurs
| Profil | Besoin principal |
|---|---|
| Francophone qui apprend le fulfulde | Trouver rapidement un mot et voir un exemple |
| Étudiant, enseignant | Consulter le dictionnaire avec sources et catégories |
| Locuteur curieux | Vérifier une forme, parcourir le vocabulaire |

Contexte d'usage : smartphone Android d'entrée de gamme, connexion souvent absente ou lente, utilisateurs non techniques.

## 3. Parcours principal
1. J'ouvre l'app et j'arrive sur le Traducteur (ou l'Accueil, accès en un tap).
2. Je tape « bonjour ».
3. Je vois la ou les traductions avec catégorie, exemple, source et badge de validation.
4. Je copie la traduction ou je l'ajoute aux favoris.
5. Si le mot n'existe pas, je lis un message clair, sans traduction inventée.

## 4. User stories

| ID | En tant que… | Je veux… | Afin de… | Priorité |
|---|---|---|---|---|
| US-01 | utilisateur | saisir un mot ou une expression et lancer la recherche | obtenir sa traduction | 1 |
| US-02 | utilisateur | que la recherche ignore casse et accents | ne pas me soucier de l'écriture exacte | 1 |
| US-03 | utilisateur | voir plusieurs traductions d'un même mot | choisir celle qui convient | 1 |
| US-04 | utilisateur | voir source et statut de validation | savoir si je peux me fier au résultat | 1 |
| US-05 | utilisateur | un message clair quand rien n'est trouvé | comprendre que le mot est absent de la base | 1 |
| US-06 | utilisateur | parcourir le dictionnaire et filtrer par recherche | découvrir du vocabulaire | 1 |
| US-07 | utilisateur | enregistrer des favoris | retrouver mes mots utiles | 2 |
| US-08 | utilisateur | revoir mes recherches récentes | relancer une recherche en un tap | 2 |
| US-09 | utilisateur | copier une traduction | l'utiliser ailleurs | 2 |
| US-10 | utilisateur | utiliser l'app sans internet | l'avoir partout | 1 |

## 5. Fonctionnalités et critères d'acceptation

**Recherche (US-01 à US-05)**
- Une requête vide ne lance rien et affiche une invite à saisir un mot.
- « Eau », « eau » et « EAU » donnent le même résultat ; « éte » trouve « été ».
- Les résultats exacts apparaissent avant les résultats proches.
- Chaque résultat affiche : terme français, équivalent fulfulde, catégorie, définition et exemple s'ils existent, variante, source, statut.
- Les traductions non vérifiées portent un badge « Non vérifié ».
- Sans correspondance : « Aucune correspondance dans le dictionnaire. Ce mot n'est pas encore documenté. »

**Dictionnaire (US-06)**
- Liste alphabétique des entrées, défilement fluide, barre de recherche.
- Tap sur une entrée : écran de détail avec toutes ses traductions.

**Favoris et historique (US-07 à US-08)**
- Favoris : ajout et retrait par un tap, liste dédiée, persistance après redémarrage.
- Historique : 50 recherches maximum, relance en un tap, possibilité de tout effacer.

**Copie (US-09)**
- Un tap copie « terme français : équivalent fulfulde » et affiche une confirmation brève.

## 6. Écrans
Accueil, Traducteur, Dictionnaire (liste + détail), Favoris, Historique. Détail visuel dans `ui-ux.md`.

## 7. Hors périmètre
Voir `scope.md` : pas de phrases inédites, pas de backend, pas d'audio, pas d'administration dans l'app, pas de recherche inverse.

## 8. Indicateurs de réussite (recette)
- Recherche courante en moins d'une seconde sur la base livrée.
- Fonctionne en mode avion.
- 100 % des résultats affichés ont une source et un statut (ou « source non renseignée » explicite).
- Aucun cas où une traduction apparaît sans correspondance en base.

## 9. Risques produit
| Risque | Réponse |
|---|---|
| Couverture limitée du vocabulaire | Message honnête en cas d'absence, accueil qui affiche le nombre d'entrées |
| Confusion avec un traducteur automatique | Texte d'accueil et du Traducteur qui précise « mots et expressions documentés » |
| Données incertaines | Badge de validation, relecture par un locuteur |
