FROM node:18-bullseye-slim

WORKDIR /app

COPY services/order-service/package*.json ./services/order-service/
WORKDIR /app/services/order-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/order-service ./services/order-service

WORKDIR /app/services/order-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma
RUN npm run build

EXPOSE 3004

CMD ["npm", "start"]
