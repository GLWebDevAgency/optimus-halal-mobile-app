# Audit Sales, Marketing & Conversion
**Rôle : Head of Growth & Conversion Rate Optimizer (CRO)**

## 1. Analyse de l'Entonnoir de Conversion (Onboarding -> Marketplace)
Actuellement, l'application possède les briques pour monétiser son audience, mais il manque le **"Glu" Marketing** qui transforme un utilisateur gratuit en acheteur ou ambassadeur militant.
- **Onboarding (`app/(onboarding)`)** : L'introduction animée est belle, mais elle doit mieux vendre le "Pourquoi". Pourquoi Optimus Halal ? Insister sur l'exclusion d'additifs toxiques et le vrai Halal certifié.
- **Le Marketplace (`app/(marketplace)`)** : Il est actuellement "caché" derrière un Feature Flag ou un onglet. C'est une erreur de stratégie retail. Le marketplace doit venir à l'utilisateur organiquement.

## 2. Stratégies de Rétention et d'Acquisition (Referral)
Les applications de classe mondiale atteignent leur taille critique grâce à une viralité intrinsèque (Growth Loop).
- **Le Levier "Influenceur" (La Map Star) :** Exploiter la carte intégrée (Mapbox) pour des partenariats massifs sur Instagram/TikTok. Les influenceurs Food/Lifestyle ne diront plus "Lien dans la bio", mais "Retrouvez ce resto certifié sur la Map Optimus". Créer un système de "Curated lists" (ex: "Le top 5 de @InfluenceurX").
- **Le Partage de Scan (Viralité) :** Si l'utilisateur scanne un produit ultra-toxique ou un produit avec un faux logo Halal, il DOIT avoir un bouton massif "Alerter mes proches (WhatsApp/Instagram)". L'image partagée (générée nativement) doit devenir un mini-flyer publicitaire pour l'application.
- **Sécurisation B2B (Annuaires) :** Proposer un abonnement premium SaaS aux boucheries et restaurants locaux pour obtenir une épingle dorée ("Vanta Gold") sur la carte, augmentant leur visibilité avec bouton d'appel/itinéraire prioritaire.
- **Micro-Copywriting de Vente :** Dans le profil utilisateur ou le tableau de bord, utiliser des termes exclusifs ("Club Optimus", "Statut Gardien") pour favoriser l'achat in-app ou l'abonnement futur.

## 3. Points d'Exigence Sans Compromis (Ce qu'il faut faire) :
- **Refonte de la Home (`index.tsx`) pour la Social Discovery :** Bien que le design actuel soit très qualitatif, l'accès à la Map des restaurants n'est qu'un simple bouton (Quick Action). Une "Feature Star" doit transpirer dès la première page. Solution : Ajouter une section "À découvrir autour de vous" sous forme de carrousel de "StoreCards" ou un composant Map interactif simplifié montrant les pins locaux en direct, avant même de rentrer dans l'onglet Map.
- **Cross-Selling Contextuel :** Lorsqu'un utilisateur scanne un "Jus de Fruit X" mal noté (Haram ou plein de sucre), une petite bannière très élégante (composant `PremiumGate` ou `GlowCard`) doit s'afficher : *"Voici 3 alternatives saines & Halal pour votre famille (+ bouton 'Commander sur le Market')"*.
- **Preuve Sociale (Social Proof) :** Sur les fiches produits, afficher *"Acheté 124 fois par la communauté ce mois-ci"*. La pression sociale positive augmente le taux d'ajout au panier de 30% en moyenne.
- **Magic Link Auth :** Pour l'inscription (Signup), supprimer toute friction. Le One-Tap Login (Apple/Google) ou le Magic Link Auth (déjà envisagé dans vos docs) doit être la seule porte d'entrée. 

## Conclusion Marketing
L'application doit passer du statut d'"Outil de Scan" au statut de "Place de Marché de Confiance". La clé est le cross-selling contextuel. L'utilisateur vient pour une information (le scan), il doit repartir avec une solution (un achat ou un favori sauvegardé).
