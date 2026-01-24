# Délices Afro-Caraïbe Mobile - Guide de Déploiement

## 🚀 Test en local

### 1. Installation de l'application Expo Go

Sur votre smartphone (Android ou iOS), installez l'application **Expo Go** :
- Android : [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- iOS : [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Démarrer le serveur de développement

```powershell
cd mobile
npm start
```

### 3. Scanner le QR code

- **Android** : Utilisez l'application Expo Go pour scanner le QR code affiché dans le terminal
- **iOS** : Utilisez l'appareil photo pour scanner le QR code

### 4. Tester sur émulateur

**Android Emulator :**
```powershell
npm run android
```

**iOS Simulator (Mac uniquement) :**
```powershell
npm run ios
```

**Web :**
```powershell
npm run web
```

---

## 📦 Déploiement pour Production

### Option 1 : Expo Application Services (EAS)

#### Étape 1 : Installation d'EAS CLI

```powershell
npm install -g eas-cli
```

#### Étape 2 : Connexion à Expo

```powershell
eas login
```

Si vous n'avez pas de compte, créez-en un sur [expo.dev](https://expo.dev)

#### Étape 3 : Configuration du projet

```powershell
cd mobile
eas build:configure
```

Cette commande va créer/mettre à jour le fichier `eas.json`

#### Étape 4 : Mise à jour de l'app.json

Remplacez `"your-project-id"` dans `app.json` par votre véritable ID de projet Expo :

```json
"extra": {
  "eas": {
    "projectId": "votre-id-de-projet"
  }
}
```

Pour obtenir votre ID de projet :
1. Allez sur [expo.dev](https://expo.dev)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Copiez l'ID du projet

#### Étape 5 : Build pour Android

**Build APK (pour test) :**
```powershell
eas build --platform android --profile preview
```

**Build AAB (pour Google Play Store) :**
```powershell
eas build --platform android --profile production
```

#### Étape 6 : Build pour iOS (Mac requis)

```powershell
eas build --platform ios --profile production
```

**Note :** Pour iOS, vous aurez besoin d'un compte Apple Developer (99$/an)

#### Étape 7 : Télécharger et tester le build

Une fois le build terminé, EAS vous fournira un lien pour télécharger l'APK/IPA.

#### Étape 8 : Soumission aux stores

**Google Play Store :**
```powershell
eas submit --platform android
```

**Apple App Store :**
```powershell
eas submit --platform ios
```

---

### Option 2 : Build local avec Expo

#### Build APK local (Android)

```powershell
npx expo export --platform android
npx expo prebuild --platform android
```

Ensuite, ouvrez le projet Android dans Android Studio :
```powershell
cd android
./gradlew assembleRelease
```

L'APK sera généré dans : `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔑 Configuration des clés et secrets

### Android Keystore

Pour générer un keystore pour signer votre application Android :

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

**⚠️ IMPORTANT :** Conservez ce fichier et le mot de passe en lieu sûr !

### Variables d'environnement

Créez un fichier `.env` dans le dossier `mobile/` :

```env
API_URL=https://votre-api.com
STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_MAPS_API_KEY=AIza...
```

---

## 📱 Configuration des permissions

Les permissions suivantes sont configurées dans `app.json` :

**Android :**
- ACCESS_COARSE_LOCATION
- ACCESS_FINE_LOCATION
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

**iOS :**
- NSLocationWhenInUseUsageDescription
- NSCameraUsageDescription
- NSPhotoLibraryUsageDescription

---

## 🎨 Personnalisation des assets

Avant de déployer, remplacez les assets par défaut :

1. **Icône de l'app** : `assets/icon.png` (1024x1024 px)
2. **Splash screen** : `assets/splash.png` (1284x2778 px)
3. **Icône adaptative Android** : `assets/adaptive-icon.png` (1024x1024 px)
4. **Favicon** : `assets/favicon.png` (48x48 px)

---

## 🔍 Vérification avant déploiement

- [ ] Toutes les fonctionnalités ont été testées
- [ ] Les images/assets sont optimisées
- [ ] Les clés API sont correctement configurées
- [ ] Le numéro de version est mis à jour dans `app.json`
- [ ] Les permissions sont justifiées et minimales
- [ ] Le bundle identifier est unique
- [ ] Les icônes et splash screens sont personnalisés

---

## 📊 Monitoring et Analytics

Après déploiement, configurez :

1. **Sentry** pour le suivi des erreurs
2. **Google Analytics** ou **Firebase Analytics**
3. **Expo Updates** pour les mises à jour OTA

```powershell
npx expo install sentry-expo
npx expo install expo-analytics-amplitude
```

---

## 🔄 Mises à jour OTA (Over-The-Air)

Avec Expo, vous pouvez pousser des mises à jour sans passer par les stores :

```powershell
eas update --branch production --message "Fix login bug"
```

---

## 🆘 Support et dépannage

**Erreurs courantes :**

1. **Metro bundler error** : Supprimez le cache
   ```powershell
   npx expo start -c
   ```

2. **Dépendances manquantes** : Réinstallez
   ```powershell
   rm -rf node_modules
   npm install
   ```

3. **Build échoue** : Vérifiez les logs sur [expo.dev](https://expo.dev)

**Ressources :**
- [Documentation Expo](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

## 📞 Contact

Pour toute question, consultez la documentation Expo ou créez une issue sur le dépôt GitHub du projet.
