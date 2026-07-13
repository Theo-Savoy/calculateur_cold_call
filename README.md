# Calculateur Cold Call – Leadjimé

Simulateur web pour estimer le temps de prospection téléphonique nécessaire pour atteindre un objectif commercial, et mesurer le gain apporté par [Leadjimé](https://www.leadjime.com).

## Fonctionnalités

- Calcul du volume d'appels, connects, meetings, opportunités et deals nécessaires.
- Estimation du temps quotidien et mensuel de calling.
- Comparaison Avant / Après Leadjimé.
- Export PNG format LinkedIn (1200×630).
- Partage LinkedIn avec copie de l'image et texte pré-rempli.
- Interface responsive, design bento.
- Collecte d'emails via Airtable (`POST /api/subscribe`).

## Démarrage local

```bash
vercel dev
```

## Endpoints

- `POST /api/subscribe` — body `{ "email": "user@example.com" }` — enregistre dans Airtable (déduplication par email).
- `GET /api/admin` — header `Authorization: Bearer <ADMIN_TOKEN>` — liste tous les emails.

## Variables d'environnement (Vercel)

- `AIRTABLE_TOKEN` — Personal Access Token Airtable.
- `AIRTABLE_BASE_ID` — ID de la base (commence par `app...`).
- `AIRTABLE_TABLE_ID` — ID de la table (commence par `tbl...`).
- `ADMIN_TOKEN` — token pour l'endpoint admin.

## Table Airtable attendue

| Champ      | Type     |
| ---------- | -------- |
| Email      | Email    |
| Timestamp  | Date     |
| UserAgent  | Text     |
| Referer    | Text     |

## Auteur

Créé par **Théo Savoy** pour Leadjimé.

## Licence

[MIT](./LICENSE)
