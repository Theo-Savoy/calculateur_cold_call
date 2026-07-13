# Calculateur Cold Call – Leadjimé

Simulateur web pour estimer le temps de prospection téléphonique nécessaire pour atteindre un objectif commercial, et mesurer le gain apporté par [Leadjimé](https://www.leadjime.com).

## Fonctionnalités

- Calcul du volume d'appels, connects, meetings, opportunités et deals nécessaires.
- Estimation du temps quotidien et mensuel de calling.
- Comparaison Avant / Après Leadjimé.
- Export PNG format LinkedIn (1200×630).
- Partage LinkedIn avec copie de l'image et texte pré-rempli.
- Interface responsive, design bento.
- Collecte d'emails via Upstash Redis (`POST /api/subscribe`).

## Démarrage local

```bash
npm install
vercel dev
```

## Endpoints

- `POST /api/subscribe` — body `{ "email": "user@example.com" }` — enregistre l'email dans Upstash Redis.
- `GET /api/admin` — header `Authorization: Bearer <ADMIN_TOKEN>` — liste tous les emails collectés.

## Variables d'environnement

- `UPSTASH_REDIS_REST_URL` — URL REST Upstash.
- `UPSTASH_REDIS_REST_TOKEN` — token REST Upstash.
- `ADMIN_TOKEN` — token pour l'endpoint admin (récupération des emails).

## Déploiement

```bash
npm install -g vercel
vercel link
vercel integration add upstash/upstash-kv
vercel env add ADMIN_TOKEN
vercel --prod
```

## Auteur

Créé par **Théo Savoy** pour Leadjimé.

## Licence

[MIT](./LICENSE)
