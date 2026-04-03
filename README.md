# AceFloor Configurator

Configurateur premium de tuiles modulaires AceFloor, structuré comme une application web dédiée intégrée à Shopify.

## Structure

- `apps/web`: interface Next.js
- `packages/core-engine`: moteur de calcul et types partagés
- `acefloor-configurator-blueprint.md`: conception détaillée

## Prérequis

- Node.js LTS installé localement
- npm disponible dans le terminal

## Démarrage

```bash
npm install
npm run dev
```

Ensuite ouvrir :

```text
http://localhost:3000
```

## Ce qui est en place

- app shell Next.js
- store configurateur
- catalogue mock Crown Series
- moteur rectangle simple dans `packages/core-engine`
- résumé quantités / prix estimatif

## Ce qu'il faut brancher ensuite

- vraies dimensions produits
- vraies règles de bordures
- vrai mapping Shopify SKU/variant
- sauvegarde projet
- éditeur polygonal
- preview 3D

## Déploiement recommandé

Le meilleur montage pour AceFloor est :

- `acefloor.ca` reste sur Shopify
- `www.acefloor.ca` reste sur Shopify
- le calculateur est déployé sur un sous-domaine dédié, par exemple `app.acefloor.ca`

### Stack de lancement recommandée

- hébergement du calculateur : `Vercel`
- domaine : `GoDaddy`
- boutique : `Shopify`

### Variables d'environnement utiles

Créer `apps/web/.env.local` en partant de `apps/web/.env.example`.

La variable la plus importante en production :

```bash
NEXT_PUBLIC_SITE_URL=https://app.acefloor.ca
```

### Réglage Vercel

1. Importer le repo sur Vercel
2. Créer un projet pour le dossier `apps/web`
3. Laisser Vercel détecter `Next.js`
4. Définir `NEXT_PUBLIC_SITE_URL=https://app.acefloor.ca`
5. Ajouter le domaine `app.acefloor.ca` dans `Project Settings > Domains`

### Réglage GoDaddy

Ne pas modifier `@` ni `www` si Shopify fonctionne déjà.

Ajouter uniquement un nouveau record pour l'app :

- type : `CNAME`
- name : `app`
- value : la cible donnée par Vercel
- ttl : défaut `1 hour`

Guide détaillé : [DEPLOYMENT-GODADDY-VERCEL.md](/Users/jakeallimann/Documents/New%20project%202/DEPLOYMENT-GODADDY-VERCEL.md)
