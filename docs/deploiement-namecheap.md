# Plan de deploiement (Namecheap + Docker)

## 1. Prerequis
- Domaine achete sur Namecheap.
- VPS Linux (Ubuntu 22.04 recommande) chez Namecheap ou autre fournisseur.
- Acces SSH.
- Ports ouverts: `80`, `443`, `3100`, `3101-3112` (ou uniquement `80/443` si reverse proxy).

## 2. Preparation serveur
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

## 3. DNS Namecheap
- Dans `Domain List > Manage > Advanced DNS`:
  - `A Record`:
    - `@` -> IP publique VPS
    - `www` -> IP publique VPS
  - (optionnel) `api` -> IP publique VPS
- TTL: `Automatic`.

## 4. Deploiement application
```bash
git clone <votre-repo>
cd <votre-repo>
cp .env.example .env
```

Configurer `.env`:
- DB, JWT, URLs des services, CORS, upload, etc.
- Pour le frontend: `NEXT_PUBLIC_*` vers votre domaine/API.

## 5. Migration Prisma (obligatoire pour Category)
Dans ce projet, un nouveau modele `Category` est ajoute.

Option Docker:
```bash
docker compose -f docker-compose.yml run --rm prisma-migrate npx prisma migrate deploy --schema=/app/shared/prisma/schema.prisma
```

Option locale:
```bash
npx prisma migrate deploy --schema=shared/prisma/schema.prisma
```

## 6. Build + lancement
```bash
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.yml ps
```

## 7. Reverse proxy + HTTPS (recommande)
- Installer Nginx + Certbot.
- Router:
  - Frontend -> `http://localhost:3100`
  - API -> `http://localhost:3103` (ou gateway si vous en ajoutez une)
- SSL:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

## 8. Verification post-deploiement
- `GET /health` de chaque service.
- Frontend accessible en HTTPS.
- Login restaurateur OK.
- CRUD categories OK:
  - `GET /api/restaurants/categories`
  - `POST /api/restaurants/categories`
  - `PUT /api/restaurants/categories/:id`
  - `DELETE /api/restaurants/categories/:id`
- Upload image categorie/menu OK.

## 9. Procedure de mise a jour
```bash
git pull
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d --force-recreate
docker image prune -f
```

## 10. Rollback rapide
- Garder les tags d'images stables (`release-YYYYMMDD`).
- En cas de souci:
  - Revenir au tag precedent dans `docker-compose.yml`.
  - `docker compose up -d --force-recreate`.
