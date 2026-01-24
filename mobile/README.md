# Délices Afro-Caraïbe - Application Mobile

Application mobile React Native développée avec Expo pour la plateforme de livraison de restaurants afro-caribéens.

## 🚀 Technologies

- React Native 0.74.0
- Expo 51
- TypeScript
- React Navigation
- Zustand (gestion d'état)
- Axios
- Socket.io
- React Native Maps
- Stripe (paiement)

## 📱 Fonctionnalités

- Liste des restaurants par cuisine (africaine, caribéenne)
- Détails des restaurants et menus
- Panier et commande
- Suivi des commandes en temps réel
- Authentification utilisateur
- Géolocalisation
- Paiement intégré

## 🛠️ Installation

### Prérequis

- Node.js (version 18+)
- npm ou yarn
- Expo CLI

### Installation des dépendances

```bash
cd mobile
npm install
```

## 🏃‍♂️ Lancer l'application

### Mode développement

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

### Web

```bash
npm run web
```

## 📦 Build et déploiement

### Installation EAS CLI

```bash
npm install -g eas-cli
```

### Configuration du projet

```bash
eas login
eas build:configure
```

### Build Android

```bash
eas build --platform android
```

### Build iOS

```bash
eas build --platform ios
```

### Publication

```bash
eas submit --platform android
eas submit --platform ios
```

## 🔧 Configuration

Modifiez `app.json` pour personnaliser :
- Nom de l'application
- Icônes et splash screen
- Bundle identifiers
- Permissions

## 📝 Structure du projet

```
mobile/
├── App.tsx                 # Point d'entrée
├── src/
│   └── screens/           # Écrans de l'application
│       ├── HomeScreen.tsx
│       ├── RestaurantsScreen.tsx
│       ├── RestaurantDetailScreen.tsx
│       ├── CartScreen.tsx
│       ├── OrdersScreen.tsx
│       ├── ProfileScreen.tsx
│       └── auth/
│           ├── LoginScreen.tsx
│           └── RegisterScreen.tsx
├── app.json               # Configuration Expo
├── package.json
└── tsconfig.json
```
