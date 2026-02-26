FROM node:18-bullseye-slim

WORKDIR /app

COPY services/restaurant-service/package*.json ./services/restaurant-service/
WORKDIR /app/services/restaurant-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/restaurant-service ./services/restaurant-service

WORKDIR /app/services/restaurant-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]


