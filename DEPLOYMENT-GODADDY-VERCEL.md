# Déploiement du calculateur AceFloor

Objectif :

- `acefloor.ca` continue de servir la boutique Shopify
- `app.acefloor.ca` sert le calculateur AceFloor

Ce montage évite de casser Shopify tout en gardant la marque sur le même domaine principal.

## 1. Architecture à garder

- boutique Shopify : `acefloor.ca`
- boutique Shopify : `www.acefloor.ca`
- calculateur : `app.acefloor.ca`

Ne remplace pas `acefloor.ca` par l'application. Utilise un sous-domaine séparé.

## 2. Préparer le projet

À la racine du repo :

```bash
npm install
npm run dev
```

Créer ensuite le fichier `apps/web/.env.local` :

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Pour la production, la valeur deviendra :

```bash
NEXT_PUBLIC_SITE_URL=https://app.acefloor.ca
```

## 3. Déployer sur Vercel

### Option recommandée

1. Ouvre [Vercel](https://vercel.com/)
2. Clique sur `Add New...` puis `Project`
3. Importe ce repo
4. Lors de la création du projet, choisis le dossier `apps/web`
5. Vérifie que le framework détecté est `Next.js`
6. Ajoute la variable d'environnement suivante :

```bash
NEXT_PUBLIC_SITE_URL=https://app.acefloor.ca
```

7. Lance le premier déploiement

Après ce déploiement, Vercel te donnera une URL de test en `.vercel.app`.

## 4. Ajouter le domaine dans Vercel

Dans le projet Vercel :

1. `Settings`
2. `Domains`
3. `Add Domain`
4. Entre `app.acefloor.ca`

Vercel va ensuite t'indiquer le record DNS exact à créer chez GoDaddy.

Dans la plupart des cas pour un sous-domaine, ce sera un `CNAME`.

## 5. Ajouter le DNS dans GoDaddy

Dans GoDaddy :

1. Connecte-toi
2. Ouvre ton domaine `acefloor.ca`
3. Va dans `DNS`
4. Clique sur `Add New Record`
5. Choisis `CNAME`

Valeurs à remplir :

- `Name` : `app`
- `Value` : la cible fournie par Vercel
- `TTL` : `1 hour`

Ne change pas :

- le record `@`
- le record `www`

Ces entrées doivent rester pour Shopify.

## 6. Vérifier

Quand le DNS est propagé :

- `https://app.acefloor.ca` doit ouvrir le calculateur
- `https://acefloor.ca` doit toujours ouvrir Shopify

## 7. Séquence recommandée pour toi

1. Déployer d'abord le projet sur Vercel
2. Tester l'URL `.vercel.app`
3. Ajouter `app.acefloor.ca` dans Vercel
4. Créer le `CNAME` dans GoDaddy
5. Vérifier que Shopify n'a pas bougé

## 8. Ensuite

Une fois le calculateur live sur `app.acefloor.ca`, la prochaine étape logique est :

- relier un bouton Shopify vers le calculateur
- préparer un CTA clair du type `Lancer le calculateur`
- connecter plus tard les SKU Shopify au moteur de calcul
