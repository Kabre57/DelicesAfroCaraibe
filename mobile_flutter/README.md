# Delices Afro Caraibe - Mobile Flutter

## Prerequis

- Flutter 3.41+
- Backend lance via `docker compose -f docker-compose.yml up -d`

## Installation

```bash
cd mobile_flutter
flutter pub get
```

## Lancement

Android emulator (API locale Docker):

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2
```

iOS simulator:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost
```

Appareil physique:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_PC_LAN_IP
```

## Couvre actuellement

- Navigation onglets (Accueil, Restaurants, Commandes, Profil)
- Auth (`/api/auth/login`, `/api/auth/register`)
- Liste restaurants + detail + menu
- Liste commandes du user connecte

## A finir ensuite

- Etat panier complet (Provider/Riverpod)
- Paiement Stripe natif Flutter
- Notifications push
