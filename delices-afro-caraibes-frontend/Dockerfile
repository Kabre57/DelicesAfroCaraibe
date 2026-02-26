FROM node:lts-alpine

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
# Installer toutes les dépendances (dev incluses) pour pouvoir builder
RUN npm install

COPY . .
# Build Next.js en production (forcer webpack pour éviter Turbopack)
ENV NEXT_FORCE_WEBPACK=1
RUN NEXT_FORCE_WEBPACK=1 npm run build

# Nettoyer les devDependencies pour l'image finale
RUN npm prune --production

EXPOSE 3000
ENV NODE_ENV=production
RUN chown -R node /usr/src/app
USER node
CMD ["npm", "start"]
