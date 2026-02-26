# Manuel d'utilisation complet - Delices Afro-Caraibe

## 1. Vue d'ensemble
La plateforme contient 4 espaces:
- Public/Client: recherche restaurants, panier, commandes, paiement.
- Restaurateur: menu, categories, reglages restaurant, suivi commandes.
- Livreur: courses, gains, profil.
- Admin: supervision globale, validations, finances, support, categories.

## 2. Connexion et roles
- `CLIENT`: commander et payer.
- `RESTAURATEUR`: gerer restaurant, plats, categories.
- `LIVREUR`: accepter et livrer des courses.
- `ADMIN`: piloter toute la plateforme.

## 3. Espace Restaurateur
### 3.1 Parametres restaurant
Chemin: `Restaurateur > Reglages`.

Vous pouvez modifier:
- nom, description, adresse, ville, code postal, telephone,
- image restaurant,
- type de cuisine,
- heure d'ouverture,
- heure de fermeture,
- statut actif/inactif.

Les horaires sont sauvegardes pour tous les jours (lundi a dimanche) avec la plage choisie.
Version avancee:
- edition separée `ouverture/fermeture` pour chaque jour (lun -> dim).

### 3.2 Gestion menu
Chemin: `Restaurateur > Menu`.

Fonctions:
- ajouter un plat (nom, prix, categorie, image, description),
- modifier, dupliquer, activer/desactiver, supprimer un plat,
- recherche et filtre par categorie.

### 3.3 Gestion categories (restaurateur)
Chemin: `Restaurateur > Menu > Gerer categories`.

Fonctions:
- creer categorie avec image,
- mettre a jour l'image d'une categorie,
- supprimer categorie.

Impact:
- categories visibles sur l'accueil,
- categories disponibles dans le formulaire d'ajout de plats.

### 3.4 Sous-comptes restaurant
Chemin: `Restaurateur > Reglages`.

Fonctions:
- creer un sous-compte (prenom, nom, email, role, mot de passe initial),
- activer/desactiver,
- reinitialiser le mot de passe,
- supprimer.

Use case:
- deleguer la caisse, le management ou la cuisine par restaurant.

Authentification:
- un sous-compte se connecte sur la page login standard (`/auth/login`),
- il recoit un token RESTAURATEUR scope sous-compte,
- les actions restaurateur sont executees pour le restaurant parent,
- le proprietaire peut forcer un changement de mot de passe (`mustChangePassword`).

## 4. Espace Admin
### 4.1 Catalogue categories
Chemin: `Admin > Categories`.

Fonctions:
- ajouter categorie (nom, description, image),
- changer image categorie,
- supprimer categorie.

Cette page sert de gestion centrale du referentiel categories.

### 4.2 Autres modules admin
- `Dashboard`: KPI globaux.
- `Users`: gestion utilisateurs.
- `Restos`: validation restaurateurs/restaurants.
- `Livreurs`: validation livreurs.
- `Finances`, `Analytics`, `Config`, `Support`.

## 5. Espace Client
### 5.1 Recherche et commande
- page restaurants,
- panier,
- creation commande.

### 5.2 Paiement
- Carte (`CARD`) ou Especes a la livraison (`CASH`).
- Pour cash: confirmer paiement en especes sur la page paiement.

## 6. Espace Livreur
- visualiser courses,
- suivre livraisons,
- consulter gains,
- gerer profil.

Profil livreur:
- informations compte,
- note moyenne,
- statistiques calculees (acceptation, annulation, livraisons, attente),
- documents (piece d'identite, assurance, casier, etc.).

## 7. API categories (restaurant-service)
- `GET /api/restaurants/categories`
- `POST /api/restaurants/categories`
- `PUT /api/restaurants/categories/:id`
- `DELETE /api/restaurants/categories/:id`

## 8. Upload images
Service upload:
- endpoint single: `POST /api/upload/upload/single` (field `image`)
- formats: JPG, JPEG, PNG, WEBP
- taille max: 10 MB

## 9. Depannage rapide
- Image non affichee:
  - verifier URL image,
  - reuploader l'image,
  - verifier `upload-service`.
- Categories 500:
  - verifier migration Prisma categories executee.
- Texte casse (encodage):
  - verifier que les fichiers frontend sont en UTF-8.

## 10. Exploitation
- Deploiement infra/DNS/SSL: voir `docs/deploiement-namecheap.md`.
- Migrations DB: executer avant redemarrage production.
- Redemarrage services: `docker compose up -d --force-recreate`.
