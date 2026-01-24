FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY ../../shared/prisma ./prisma

RUN npm install

RUN npx prisma generate --schema=../../shared/prisma/schema.prisma

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
