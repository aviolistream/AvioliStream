# Backend - Plateforme de streaming (type Netflix/Prime Video)

Backend complet : authentification, catalogue de films/séries, upload vidéo via
Cloudflare Stream, historique de visionnage, "Ma liste", et abonnements Stripe.

## Stack

- Node.js + Express
- PostgreSQL + Prisma (ORM)
- Cloudflare Stream (hébergement/diffusion vidéo)
- Stripe (paiements et abonnements)
- JWT (authentification)

## Installation en local

```bash
npm install
```

Copie `.env.example` en `.env` et remplis les valeurs (voir chaque section ci-dessous
pour savoir où les récupérer).

```bash
cp .env.example .env
```

Une fois `DATABASE_URL` renseignée, génère les tables dans la base :

```bash
npm run prisma:migrate
```

Cette commande va aussi te demander un nom pour la migration (ex: "init") —
donne n'importe quel nom, ça crée un dossier `prisma/migrations/` qu'il faudra
committer sur GitHub (ne l'ajoute pas au `.gitignore`, il doit être versionné).

⚠️ **Important avant de déployer sur Railway** : exécute `npm run prisma:migrate`
au moins une fois en local (avec une base PostgreSQL locale ou temporaire) pour
générer le dossier `prisma/migrations/`. Sans ce dossier, la commande
`prisma migrate deploy` (lancée automatiquement au démarrage sur Railway)
n'aura rien à appliquer. Si tu n'as pas PostgreSQL en local, la façon la plus
simple est de déployer d'abord une base PostgreSQL vide sur Railway, de copier
son `DATABASE_URL` dans ton `.env` local temporairement, de lancer
`npm run prisma:migrate` une fois depuis ta machine, puis de pousser le dossier
`migrations/` généré sur GitHub avant de déployer le backend.

Démarre le serveur en mode développement :

```bash
npm run dev
```

Le serveur tourne sur `http://localhost:4000`. Teste avec :

```bash
curl http://localhost:4000/health
```

## Où récupérer chaque variable d'environnement

### DATABASE_URL
Si tu déploies sur **Railway** ou **Render** : crée une base PostgreSQL depuis leur
dashboard, ils te donnent directement l'URL de connexion à copier-coller.

### JWT_SECRET
N'importe quelle chaîne aléatoire longue. Génère-la avec :
```bash
openssl rand -base64 32
```

### CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_API_TOKEN
1. Crée un compte sur cloudflare.com
2. Active "Stream" dans le dashboard (carte bancaire requise, facturation à l'usage)
3. L'Account ID est visible sur la page d'accueil du dashboard
4. Crée un token API dans "Mon Profil" > "API Tokens" avec la permission "Stream: Edit"

### STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET
1. Crée un compte sur stripe.com
2. Reste en mode "Test" pour développer sans vrai argent
3. La clé secrète est dans Développeurs > Clés API
4. Le webhook secret s'obtient en créant un endpoint webhook (Développeurs > Webhooks)
   pointant vers `https://ton-domaine.com/api/subscriptions/webhook`

## Structure du projet

```
src/
  controllers/     -> logique métier de chaque route
  routes/          -> définition des endpoints Express
  middleware/      -> authentification JWT, vérification admin
  services/        -> intégration Cloudflare Stream
  prisma/          -> client Prisma partagé
prisma/
  schema.prisma    -> modèle de données complet
```

## Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| POST | /api/auth/signup | Créer un compte |
| POST | /api/auth/login | Se connecter |
| GET | /api/catalog | Parcourir le catalogue (auth requise) |
| GET | /api/catalog/:id | Détail d'un film/série avec URL de lecture |
| POST | /api/catalog/upload-url | (admin) Obtenir une URL d'upload Cloudflare |
| POST | /api/catalog/movies | (admin) Ajouter un film au catalogue |
| POST | /api/catalog/episodes | (admin) Ajouter un épisode |
| POST | /api/watch/progress | Sauvegarder la progression de lecture |
| GET | /api/watch/continue-watching/:profileId | "Continuer à regarder" |
| POST | /api/watch/my-list | Ajouter à "Ma liste" |
| GET | /api/watch/my-list/:profileId | Voir "Ma liste" |
| POST | /api/subscriptions/checkout | Créer une session de paiement Stripe |

## Comment fonctionne l'upload d'une vidéo (flux complet)

1. L'admin appelle `POST /api/catalog/upload-url` avec le nom et la taille du
   fichier → reçoit une `uploadUrl` (session TUS) et un `videoId`
2. Le fichier vidéo est envoyé **directement depuis le navigateur** vers cette
   `uploadUrl`, par morceaux de 50 Mo (protocole TUS) — pas via notre serveur.
   Ce protocole gère automatiquement la reprise en cas de coupure réseau,
   ce qui est essentiel pour des fichiers de plusieurs Go (films en HD/4K)
3. Cloudflare encode automatiquement la vidéo en plusieurs qualités (streaming adaptatif)
4. Une fois prêt, l'admin appelle `POST /api/catalog/movies` avec le `videoId`
   obtenu à l'étape 1, pour créer l'entrée dans le catalogue
5. Le frontend peut alors lire la vidéo via l'URL retournée par `getPlaybackUrl()`
   (format HLS `.m3u8`, lisible par n'importe quel lecteur vidéo moderne, y compris
   les lecteurs natifs iOS/Android/TV)

Fichiers supportés jusqu'à 30 Go grâce au protocole TUS (upload par morceaux).

## Déploiement (option simple recommandée)

1. Pousse ce code sur un dépôt GitHub
2. Crée un compte sur [Railway](https://railway.app)
3. "New Project" > "Deploy from GitHub repo" > sélectionne ce dépôt
4. Ajoute un plugin PostgreSQL dans le même projet Railway (génère `DATABASE_URL` automatiquement)
5. Renseigne les autres variables d'environnement dans l'onglet "Variables" de Railway
6. Railway build et déploie automatiquement à chaque push

## Prochaine étape

Une fois ce backend déployé et fonctionnel, on construit le frontend web (Next.js)
qui vient consommer cette API, puis l'application mobile en React Native.
