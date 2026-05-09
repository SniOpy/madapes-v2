# madapes-v2

Site statique Madapes Agency (Vercel) + API Express (Render) pour l'envoi des formulaires par email via Gmail SMTP.

## Architecture production

- Front: site statique deploye sur Vercel.
- API: service Node/Express deploye sur Render (`server/server.js`).
- Proxy API: `vercel.json` redirige `/api/*` vers Render.
- Email: Nodemailer vers Gmail SMTP (par defaut `smtp.gmail.com:587` avec TLS).

## Lancer localement

```bash
npm run start:api
```

API locale:

- healthcheck: `GET http://localhost:5500/api/health`
- formulaire contact: `POST http://localhost:5500/api/contact`

## Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner:

- `NODE_ENV=production` (sur Render)
- `MAIL_USER=madapes.agency@gmail.com`
- `MAIL_PASSWORD=<gmail app password>`
- `MAIL_HOST=smtp.gmail.com`
- `MAIL_PORT=587`
- `MAIL_SECURE=false`
- `MAIL_NETWORK_FAMILY=4`
- `SITE_BASE_URL=https://madapes-agency.com`
- `CORS_ALLOWED_ORIGINS=<origines autorisees, separees par des virgules>`

Timeouts SMTP (optionnels):

- `MAIL_CONNECTION_TIMEOUT_MS` (defaut 10000)
- `MAIL_GREETING_TIMEOUT_MS` (defaut 10000)
- `MAIL_SOCKET_TIMEOUT_MS` (defaut 15000)
- `MAIL_SEND_TIMEOUT_MS` (defaut 12000)

## Checklist de mise en production email

1. Render: deploy de la branche + variables d'environnement ci-dessus.
2. Render: verifier `GET https://<service-render>/api/health`.
3. Vercel: verifier que `vercel.json` pointe vers le bon service Render.
4. Vercel: verifier `GET https://<domaine-vercel>/api/health`.
5. Soumettre un formulaire depuis la page contact en production.
6. Verifier reception:
   - email admin sur `madapes.agency@gmail.com`
   - email de confirmation sur l'adresse client.

## Diagnostic rapide en cas d'erreur

- `500` sur `/api/contact`: lire les logs Render (`Contact form email send failed` + details SMTP).
- `429`: limite actuelle `5 requetes / 15 minutes` sur la route contact.
- Requete lente: augmenter les timeouts SMTP via variables d'environnement.
