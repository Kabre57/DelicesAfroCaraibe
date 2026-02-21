FROM node:18-bullseye-slim

WORKDIR /app

COPY services/delivery-service/package*.json ./services/delivery-service/
WORKDIR /app/services/delivery-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/delivery-service ./services/delivery-service

WORKDIR /app/services/delivery-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma
RUN npm run build

EXPOSE 3005

CMD ["npm", "start"]
