FROM node:18-bullseye-slim

WORKDIR /app

COPY services/auth-service/package*.json ./services/auth-service/
WORKDIR /app/services/auth-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/auth-service ./services/auth-service

WORKDIR /app/services/auth-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
