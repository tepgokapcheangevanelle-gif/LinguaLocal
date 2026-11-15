# ui-ux.md — Écrans et identité visuelle de LinguaLocal

## 1. Principes
1. **Un geste, un résultat** : la recherche est visible dès l'ouverture.
2. **Honnêteté visible** : chaque résultat montre sa source et son statut ; l'absence de résultat est dite clairement.
3. **Lisible partout** : gros textes, forts contrastes, utilisable à une main et en plein soleil.
4. **Léger** : peu d'écrans, peu d'animations, bon fonctionnement sur un téléphone d'entrée de gamme.

## 2. Identité visuelle (proposition sobre, modifiable)

| Élément | Choix |
|---|---|
| Ambiance | Chaleureuse et terreuse, évoque le Sahel, sans folklore |
| Couleur principale | Terre ocre `#B4571F` (actions, accents) |
| Fond | Sable très clair `#FBF6EE` ; mode sombre : `#1C1815` |
| Texte | Brun très foncé `#2B2118` ; secondaire `#6B5D50` |
| Vérifié | Vert `#2E7D32` avec icône ✓ |
| Non vérifié | Ambre `#B26A00` avec icône ⓘ |
| Erreur | Rouge brique `#B3261E` |
| Typographie | **Noto Sans** (ou Charis SIL) embarquée : elle affiche correctement ɓ, ɗ, ŋ, ƴ |
| Tailles | Corps 16 pt, résultat fulfulde 22 pt en gras, titres 20 à 24 pt |
| Coins, ombres | Coins arrondis 12 px, ombres très légères |

Les couleurs sont des variables dans `src/theme/`, donc faciles à changer. Le contraste texte/fond doit respecter au moins 4,5:1 ; le statut ne repose jamais sur la couleur seule (icône + texte).

## 3. Navigation
Barre d'onglets en bas, 4 entrées :

| Onglet | Icône | Écran |
|---|---|---|
| Traduire | loupe | Traducteur (écran d'ouverture) |
| Dictionnaire | livre | Liste des entrées |
| Favoris | cœur | Favoris |
| Historique | horloge | Recherches récentes |

L'**Accueil** est un en-tête rétractable au-dessus du Traducteur (nom, phrase d'explication, nombre d'entrées), pas un onglet séparé. Cela économise un écran et un tap.

## 4. Écrans

### 4.1 Traducteur
```
┌────────────────────────────┐
│ LinguaLocal                │
│ Mots et expressions du     │
│ vocabulaire documenté      │
│ 8 432 entrées              │
├────────────────────────────┤
│ [ Saisir un mot français ] │ ← champ + bouton « Chercher »
├────────────────────────────┤
│ CORRESPONDANCE EXACTE      │
│ ┌────────────────────────┐ │
│ │ poisson     nom   ♡ ⧉  │ │
│ │ liingu                 │ │ ← fulfulde, gros
│ │ ✓ Vérifié · Tourneux & │ │
│ │ Yaya 1998 · Diamaré    │ │
│ │ Exemple : …            │ │
│ └────────────────────────┘ │
│ RÉSULTATS PROCHES          │
│ …                          │
└────────────────────────────┘
```
- Bouton ♡ : favori. Bouton ⧉ : copier.
- Plusieurs traductions : empilées dans la même carte, chacune avec son badge.
- Groupe « Mots de votre saisie » (si phrase non trouvée) avec la mention : « Ces mots sont traduits séparément. Ce n'est pas une traduction de la phrase. »

### 4.2 États du Traducteur
| État | Affichage |
|---|---|
| Initial | Champ vide, suggestion : « Essayez : poisson, coton, sorgho » (mots réellement présents dans la base) |
| Chargement | Indicateur discret (la recherche est quasi instantanée) |
| Requête vide | Message sous le champ : « Saisissez un mot à rechercher. » |
| Aucun résultat | Carte neutre : « Aucune correspondance dans le dictionnaire. Ce mot n'est pas encore documenté. » + rappel du thème du dictionnaire |
| Erreur base | « Dictionnaire indisponible » + bouton « Réessayer » |

### 4.3 Dictionnaire
- Barre de recherche en haut, liste alphabétique, défilement avec pagination.
- Chaque ligne : terme français, premier équivalent, badge de statut en petit.
- Tap : écran **Détail d'une entrée** (terme, catégorie, définition, toutes les traductions avec source, exemple, note, boutons favori et copie).

### 4.4 Favoris
- Liste de cartes, bouton pour retirer.
- Vide : « Aucun favori. Touchez ♡ sur un résultat pour l'ajouter. »

### 4.5 Historique
- Liste des recherches récentes ; tap = relance dans le Traducteur.
- Bouton « Tout effacer » avec confirmation.
- Vide : « Aucune recherche récente. »

## 5. Composants réutilisables
`SearchBar`, `ResultCard`, `TranslationBlock`, `ValidationBadge`, `EmptyState`, `ErrorState`, `FavoriteButton`, `CopyButton`, `SectionHeader`.

## 6. Textes de l'interface (français)
| Contexte | Texte |
|---|---|
| Placeholder | « Saisir un mot ou une expression en français » |
| Badge vérifié | « Vérifié » |
| Badge non vérifié | « Non vérifié » |
| Source absente | « Source non renseignée » |
| Copie réussie | « Copié » |
| Note de périmètre | « Ce dictionnaire couvre surtout l'agriculture et la nature (Diamaré). Il ne traduit pas des phrases libres. » |

## 7. Accessibilité et robustesse
- Zones tactiles d'au moins 44 × 44 px.
- Étiquettes d'accessibilité sur les icônes (favori, copier).
- Taille de texte du système respectée.
- **Test d'affichage obligatoire** des lettres ɓ, ɗ, ŋ, ƴ sur un vrai téléphone.
- Clavier : le champ de recherche valide avec la touche « Rechercher » du clavier.
- Mode sombre prévu dans le thème, finition secondaire.

## 8. Hors périmètre visuel
Pas d'animations complexes, pas d'illustrations lourdes, pas de personnalisation par l'utilisateur.
