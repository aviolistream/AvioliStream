# Tutoriel de déploiement sur Railway (première fois)

Ce guide suppose que tu n'as jamais utilisé Railway. On déploie deux choses
séparément : le **backend** (API) et le **frontend** (site web).

---

## Étape 0 — Mettre le code sur GitHub

Railway déploie à partir d'un dépôt GitHub, donc il faut d'abord y pousser le code.

1. Va sur [github.com](https://github.com) et crée un compte si tu n'en as pas
2. Clique sur le **+** en haut à droite → **New repository**
3. Nomme-le `streaming-backend`, laisse-le "Public" ou "Private" (peu importe), ne coche aucune case (pas de README), clique **Create repository**
4. Répète pour un deuxième dépôt nommé `streaming-frontend`
5. Sur la page de chaque dépôt fraîchement créé, GitHub affiche une section "…or push an existing repository from the command line" — si tu n'es pas à l'aise avec les commandes, utilise plutôt l'option **"uploading an existing file"** (lien en haut de la page du dépôt vide) : tu peux glisser-déposer tout le dossier `streaming-backend/` (ou `streaming-frontend/`) directement dans l'interface web de GitHub

⚠️ Important : n'uploade jamais le fichier `.env` (celui qui contient tes vrais identifiants Cloudflare). Il n'est pas dans le dossier que je t'ai donné, donc pas de risque si tu uploades tel quel.

---

## Étape 1 — Déployer le backend sur Railway

1. Va sur [railway.app](https://railway.app) et connecte-toi avec ton compte GitHub (bouton "Login with GitHub")
2. Clique **New Project**
3. Choisis **Deploy from GitHub repo**
4. Sélectionne ton dépôt `streaming-backend` (Railway te demandera peut-être d'autoriser l'accès à tes dépôts la première fois — accepte)
5. Railway commence à builder automatiquement. **Ça va échouer pour l'instant** — c'est normal, il manque la base de données et les variables d'environnement. Continue les étapes suivantes.

### Ajouter la base de données PostgreSQL

1. Dans ton projet Railway (celui qui contient déjà ton service backend), clique **+ New** (en haut à droite ou dans le canvas)
2. Choisis **Database** → **Add PostgreSQL**
3. Railway crée automatiquement la base et génère une variable `DATABASE_URL`

### Relier la base de données au backend

1. Clique sur ton service backend (la carte nommée `streaming-backend`)
2. Va dans l'onglet **Variables**
3. Clique **+ New Variable** → mais au lieu de taper une valeur, clique sur l'icône qui permet de **référencer une variable d'un autre service** (souvent affiché comme "Add Reference" ou un raccourci `${{ }}`)
4. Sélectionne le service PostgreSQL et la variable `DATABASE_URL` — cela connecte automatiquement les deux

Si cette option de référence ne s'affiche pas facilement : clique sur le service **PostgreSQL**, onglet **Variables**, copie la valeur de `DATABASE_URL` telle quelle, puis colle-la manuellement comme variable `DATABASE_URL` dans ton service backend.

### Ajouter les autres variables d'environnement

Toujours dans ton service backend → onglet **Variables** → **+ New Variable**, ajoute une par une :

| Nom | Valeur |
|---|---|
| `JWT_SECRET` | une chaîne aléatoire longue (invente-la, ex: `a8f3k2m9x7q1w4e6r8t3y5u2i0o9p7`) |
| `CLOUDFLARE_ACCOUNT_ID` | ton Account ID Cloudflare (celui que tu m'as déjà donné) |
| `CLOUDFLARE_API_TOKEN` | ton API Token Cloudflare (celui que tu m'as déjà donné) |
| `ADMIN_EMAILS` | ton adresse email (celle que tu utiliseras pour te connecter en admin) |
| `FRONTEND_URL` | mets `http://localhost:3000` pour l'instant, on corrigera à l'étape 3 |
| `PORT` | `4000` |

### Générer les migrations de base de données AVANT de déployer

C'est l'étape la plus technique. Le backend a besoin que les tables existent dans PostgreSQL avant de démarrer. Le plus simple sans installer PostgreSQL sur ta machine :

1. Une fois `DATABASE_URL` bien reliée dans Railway (étape précédente), va dans l'onglet **Settings** de ton service backend
2. Cherche la section **Deploy** → trouve l'option pour ouvrir un **terminal/shell** sur ton service déployé (Railway propose un bouton "Shell" ou passe par leur CLI — si tu ne le trouves pas facilement, utilise plutôt l'option ci-dessous)

**Option plus simple si tu bloques sur le shell Railway :**
1. Installe Node.js sur ta machine si ce n'est pas déjà fait ([nodejs.org](https://nodejs.org))
2. Ouvre un terminal dans le dossier `streaming-backend` sur ton ordinateur
3. Lance `npm install`
4. Crée un fichier `.env` local (copie `.env.example`) et mets-y la même `DATABASE_URL` que celle affichée dans Railway (onglet Variables du service PostgreSQL — clique sur l'œil pour révéler la valeur, copie-la)
5. Lance `npm run prisma:migrate` — ça va te demander un nom, tape `init` et valide
6. Un dossier `prisma/migrations/` apparaît chez toi avec les fichiers de migration
7. Ajoute ce dossier à ton dépôt GitHub `streaming-backend` (uploade-le comme à l'étape 0)
8. Railway redéploie automatiquement dès qu'il détecte le changement sur GitHub

### Vérifier que le backend tourne

1. Dans Railway, clique sur ton service backend → onglet **Settings** → section **Networking** → clique **Generate Domain** si aucune URL publique n'existe encore
2. Railway te donne une URL du type `streaming-backend-production.up.railway.app`
3. Ouvre cette URL dans ton navigateur en ajoutant `/health` à la fin (ex: `https://streaming-backend-production.up.railway.app/health`)
4. Tu dois voir : `{"status":"ok","service":"streaming-backend"}`

Si ça ne marche pas, va dans l'onglet **Deployments** de Railway et clique sur le déploiement le plus récent pour voir les logs d'erreur — copie-moi le message d'erreur si tu bloques.

---

## Étape 2 — Déployer le frontend sur Railway

1. Retourne sur le dashboard Railway, clique **New Project** (un projet séparé, ou "+ New" dans le même projet si tu préfères tout regrouper)
2. **Deploy from GitHub repo** → sélectionne `streaming-frontend`
3. Va dans l'onglet **Variables** de ce service et ajoute :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_API_URL` | l'URL de ton backend obtenue à l'étape 1 (ex: `https://streaming-backend-production.up.railway.app`) — **sans** `/health` à la fin |

4. Génère aussi un domaine public pour ce service (**Settings** → **Networking** → **Generate Domain**)
5. Attends que le déploiement se termine (onglet **Deployments**, statut "Success")

---

## Étape 3 — Reconnecter les deux services entre eux

1. Copie l'URL publique de ton **frontend** (celle générée à l'étape 2)
2. Retourne sur ton service **backend** → onglet **Variables** → modifie `FRONTEND_URL` avec cette URL
3. Railway redéploie automatiquement le backend avec la nouvelle valeur

---

## Étape 4 — Premier test complet

1. Ouvre l'URL de ton frontend dans le navigateur
2. Tu devrais voir la page de connexion avec le logo Avioli Stream
3. Clique "Inscris-toi", crée un compte avec l'email que tu as mis dans `ADMIN_EMAILS`
4. Une fois connecté, va directement sur `tonsite.railway.app/admin`
5. Essaie d'ajouter un petit film test (une courte vidéo de quelques Mo pour commencer, pas un film entier) pour valider que tout le circuit fonctionne : upload → Cloudflare → catalogue → lecture

---

## En cas de blocage

Les erreurs les plus courantes :
- **Le backend crash au démarrage** → regarde les logs dans Railway (onglet Deployments), c'est presque toujours une variable d'environnement manquante ou mal orthographiée
- **"CORS error" dans la console du navigateur** → vérifie que `FRONTEND_URL` dans le backend correspond exactement à l'URL de ton frontend
- **La vidéo ne se lit pas** → vérifie que la vidéo est bien "ready to stream" dans le dashboard Cloudflare Stream (l'encodage prend quelques minutes selon la taille du fichier)

Si tu bloques sur un message d'erreur précis, copie-le moi tel quel et je t'aide à le résoudre.
