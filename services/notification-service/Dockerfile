FROM node:18-bullseye-slim

WORKDIR /app

COPY services/notification-service/package*.json ./services/notification-service/
WORKDIR /app/services/notification-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/notification-service ./services/notification-service

WORKDIR /app/services/notification-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma
RUN npm run build

EXPOSE 3007

CMD ["npm", "start"]
