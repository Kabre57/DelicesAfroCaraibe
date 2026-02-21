FROM node:18-bullseye-slim

WORKDIR /app

COPY services/user-service/package*.json ./services/user-service/
WORKDIR /app/services/user-service
RUN npm install

WORKDIR /app
COPY shared/prisma ./shared/prisma
COPY services/user-service ./services/user-service

WORKDIR /app/services/user-service
RUN npx prisma generate --schema=/app/shared/prisma/schema.prisma
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
