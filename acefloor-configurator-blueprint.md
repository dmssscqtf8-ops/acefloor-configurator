# AceFloor Configurator Blueprint

## 1. Objectif

Construire un configurateur premium de tuiles modulaires AceFloor, supérieur à l'outil Swisstrax sur trois axes :

- rendu visuel plus haut de gamme
- moteur de configuration plus cohérent et plus extensible
- intégration commerciale plus forte avec Shopify, devis et sauvegarde de projets

Le produit final ne doit pas être une simple section Shopify. Shopify reste la vitrine et le checkout. Le configurateur doit être une application web dédiée intégrée au site.

## 2. Positionnement Produit

Le logiciel doit permettre à un client de :

- dessiner sa pièce ou choisir un gabarit
- définir dimensions, obstacles, portes et zones non couvertes
- choisir un type de tuile, une couleur, un motif, une bordure
- prévisualiser le résultat en 2D puis en 3D
- obtenir les quantités, les pertes, les bordures et le prix
- sauvegarder son projet
- l'envoyer pour soumission ou l'ajouter à un panier Shopify

## 3. Portée V1

La V1 doit inclure :

- éditeur 2D de pièce
- bibliothèque produits AceFloor
- moteur de pose par grille
- motifs de base
- calcul de quantités
- calcul de bordures
- prix estimé
- sauvegarde d'un projet
- partage d'un projet par lien
- export image du design
- intégration Shopify pour devis ou panier

La V1 ne doit pas inclure :

- scan photo AR
- génération IA du plan
- moteur 3D photoréaliste avancé
- optimisation automatique de pose multi-zones

## 4. Portée V2

- preview 3D synchronisée
- presets showroom / garage / atelier
- comparaison de plusieurs palettes
- mode expert pour motifs avancés
- espace partenaire / installateur
- génération PDF client brandé AceFloor

## 5. Architecture Recommandée

### Frontend

- `Next.js`
- `React`
- `TypeScript`
- `Zustand` pour l'état global
- `Konva` pour l'éditeur 2D
- `react-three-fiber` + `Three.js` pour la preview 3D
- `Tailwind CSS` ou CSS modules selon préférence de design system

### Backend

- `Next.js API routes` ou `tRPC`
- `PostgreSQL`
- `Prisma`
- `Redis` optionnel pour cache de sessions/projets

### Infra

- frontend sur `Vercel`
- base sur `Neon` ou `Supabase Postgres`
- stockage images/projets sur `S3` ou `Cloudflare R2`
- CDN pour assets et textures

### Shopify

- Shopify pour catalogues, variants, prix, checkout
- Storefront API ou Admin sync interne pour mapper les produits du configurateur aux vrais SKU

## 6. Découpage Applicatif

### 6.1 App Shell

Responsable de :

- navigation entre étapes
- reprise de projet
- gestion de session
- responsive desktop/mobile

Étapes :

1. choisir un espace
2. dessiner ou entrer les dimensions
3. choisir la gamme
4. choisir couleurs et motif
5. voir le calcul
6. sauvegarder / partager / demander une soumission

### 6.2 Room Editor

Responsable de :

- pièce rectangulaire
- pièce en L
- pièce polygonale simple
- ajout de colonnes/obstacles
- ajout de portes et ouvertures
- zones exclues

Entrées :

- largeur
- longueur
- unités
- obstacles

Sorties :

- contour normalisé
- surface utile
- grille de pose

### 6.3 Tile Engine

Responsable de :

- placer la grille de tuiles
- gérer orientation et rotation
- générer motifs
- déterminer les tuiles pleines et partielles
- calculer la logique de bordure

Patterns minimum :

- uni
- damier 2 couleurs
- bandes
- bordure périmétrique
- zone centrale + contour

### 6.4 Product Engine

Responsable de :

- définir les familles de produits
- gérer compatibilités par type de tuile
- gérer couleurs disponibles
- gérer attributs visuels et techniques
- relier les choix UI aux SKU Shopify

### 6.5 Pricing Engine

Responsable de :

- prix unitaire
- prix par boîte
- pertes
- minimums de commande
- bordures / coins / accessoires
- estimation finale

### 6.6 3D Preview Engine

Responsable de :

- reconstruire la pièce en 3D à partir du même état source
- afficher la surface configurée
- afficher caméra orbitale limitée
- matériaux sobres et premium

Le moteur 3D doit lire exactement le même modèle de projet que le moteur 2D.

### 6.7 Project System

Responsable de :

- sauvegarde
- duplication
- lien partageable
- export image
- export PDF en V2

### 6.8 Quote / Cart Integration

Responsable de :

- transformer un projet en ligne de devis
- créer une configuration prête pour le panier Shopify
- pousser le projet dans un CRM ou email commercial

## 7. Modèle de Données

### Project

```ts
type Project = {
  id: string
  name: string
  customerId?: string
  room: Room
  layout: LayoutConfig
  selectedProducts: SelectedProducts
  calculations: CalculationSnapshot
  preview: PreviewSnapshot
  status: "draft" | "quoted" | "submitted"
  createdAt: string
  updatedAt: string
}
```

### Room

```ts
type Room = {
  unit: "in" | "ft" | "cm" | "m"
  polygon: Point[]
  obstacles: Obstacle[]
  excludedZones: Zone[]
  doors: Door[]
}
```

### LayoutConfig

```ts
type LayoutConfig = {
  tileFamilyId: string
  tileModelId: string
  primaryColorId: string
  secondaryColorId?: string
  accentColorId?: string
  pattern: "solid" | "checker" | "stripe" | "border" | "custom"
  rotation: 0 | 90 | 180 | 270
  border?: BorderConfig
}
```

### CalculationSnapshot

```ts
type CalculationSnapshot = {
  areaSqFt: number
  tileCountFull: number
  tileCountCut: number
  wastePercent: number
  borderCount: number
  cornerCount: number
  boxesRequired: number
  subtotal: number
  accessoriesSubtotal: number
  total: number
}
```

## 8. Base de Données

Tables recommandées :

- `users`
- `projects`
- `project_snapshots`
- `product_families`
- `products`
- `product_variants`
- `tile_colors`
- `tile_rules`
- `quote_requests`
- `project_share_links`

## 9. Mapping Shopify

Chaque variante du configurateur doit pointer vers un vrai SKU Shopify.

Exemple :

```ts
type ProductVariantMap = {
  localVariantId: string
  shopifyProductId: string
  shopifyVariantId: string
  sku: string
  price: number
  boxCoverageSqFt?: number
}
```

Règle :

- le configurateur ne doit pas dépendre du thème Shopify
- le thème appelle l'app
- l'app parle aux données Shopify

## 10. API

Endpoints minimum :

- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `POST /api/projects/:id/calculate`
- `POST /api/projects/:id/export-image`
- `POST /api/projects/:id/share`
- `POST /api/projects/:id/quote`
- `GET /api/catalog`
- `GET /api/catalog/tiles`

## 11. Moteur de Calcul

Le calcul doit être déterministe.

Ordre recommandé :

1. normaliser les unités
2. normaliser le contour de pièce
3. générer une grille logique
4. appliquer le motif
5. marquer tuiles pleines / partielles
6. calculer pertes
7. calculer bordures et coins
8. calculer boîtes
9. calculer prix

La logique métier ne doit pas vivre dans les composants React.

Créer un module isolé :

- `packages/core-engine`

Avec :

- géométrie
- motifs
- quantités
- pricing
- transformations 2D/3D

## 12. UI/UX

Le configurateur doit suivre un modèle showroom haut de gamme :

- fond sobre
- surfaces nettes
- peu d'effets inutiles
- transitions courtes
- contrôle fort des couleurs
- densité d'information maîtrisée

Écran principal recommandé :

- colonne gauche : outils et paramètres
- centre : canvas 2D
- droite : résumé / prix / palette
- toggle haut : `2D` / `3D`

## 13. Structure de Code

```text
apps/
  web/
    app/
    components/
    features/
      configurator/
        components/
        hooks/
        store/
        utils/
      pricing/
      projects/
      catalog/
    lib/
    styles/

packages/
  core-engine/
    geometry/
    layout/
    pricing/
    exports/
    types/

  shopify-sync/
    mappings/
    catalog/
```

## 14. Ordre de Développement

### Sprint 1

- setup app
- modèle de données
- room editor rectangle
- catalogue mock

### Sprint 2

- moteur de grille
- motifs simples
- calcul quantités
- résumé de prix mock

### Sprint 3

- obstacles
- bordures
- sauvegarde projet
- partage par lien

### Sprint 4

- intégration Shopify
- export image
- flow demande de soumission

### Sprint 5

- preview 3D
- polish UI
- QA mobile

## 15. Risques

- vouloir faire la 3D avant d'avoir un moteur 2D fiable
- mélanger logique de pricing et UI
- dépendre des sections Shopify pour un produit applicatif
- sous-estimer la complexité des bordures et découpes
- ne pas formaliser les règles par gamme dès le départ

## 16. Décisions Techniques

Décisions à prendre tôt :

- quelles formes de pièce sont autorisées en V1
- quels motifs sont supportés en V1
- comment traiter les tuiles partielles
- comment relier les composants accessoires aux calculs
- si le panier Shopify accepte un simple SKU résumé ou un bundle détaillé

## 17. Recommandation Finale

Construire le logiciel comme :

- une application `Next.js`
- avec un moteur de calcul TypeScript isolé
- intégrée à Shopify mais indépendante du thème

La meilleure première livraison n'est pas la 3D. C'est :

- un très bon éditeur 2D
- des calculs exacts
- une sortie commerciale exploitable

Une fois ce noyau stable, la 3D devient un multiplicateur de valeur au lieu d'un risque.
