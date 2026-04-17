# Manuel Utilisateur Propriétaire

## Application

- Nom: `DELICES AFRO-CARAIBE`
- Accès web actuel: `http://180.149.199.203/`
- Date de référence de ce manuel: `12 mars 2026`

Ce document explique comment exploiter l'application au quotidien en tant que propriétaire ou responsable opérationnel.

## Profils disponibles

L'application contient 4 espaces distincts:

- `Admin`: supervision de la plateforme
- `Client`: commande de repas et suivi des achats
- `Restaurateur`: gestion du restaurant, du menu et des commandes
- `Livreur`: gestion des courses, du chat et des gains

## Connexion

1. Ouvrir `http://180.149.199.203/`
2. Cliquer sur `Connexion`
3. Saisir l'email et le mot de passe
4. Après connexion, l'application redirige automatiquement vers le bon espace selon le rôle

Rappels:

- si l'écran reste bloqué sur une ancienne version, faire `Ctrl + Shift + R`
- en cas d'erreur de session, se déconnecter puis se reconnecter

## Espace Admin

Accès: `/admin/dashboard`

L'espace admin sert à piloter toute la plateforme.

### Tableau de bord

Le tableau de bord affiche:

- nombre de commandes du jour
- restaurants actifs
- livreurs actifs
- chiffre d'affaires du jour
- alertes critiques
- top restaurants
- validations en attente
- activité horaire

Usage recommandé:

1. vérifier les alertes en haut de journée
2. contrôler les demandes de validation restaurateurs et livreurs
3. suivre les commandes, le chiffre d'affaires et la progression mensuelle

### Utilisateurs

Accès: `/admin/users`

Permet de:

- filtrer les utilisateurs par rôle
- rechercher un utilisateur
- ouvrir la fiche d'un utilisateur

Le propriétaire peut s'en servir pour contrôler les comptes `CLIENT`, `RESTAURATEUR`, `LIVREUR` et `ADMIN`.

### Restaurants

Accès: `/admin/restos`

Permet de:

- voir les restaurants actifs
- visualiser les demandes en attente
- valider un restaurateur
- consulter les meilleurs restaurants

Procédure de validation:

1. ouvrir `Restos`
2. repérer le restaurateur en attente
3. vérifier son identité, son téléphone et son restaurant
4. cliquer sur `Valider`

### Catégories

Accès: `/admin/categories`

Permet de:

- créer une catégorie
- ajouter une image
- supprimer une catégorie

Exemples de catégories:

- plats africains
- plats caribéens
- grillades
- desserts
- boissons

### Livreurs

Accès: `/admin/livreurs`

Permet de:

- consulter les livreurs en attente
- approuver les comptes livreurs
- suivre les indicateurs de livraison

Procédure recommandée:

1. vérifier les documents du livreur
2. confirmer que les coordonnées sont correctes
3. approuver uniquement les profils conformes

### Finances

Accès: `/admin/finances`

Permet de:

- suivre les transactions
- consulter les montants
- observer les tendances de revenu
- exporter les rapports financiers

### Analytics

Accès: `/admin/analytics`

Permet de:

- analyser les cohortes clients
- suivre le taux d'échec de paiement
- voir l'évolution mensuelle des revenus
- consulter les logs d'audit

### Configuration

Accès: `/admin/config`

Permet de configurer:

- nom de la plateforme
- devise
- email et téléphone support
- commission par défaut
- paramètres de rémunération livreur
- retrait minimum livreur
- obligation 2FA admin
- rapport quotidien

Conseil:

- modifier ces paramètres uniquement par un responsable autorisé

### Support

Accès: `/admin/support`

Permet de:

- visualiser les alertes automatiques
- créer un ticket support
- classer les tickets par statut
- clôturer ou faire avancer un incident

Statuts disponibles:

- `OPEN`
- `IN_PROGRESS`
- `CLOSED`

## Espace Client

Accès après connexion: `/client/dashboard`

Le client peut découvrir les restaurants, passer une commande et la suivre.

### Tableau de bord client

Le dashboard client affiche:

- résumé des commandes
- promotions
- restaurants populaires
- plats populaires
- notifications
- adresse de livraison

### Recherche de restaurants

Accès: `/restaurants`

Le client peut:

- rechercher un restaurant ou un plat
- filtrer par type de cuisine
- filtrer par prix
- filtrer par ouverture
- trier les résultats

### Fiche restaurant

Accès: `/restaurants/{id}`

Le client peut:

- consulter les informations du restaurant
- parcourir le menu
- ajouter des plats au panier
- voir le nombre d'articles dans le panier

### Panier

Accès: `/client/cart`

Le panier permet de:

- modifier les quantités
- supprimer un article
- saisir l'adresse de livraison
- ajouter des instructions
- choisir le mode de paiement

Important:

- une commande ne peut contenir que des articles d'un seul restaurant

### Paiement

Accès: `/client/payment?orderId=...`

Moyens proposés:

- espèces à la livraison
- carte

Le client voit:

- le récapitulatif de commande
- le montant à payer
- le statut du paiement

### Commandes

Accès: `/client/orders`

Permet de:

- voir l'historique des commandes
- repérer les commandes en cours
- payer une commande non réglée
- ouvrir la page de suivi détaillé

### Suivi de commande

Accès: `/client/orders/{id}`

Le suivi montre les étapes:

- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY`
- `IN_DELIVERY`
- `DELIVERED`

### Notifications

Accès: `/client/notifications`

Permet de:

- voir les notifications reçues
- marquer une notification comme lue
- tout marquer comme lu

### Profil

Accès: `/client/profile`

Permet de consulter:

- nom
- email
- téléphone
- adresse
- ville
- code postal

## Espace Restaurateur

Accès après connexion: `/restaurateur/dashboard`

Le restaurateur pilote son activité restaurant.

### Tableau de bord restaurateur

Le dashboard affiche:

- commandes du jour
- chiffre d'affaires du jour
- volume à préparer
- écart versus la veille
- commandes actives
- plats populaires
- suivi de livraison

Le restaurateur peut aussi:

- changer le statut d'une commande
- envoyer un signalement

### Commandes

Accès: `/restaurateur/commandes`

Permet de:

- filtrer par restaurant
- filtrer par statut
- rechercher une commande
- ouvrir le détail d'une commande
- appeler le client ou le livreur selon le cas

Statuts opérationnels:

- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY`
- `IN_DELIVERY`
- `DELIVERED`
- `CANCELLED`

Procédure recommandée:

1. passer les nouvelles commandes en `CONFIRMED`
2. lancer la préparation avec `PREPARING`
3. marquer `READY` quand le colis est prêt
4. laisser la livraison suivre son cycle jusqu'à `DELIVERED`

### Menu

Accès: `/restaurateur/menu`

Permet de:

- créer un plat
- modifier un plat
- supprimer ou désactiver un plat
- téléverser une image
- créer une catégorie

Champs principaux d'un plat:

- nom
- description
- prix
- catégorie
- image

### Statistiques

Accès: `/restaurateur/stats`

Permet de suivre:

- ventes
- revenus
- plats les plus demandés
- tendances de performance

### Réglages

Accès: `/restaurateur/reglages`

Permet de gérer:

- informations du restaurant
- horaires
- disponibilité générale

## Espace Livreur

Accès après connexion: `/livreur/dashboard`

Le livreur gère les courses proposées, l'état de sa mission et ses gains.

### Tableau de bord livreur

Le dashboard affiche:

- statut en ligne / hors ligne
- nouvelle commande proposée
- minuteur d'acceptation
- commande en cours
- gains du jour
- progression vers l'objectif quotidien

Actions disponibles:

- passer en ligne ou hors ligne
- accepter une course
- refuser une course
- mettre à jour le statut de livraison

Cycle de livraison:

- `ACCEPTED`
- `PICKED_UP`
- `ON_ROUTE`
- `DELIVERED`

### Courses

Accès: `/livreur/courses`

Permet de:

- voir l'historique rapide
- ouvrir la navigation Google Maps
- suivre les statuts de livraison

### Gains

Accès: `/livreur/gains`

Permet de:

- consulter les gains du jour, de la semaine et le total cumulé
- voir le solde disponible
- voir les retraits en attente
- demander un retrait

Méthodes de retrait:

- virement bancaire
- mobile money

### Messages

Accès: `/livreur/messages`

Permet de:

- discuter au sujet d'une commande
- sélectionner la commande concernée
- signaler un incident au support

Types de signalement:

- sécurité
- client injoignable
- restaurant fermé ou en retard
- véhicule en panne
- autre

### Profil

Accès: `/livreur/profil`

Permet de consulter:

- identité
- note moyenne
- statistiques
- documents
- état de validation du compte

## Procédures quotidiennes recommandées

### Pour le propriétaire

1. Se connecter à l'espace `Admin`
2. Vérifier les alertes et tickets support
3. Valider les restaurateurs et livreurs en attente
4. Contrôler les chiffres clés du jour
5. Vérifier la configuration si un changement tarifaire est prévu

### Pour le restaurant

1. Se connecter à l'espace `Restaurateur`
2. Vérifier les nouvelles commandes
3. Mettre à jour les statuts au fil de la préparation
4. Contrôler la carte et la disponibilité des plats

### Pour le livreur

1. Passer `En ligne`
2. Accepter une course
3. Mettre à jour les étapes de livraison
4. Signaler immédiatement tout incident

## Bonnes pratiques

- changer les mots de passe temporaires après la première connexion
- limiter l'accès admin à un petit nombre de personnes
- vérifier chaque jour les tickets `OPEN`
- approuver manuellement les livreurs et restaurateurs après contrôle
- garder les coordonnées support à jour dans `Admin > Config`

## Dépannage rapide

### Je ne peux pas me connecter

- vérifier l'email et le mot de passe
- refaire un chargement forcé `Ctrl + Shift + R`
- essayer en navigation privée

### Une page est vide ou ne charge pas

- actualiser la page
- se déconnecter puis se reconnecter
- vérifier que le compte est bien du bon rôle

### Un restaurateur ou un livreur n'accède pas à ses fonctions

- vérifier dans l'espace admin qu'il a été approuvé

### Une commande n'avance pas

- contrôler son statut dans l'espace restaurateur
- vérifier si un livreur a accepté la livraison
- consulter les notifications ou le support

## Remise au propriétaire

Au moment de remettre l'application au propriétaire, transmettre séparément:

- l'URL de l'application
- les identifiants initiaux
- les rôles attribués à chaque compte
- les consignes de changement de mot de passe
- la personne de contact technique
