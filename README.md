# DelicesAfroCaraibe

## Variables d'environnement

Copiez `.env.example` vers `.env` et définissez au minimum:

- `JWT_SECRET` (obligatoire)

`docker-compose.yml` bloque désormais le démarrage des services concernés si `JWT_SECRET` est absent.

## Tests d'intégration minimum

Lancez le stack puis exécutez:

```bash
node --test tests/integration/api.integration.test.mjs
```

Les tests couvrent:

- flow `auth` (register/login/verify)
- endpoint lecture `restaurants` + protection des routes write
- protection write sur `order`
