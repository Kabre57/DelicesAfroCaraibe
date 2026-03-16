# Deploiement VPS sans conflit

Ce guide deploie `DelicesAfroCaraibe` sur un VPS ou un autre projet Docker tourne deja.

## Ports utilises par ce projet

- Frontend: `3100`
- APIs: `3101` a `3112`
- Postgres: `55432`
- Redis: `56379`

Ces ports ne chevauchent pas le projet observe sur le VPS (`3000`, `3001`, `4001-4012`, `8080`, `5432`, `6379`, `9000-9001`).

## 1. Preparation

```bash
cd /opt
git clone <votre-repo> delices-afro-caraibe
cd delices-afro-caraibe
cp .env.production.example .env
```

Editez ensuite `.env` avec:

- un vrai `JWT_SECRET`
- vos cles Stripe/Twilio/Cloudinary/Google Maps si vous activez ces fonctions
- vos variables SMTP si vous voulez les emails
- `UPLOAD_PUBLIC_BASE_URL`

## 2. Validation avant lancement

```bash
docker compose --env-file .env -f docker-compose.yml config
```

## 3. Build et lancement

```bash
docker compose --env-file .env -f docker-compose.yml up -d --build
docker compose -f docker-compose.yml ps
```

## 4. Verification technique

```bash
curl http://127.0.0.1:3101/health
curl http://127.0.0.1:3103/health
curl http://127.0.0.1:3104/health
curl http://127.0.0.1:3100
```

## 5. DNS recommande

Ajoutez ces entrees DNS vers l'IP publique du VPS:

- `delices.votre-domaine.com`
- `api-delices.votre-domaine.com`
- `order-ws.votre-domaine.com`
- `delivery-ws.votre-domaine.com`
- `chat-ws.votre-domaine.com`

## 6. Mise en ligne domaine sans casser l'existant

Recommandation:

- gardez le projet existant tel quel
- ajoutez un nouveau sous-domaine, par exemple `delices.votre-domaine.com`
- faites pointer ce sous-domaine vers `http://127.0.0.1:3100`
- exposez l'API sous `api-delices.votre-domaine.com`
- exposez les sockets sous `order-ws`, `delivery-ws` et `chat-ws`

## 7. Exemple Nginx

```nginx
server {
    server_name delices.votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

API HTTP unique avec routage par prefixe:

```nginx
server {
    server_name api-delices.votre-domaine.com;

    location /api/auth/ {
        proxy_pass http://127.0.0.1:3101;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/users/ {
        proxy_pass http://127.0.0.1:3102;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/restaurants/ {
        proxy_pass http://127.0.0.1:3103;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/menu/ {
        proxy_pass http://127.0.0.1:3103;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/orders/ {
        proxy_pass http://127.0.0.1:3104;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/deliveries/ {
        proxy_pass http://127.0.0.1:3105;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/payments/ {
        proxy_pass http://127.0.0.1:3106;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/notifications/ {
        proxy_pass http://127.0.0.1:3107;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/geocode {
        proxy_pass http://127.0.0.1:3108;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/reverse-geocode {
        proxy_pass http://127.0.0.1:3108;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/distance {
        proxy_pass http://127.0.0.1:3108;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/route {
        proxy_pass http://127.0.0.1:3108;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/nearby {
        proxy_pass http://127.0.0.1:3108;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/chat/ {
        proxy_pass http://127.0.0.1:3109;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/upload/ {
        proxy_pass http://127.0.0.1:3110;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3110;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/payment/ {
        proxy_pass http://127.0.0.1:3111;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /webhook {
        proxy_pass http://127.0.0.1:3111;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/sms/ {
        proxy_pass http://127.0.0.1:3112;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sockets dedies:

```nginx
server {
    server_name order-ws.votre-domaine.com;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3104/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name delivery-ws.votre-domaine.com;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3105/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name chat-ws.votre-domaine.com;

    location /socket.io/ {
        proxy_pass http://127.0.0.1:3109/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Puis activez HTTPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx \
  -d delices.votre-domaine.com \
  -d api-delices.votre-domaine.com \
  -d order-ws.votre-domaine.com \
  -d delivery-ws.votre-domaine.com \
  -d chat-ws.votre-domaine.com
```

## 8. Mise a jour

```bash
git pull
docker compose --env-file .env -f docker-compose.yml up -d --build
docker image prune -f
```

## 9. Retour arriere

Le projet existant ne sera pas impacte tant que vous ne modifiez pas son reverse proxy ni ses conteneurs.

Pour stopper uniquement ce projet:

```bash
docker compose --env-file .env -f docker-compose.yml down
```
