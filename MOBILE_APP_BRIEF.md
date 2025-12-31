# 📱 Brief Application Mobile - Optimus Halal

## 🎯 Vue d'ensemble

**Nom de l'application :** Optimus Halal  
**Plateforme :** Mobile (iOS & Android)  
**Public cible :** Consommateurs musulmans recherchant des produits halal certifiés et éthiques  
**Positionnement :** Application de référence pour la consommation halal éthique et transparente

---

## 🌟 Vision & Valeurs

### Mission
Permettre aux consommateurs musulmans de faire des choix éclairés en matière de consommation halal, en alliant **authenticité religieuse** et **éthique moderne**.

### Valeurs Fondamentales
- ✅ **Transparence** : Certification halal vérifiée et traçable
- 🌱 **Éthique** : Bio, anti-surconsommation, commerce équitable
- 🤝 **Responsabilité** : Boycott des entreprises non-éthiques (ex: soutien aux causes humanitaires)
- 🔍 **Authenticité** : Lutte contre les usurpations de certification halal
- 💚 **Durabilité** : Promotion des circuits courts et producteurs locaux

### Inspiration
- **Boycott X** : Pour le système de signalement et d'alertes éthiques
- **Yuka** : Pour le scan de produits et notation
- **Too Good To Go** : Pour l'engagement anti-gaspillage
- **Carrefour/Instacart** : Pour le marketplace et la livraison (phase 2)

---

## 🎨 Identité Visuelle & Branding

### Logo & Charte Graphique
- **Logo principal :** Optimus Halal (à intégrer de manière élégante)
- **Tagline suggéré :** "Halal. Éthique. Vérifié." ou "La confiance halal en un scan"
- **Couleurs principales à explorer :**
  - Vert émeraude/jade (symbole de l'Islam, nature, éthique)
  - Blanc pur (pureté, transparence)
  - Or/doré (qualité premium, confiance)
  - Gris ardoise foncé (modernité, professionnalisme)
- **Typographie :** Moderne, lisible, professionnelle (type : Inter, SF Pro, Poppins)
- **Tone of voice :** Rassurant, expert, moderne, respectueux

### Design System
- **Style :** Moderne, épuré, "enterprise-grade"
- **UI/UX :** Intuitive, accessible, fluide
- **Inspiration design :**
  - Apple Design Guidelines (fluidité, attention aux détails)
  - Material Design 3 (composants cohérents)
  - Stripe/Revolut (clarté, confiance)

---

## 📱 Fonctionnalités Principales

### 1. 🏠 Dashboard d'Accueil
**Objectif :** Vue d'ensemble rapide et accès facile aux fonctions clés

**Composants :**
- **Hero Section :**
  - Message de bienvenue personnalisé
  - Stat du jour (ex: "142 produits scannés cette semaine")
  
- **Raccourcis Rapides :**
  - 🔍 Scanner un produit
  - 📍 Trouver un point de vente
  - 🏪 Marketplace (si activé)
  - 📊 Mon historique
  
- **Section Promotions/Actualités :**
  - Offres partenaires certifiés
  - Nouveaux produits certifiés
  - Alertes éthiques importantes
  
- **Widgets Personnalisés :**
  - Mes produits favoris
  - Points de vente à proximité
  - Suggestions basées sur l'historique

**Design Notes :**
- Cards élégantes avec ombres légères
- Icônes custom cohérentes avec la charte
- Animations fluides (micro-interactions)
- Pull-to-refresh pour actualiser

---

### 2. 🔍 Scanner de Produits (Fonctionnalité Cœur)

**Objectif :** Vérifier instantanément la certification halal et l'éthique d'un produit

**Flux Utilisateur :**
1. **Scan** : Code-barres, QR code ou photo d'étiquette
2. **Analyse** : Requête vers l'API Optimus (backend Rust + PostgreSQL)
3. **Résultat** : Fiche produit détaillée

**Écran de Résultat - Layout :**

```
┌─────────────────────────────────┐
│  [Photo Produit]                │
│  Nom du Produit                 │
│  Marque                         │
├─────────────────────────────────┤
│  🎖️ STATUT HALAL                │
│  ✅ Certifié Halal Fiable       │
│  🏛️ [Logo Certificateur]        │
│  📅 Valide jusqu'au: XX/XX/XXXX │
├─────────────────────────────────┤
│  🌿 SCORE ÉTHIQUE               │
│  ⭐⭐⭐⭐☆ 4.2/5                │
│                                 │
│  ✓ Bio                          │
│  ✓ Commerce équitable           │
│  ✓ Sans OGM                     │
│  ⚠️ Emballage plastique         │
├─────────────────────────────────┤
│  📊 COMPOSITION                 │
│  [Liste ingrédients analysés]   │
│  • Ingrédient 1 ✅              │
│  • Ingrédient 2 ✅              │
│  • Ingrédient 3 ⚠️              │
├─────────────────────────────────┤
│  🚫 ALERTES ÉTHIQUES (si)       │
│  ⛔ Marque boycottée             │
│  Raison: [Lien vers détails]    │
├─────────────────────────────────┤
│  [💚 Ajouter aux Favoris]       │
│  [📍 Où acheter ce produit?]    │
│  [⚠️ Signaler un problème]      │
└─────────────────────────────────┘
```

**États Possibles :**
- ✅ **Certifié Halal Fiable** (vert)
- ⚠️ **Certification Douteuse** (orange)
- ❌ **Non Halal / Haram** (rouge)
- ❓ **Produit Inconnu** (gris) + CTA "Demander une analyse"

**Features Avancées :**
- Historique de scans
- Comparaison de produits similaires
- Alternatives recommandées (si produit non-conforme)
- Partage sur réseaux sociaux

---

### 3. 📍 Localisation de Points de Vente

**Objectif :** Trouver où acheter des produits halal certifiés à proximité

**Fonctionnalités :**
- **Carte Interactive :**
  - Geolocalisation utilisateur
  - Pins pour boucheries, épiceries, restaurants certifiés
  - Filtres : type (boucherie, restaurant, épicerie), certifications, rayon
  
- **Liste de Points de Vente :**
  - Nom, adresse, distance
  - Note/avis utilisateurs
  - Certifications affichées
  - Horaires d'ouverture
  - Bouton "Itinéraire" (intégration Maps)
  
- **Fiche Établissement :**
  - Photos
  - Certifications halal détaillées
  - Avis clients
  - Produits disponibles
  - Contact (tél, site web)

**Design :**
- Map avec clustering pour performance
- Bottom sheet pour détails rapides
- Filtres en haut avec chips
- Animation lors du changement de vue liste/carte

---

### 4. ⚠️ Signalement & Alertes Éthiques

**Objectif :** Système communautaire de signalement (type "Boycott X")

**Fonctionnalités :**
- **Signaler un Produit/Marque :**
  - Usurpation de certification halal
  - Ingrédients suspects non déclarés
  - Pratiques non-éthiques de l'entreprise
  
- **Alertes Push :**
  - Nouveau boycott ajouté
  - Certification révoquée
  - Alerte sanitaire
  
- **Feed Actualités Éthiques :**
  - Timeline des boycotts actifs
  - Justifications et sources
  - Appel à l'action communautaire

**UI Elements :**
- Formulaire de signalement simple
- Système de modération (admin)
- Badge "Communauté vérifiée" pour utilisateurs actifs
- Section "Pourquoi ce boycott ?" avec sources

---

### 5. 🛒 Marketplace (Feature Flag - Phase 2)

**Objectif :** E-commerce de produits halal éthiques (désactivé initialement)

**Fonctionnalités Prévues :**
- Catalogue produits par catégorie
- Panier et commande
- Système de livraison (géré par Optimus à terme)
- Gestion des entrepôts/points de retrait
- Paiement sécurisé
- Suivi de commande

**Important :**
- ⚙️ **Désactivé par défaut via Feature Flag**
- Écran de teasing : "Bientôt disponible - Rejoignez la liste d'attente"
- Backend déjà prêt (API Gateway → services Rust)

**Design Placeholder :**
- Card "Marketplace - Bientôt disponible" sur le dashboard
- Animation "coming soon" élégante
- Formulaire d'inscription early access

---

## 🔧 Exigences Techniques

### Architecture Frontend
- **Framework Recommandé :**
  - React Native (cross-platform iOS/Android)
  - Expo (pour développement rapide + mises à jour OTA)
  - Alternative : Flutter (si préférence équipe)

### State Management
- Redux Toolkit ou Zustand (gestion état global)
- React Query (cache API, sync)

### Navigation
- React Navigation (stack, tabs, drawer)
- Deep linking (scan via QR externe)

### API & Backend
- **API Gateway :** `https://api-gateway-production-fce7.up.railway.app`
- **Protocole :** HTTP REST + gRPC (via gateway)
- **Authentification :** JWT tokens (HttpOnly cookies)
- **Format :** JSON

**Endpoints Principaux (exemples) :**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/products/scan?barcode=xxxxx
GET    /api/certifications/verify/:id
GET    /api/retailers/nearby?lat=XX&lng=XX
POST   /api/reports/create
GET    /api/marketplace/products (si feature activée)
```

### Feature Flags
- **Service :** Config centralisée via API ou fichier local
- **Format :**
```json
{
  "features": {
    "marketplace_enabled": false,
    "community_reports": true,
    "push_notifications": true,
    "offline_mode": false
  }
}
```
- **SDK :** LaunchDarkly, Firebase Remote Config ou custom

### Performance
- Lazy loading des images (react-native-fast-image)
- Pagination infinie (listes)
- Cache local (AsyncStorage, MMKV)
- Optimistic UI updates

### Sécurité
- Chiffrement des données sensibles
- SSL Pinning
- Biométrie (Face ID, Touch ID) pour login
- Protection contre les screenshots (données sensibles)

---

## 📐 Spécifications Design

### Écrans Principaux à Designer

#### 1. Onboarding (3 slides)
- Slide 1 : "Scannez. Vérifiez. Consommez Halal."
- Slide 2 : "Des certifications fiables et traçables"
- Slide 3 : "Éthique, Bio, Responsable"
- CTA : Créer un compte / Se connecter

#### 2. Authentification
- Login (email + password ou biométrie)
- Inscription (nom, email, password, localisation optionnelle)
- Mot de passe oublié
- OAuth (Google, Apple Sign-In)

#### 3. Dashboard (décrit ci-dessus)

#### 4. Scanner
- Vue caméra plein écran
- Overlay avec guides pour cadrer code-barres
- Bouton "Galerie" pour importer une photo
- Bouton "Historique"

#### 5. Résultat Scan (décrit ci-dessus)

#### 6. Carte Points de Vente
- Map + bottom sheet
- Filtres sticky en haut
- Transition fluide liste ↔ carte

#### 7. Profil Utilisateur
- Photo de profil
- Préférences (notifications, certifications privilégiées)
- Historique de scans
- Produits favoris
- Paramètres
- Déconnexion

#### 8. Signalement
- Formulaire simple
- Upload de preuves (photos)
- Catégories de signalement

#### 9. Actualités/Alertes
- Feed style timeline
- Cards swipeable
- Filtres (boycotts, nouveautés, alertes)

#### 10. Marketplace (coming soon)
- Splash screen "Bientôt disponible"
- Formulaire early access

### Composants Réutilisables
- **Buttons** : Primary, Secondary, Outline, Text
- **Cards** : Product, Retailer, Alert, Promo
- **Inputs** : Text, Search, Filter chips
- **Lists** : Flat, Sectioned, Infinite scroll
- **Modals** : Confirmation, Info, Error
- **Toasts** : Success, Error, Warning, Info
- **Badges** : Certification, Éthique, Boycott
- **Skeletons** : Loading states élégants

---

## 🎯 User Stories (Priorité Haute)

### US1 : Scanner un Produit
> En tant qu'utilisateur,  
> Je veux scanner le code-barres d'un produit,  
> Afin de vérifier instantanément sa certification halal et son éthique.

**Critères d'acceptation :**
- Le scan fonctionne avec codes-barres et QR codes
- Le résultat s'affiche en < 2 secondes
- Les informations sont claires et visuellement hiérarchisées
- Je peux ajouter le produit à mes favoris
- Je peux signaler une erreur

### US2 : Trouver un Point de Vente
> En tant qu'utilisateur,  
> Je veux localiser les boucheries/épiceries halal certifiées près de moi,  
> Afin de faire mes courses en toute confiance.

**Critères d'acceptation :**
- La géolocalisation est activée après autorisation
- Les points de vente sont affichés sur une carte
- Je peux filtrer par type et rayon
- Je peux voir les horaires et avis
- Je peux lancer un itinéraire vers le point de vente

### US3 : Recevoir des Alertes Éthiques
> En tant qu'utilisateur conscient,  
> Je veux être notifié des boycotts et alertes éthiques,  
> Afin d'adapter ma consommation à mes valeurs.

**Critères d'acceptation :**
- Je reçois des notifications push pour les alertes importantes
- Je peux consulter l'historique des boycotts
- Chaque alerte est sourcée et justifiée
- Je peux désactiver certaines catégories de notifications

---

## 🚀 Roadmap de Développement

### Phase 1 : MVP (Minimum Viable Product) - 8-12 semaines
**Objectif :** Application fonctionnelle avec fonctionnalités cœur

**Sprints :**
1. **Sprint 1-2 :** Design System + Onboarding + Auth
2. **Sprint 3-4 :** Scanner + Fiche Produit
3. **Sprint 5-6 :** Dashboard + Carte Points de Vente
4. **Sprint 7-8 :** Signalements + Alertes + Profil

**Livrables Phase 1 :**
- ✅ Design complet (Figma) approuvé
- ✅ App React Native fonctionnelle
- ✅ Intégration API complète
- ✅ Tests utilisateurs réalisés
- ✅ Beta testflight/playstore

### Phase 2 : Feature Flags & Marketplace - 4-6 semaines
**Objectif :** Activer le marketplace et affiner l'UX

**Sprints :**
1. **Sprint 9-10 :** Système de feature flags + Marketplace UI
2. **Sprint 11-12 :** Panier, commande, paiement

### Phase 3 : Optimisation & Scale - Continue
- Analytics (Mixpanel, Amplitude)
- A/B Testing
- Personnalisation avancée (IA)
- Gamification (badges, points)
- Programme de fidélité

---

## 📊 KPIs & Success Metrics

### Engagement
- DAU/MAU (Daily/Monthly Active Users)
- Nombre de scans par utilisateur/jour
- Taux de rétention J7, J30
- Session duration moyenne

### Impact
- Nombre de signalements communautaires
- Taux d'adoption des alertes boycott
- NPS (Net Promoter Score)

### Business (Phase 2 Marketplace)
- Taux de conversion scan → achat
- Panier moyen
- Lifetime Value (LTV)

---

## 🎨 Références Design & Inspiration

### Applications à Étudier
- **Yuka** : Scan de produits, clarté du scoring
- **Too Good To Go** : Engagement éthique, design moderne
- **Carrefour** : Marketplace alimentaire
- **Uber Eats** : Carte interactive, UX livraison
- **Nike/Adidas** : Branding fort, design premium
- **Revolut** : Clarté des données, micro-interactions

### UI Kits & Resources
- **Figma Community :** 
  - Mobile app templates (iOS & Android)
  - E-commerce kits
  - Food delivery apps
  
- **Dribbble/Behance :**
  - Rechercher : "halal app", "food scanner", "ethical shopping"

---

## 🔐 Compliance & Légal

### Mentions Légales
- RGPD (consentement, données personnelles)
- CGU/CGV
- Politique de confidentialité
- Mentions de certifications halal partenaires

### Certifications à Afficher
- AVS (A Votre Service)
- Achahada
- ARGML (Rassemblement des Grandes Mosquées de Lyon)
- [Autres organismes partenaires]

### Disclaimers
> "Optimus Halal s'appuie sur des organismes de certification reconnus. En cas de doute, vérifiez directement auprès du producteur."

---

## 📞 Points de Contact Technique

### API Documentation
- **Endpoint :** `https://api-gateway-production-fce7.up.railway.app`
- **Health Check :** `GET /health`
- **Swagger/OpenAPI :** `GET /documentation` (à vérifier)

### Architecture Backend (FYI)
- **Stack :** Rust (services gRPC) + Node.js (API Gateway)
- **Database :** PostgreSQL (Railway)
- **Cache :** Redis (Railway)
- **Services :**
  - auth-service (authentification JWT)
  - user-service (profils utilisateurs)
  - tenant-service (multi-tenancy)
  - inventory-service (produits, catalogues)
  - compliance-service (certifications halal)
  - order-service (commandes marketplace)
  - notification-service (push, email)
  - analytics-service (métriques)
  - ai-orchestrator-service (recommendations IA)

### Feature Flags Endpoint (à implémenter)
```
GET /api/config/features
Response:
{
  "marketplace_enabled": false,
  "version": "1.0.0",
  "min_version_required": "1.0.0"
}
```

---

## 📝 Livrables Attendus

### Phase Design
1. **Wireframes Low-Fi** (Figma/Sketch)
   - User flows principaux
   - Architecture de l'information
   
2. **Design System Complet**
   - Couleurs, typographies, espacements
   - Composants UI réutilisables
   - Icônes custom (format SVG)
   - Animations & micro-interactions
   
3. **Maquettes High-Fi** (Figma/Sketch)
   - Tous les écrans (light & dark mode)
   - États (loading, erreur, succès, vide)
   - Responsive (différentes tailles écrans)
   - Prototypes interactifs cliquables
   
4. **Style Guide Export**
   - Fichiers pour développeurs (JSON, code snippets)

### Phase Développement
1. **Code Source**
   - Repository Git bien structuré
   - README.md détaillé
   - Architecture modulaire (atomic design)
   
2. **Tests**
   - Tests unitaires (Jest)
   - Tests E2E (Detox/Appium)
   - Tests accessibilité
   
3. **Documentation**
   - Guide d'installation
   - API integration docs
   - Component library (Storybook optionnel)

---

## ✅ Checklist Avant Livraison

### Design
- [ ] Charte graphique respectée (logo, couleurs, typo)
- [ ] Design responsive testé sur iPhone SE, 13, 14 Pro Max
- [ ] Design responsive testé sur Android (Samsung, Pixel)
- [ ] Dark mode implémenté
- [ ] Accessibilité WCAG 2.1 AA (contraste, tailles)
- [ ] Animations fluides (60fps)
- [ ] États de chargement (skeletons)
- [ ] Gestion des erreurs UX

### Technique
- [ ] Intégration API Gateway complète
- [ ] Feature flags fonctionnels
- [ ] Authentification JWT (refresh token)
- [ ] Scanner code-barres + QR codes
- [ ] Géolocalisation + maps
- [ ] Notifications push configurées
- [ ] Cache offline (AsyncStorage)
- [ ] Sentry / Crashlytics (monitoring erreurs)
- [ ] Analytics (events trackés)
- [ ] Build iOS + Android

### Contenu
- [ ] Textes/copies rédigés (français)
- [ ] Images placeholder remplacées
- [ ] Certifications logos intégrés
- [ ] CGU/Politique confidentialité

---

## 🎁 Bonus (Nice to Have)

- **Widget iOS** : Scan rapide depuis l'écran d'accueil
- **Apple Watch** : Historique de scans, alertes
- **Siri Shortcuts** : "Hey Siri, scanne ce produit"
- **Mode Hors Ligne** : Cache des derniers scans
- **Partage Social** : "J'ai scanné X produits halal avec #OptimusHalal"
- **Gamification** : 
  - Badges (scanner bronze/argent/or)
  - Leaderboard communautaire
  - Points de fidélité
- **Mode Famille** : Gestion multi-profils (parents/enfants)
- **Intégration Calendrier** : Rappels halal Ramadan, Aïd

---

## 🤝 Collaboration & Feedback

### Process de Review
1. **Wireframes :** Review + validation par l'équipe produit
2. **Design System :** Review + ajustements itératifs
3. **Maquettes :** Review complète (tous les écrans)
4. **Prototypes :** Tests utilisateurs (5-10 personnes)
5. **Développement :** Review code (PR) + tests QA

### Outils de Collaboration
- **Design :** Figma (commentaires in-app)
- **Dev :** GitHub (issues, PRs, projects)
- **Communication :** Slack/Discord
- **Gestion Projet :** Notion, Linear ou Jira

---

## 📚 Ressources Complémentaires

### Documentation Technique
- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

### Assets
- **Icônes :** [Lucide Icons](https://lucide.dev/), [Heroicons](https://heroicons.com/)
- **Illustrations :** [unDraw](https://undraw.co/), [Storyset](https://storyset.com/)
- **Fonts :** Google Fonts (Poppins, Inter, Montserrat)

### Inspiration Halal/Islamique
- **Références Design Islamique :** 
  - Patterns géométriques
  - Calligraphie arabe moderne
  - Couleurs : vert, or, blanc cassé
  
- **Apps Similaires :**
  - Muslim Pro (UX/UI référence)
  - Zabihah (recherche restaurants halal)
  - Halal Scan (scan produits)

---

## 🚀 Let's Build Something Amazing!

Ce brief est conçu pour vous donner **toutes les clés** pour créer une application mobile **world-class**, **éthique** et **techniquement excellente**.

**Objectif final :** Faire d'Optimus Halal **LA référence** de la consommation halal éthique, avec une app qui combine :
- 🎨 Design exceptionnel
- ⚡ Performance native
- 🔐 Sécurité enterprise-grade
- 💚 Impact sociétal positif

**Contact & Questions :**  
Pour toute clarification technique ou fonctionnelle, n'hésitez pas à ouvrir une issue sur le repo GitHub ou à nous contacter directement.

---

**Version :** 1.0  
**Date :** 27 Décembre 2025  
**Auteur :** Équipe Optimus Halal / SILA ERP  
**Statut :** 📋 Ready for Development

---

*"Halal. Éthique. Vérifié. - Optimus Halal"*
