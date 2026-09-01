# Frontend - Reelio (nom provisoire)

Site web Next.js pour parcourir le catalogue et regarder les films/séries.
Se connecte au backend (voir dossier `streaming-backend`).

> "Reelio" est un nom provisoire que j'ai choisi pour donner une identité au
> design — change-le facilement dans `app/layout.js` (balise `<title>`) et
> `Navbar.js` une fois que tu as ton propre nom de marque.

## Installation en local

```bash
npm install
cp .env.example .env.local
```

Renseigne `NEXT_PUBLIC_API_URL` avec l'URL de ton backend (localhost en dev,
URL Railway en production).

```bash
npm run dev
```

Le site tourne sur `http://localhost:3000`.

## Pages

| Route | Description |
|---|---|
| /login | Connexion |
| /signup | Création de compte |
| / | Catalogue (hero + rangées par genre) |
| /watch/:id | Lecture d'un film ou d'une série (avec sélection d'épisode) |
| /admin | Tableau de bord du catalogue (réservé aux admins) |
| /admin/film | Ajouter un film (upload vidéo + métadonnées) |
| /admin/serie | Ajouter une série (métadonnées seules) |
| /admin/episode?contentId=...&title=... | Ajouter un épisode à une série |

## Accès admin

Les pages `/admin/*` appellent des routes backend protégées par `requireAdmin`.
Pour qu'un compte ait les droits admin, son email doit être dans la variable
`ADMIN_EMAILS` du fichier `.env` du **backend** (pas du frontend). Connecte-toi
d'abord avec cet email via `/login`, puis accède à `/admin`.

## Comment uploader un film ou une série (flux complet)

1. Va sur `/admin`
2. Pour un film : clique "+ Ajouter un film", remplis le formulaire, choisis le
   fichier vidéo, clique "Lancer l'upload" (barre de progression affichée),
   puis "Ajouter au catalogue" une fois l'upload terminé
3. Pour une série : clique "+ Ajouter une série", remplis les infos générales,
   tu es redirigé automatiquement vers l'ajout du premier épisode. Le
   formulaire d'épisode se réinitialise après chaque ajout pour enchaîner
   facilement (numéro d'épisode incrémenté automatiquement)

Note : l'upload utilise le protocole TUS (upload par morceaux avec reprise
automatique en cas de coupure réseau), ce qui permet d'envoyer des fichiers
jusqu'à 30 Go — largement suffisant pour un film en HD/4K.

## Lecture vidéo

Le composant `VideoPlayer` lit les flux HLS (`.m3u8`) fournis par Cloudflare
Stream via la librairie `hls.js`. Sur Safari/iOS, le HLS est lu nativement
sans librairie supplémentaire (le même composant fonctionnera donc aussi
comme base pour l'app mobile React Native, avec un lecteur natif équivalent).

## Prochaine étape

- Gestion multi-profils côté interface (actuellement géré uniquement côté backend)
- Page "Ma liste" (l'API existe déjà dans `lib/api.js`, il manque la page)
- Page de paiement/abonnement (Stripe Checkout, l'API existe déjà)
- Interface d'upload pour les admins (actuellement à faire via des requêtes API directes)
- Application mobile (React Native) réutilisant `lib/api.js` comme référence
