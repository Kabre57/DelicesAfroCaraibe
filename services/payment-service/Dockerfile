FROM node:18-bullseye-slim

WORKDIR /app

COPY services/payment-service/package*.json ./services/payment-service/
WORKDIR /app/services/payment-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/payment-service ./services/payment-service

WORKDIR /app/services/payment-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma
RUN npm run build

EXPOSE 3006

CMD ["npm", "start"]


