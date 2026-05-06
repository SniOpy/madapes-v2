# madapes-v2

Site vitrine Madapes Agency avec formulaires `contact` et `devis` gérés en JavaScript côté serveur.

## Lancer localement

```bash
node server.mjs
```

Le serveur démarre par défaut sur `http://localhost:3000`.

## Configuration e-mail (optionnelle)

Copier `.env.example` vers `.env` puis renseigner :

- `RESEND_API_KEY`
- `FORM_FROM_EMAIL`
- `FORM_TO_EMAIL`

Sans ces variables, les soumissions sont quand même enregistrées dans `data/submissions.log`.

## Endpoints API

- `POST /api/contact`
- `POST /api/devis`

Chaque endpoint applique :

- validation serveur des champs obligatoires
- validation e-mail
- minimum 20 caractères pour le message
- honeypot anti-spam (`contact_website`)
- rate-limit basique par IP
