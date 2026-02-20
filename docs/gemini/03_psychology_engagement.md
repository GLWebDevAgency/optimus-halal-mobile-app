# Audit Psychologie & Engagement
**Rôle : Behavioral Psychologist & Engagement Lead**

## 1. Gamification et Boucle de Rétention
L'architecture de l'application (Historique persistant, ScanStats) et de l'interface permet d'instaurer une boucle d'engagement puissante (The Hook Model). L'utilisateur investit son temps à checker les produits, et son "Aha Moment" (la révélation de la qualité du produit) survient via des signaux colorés et haptiques.

- **Dopamine de Découverte :** Chaque scan (dans `scanner.tsx`) déclenche un état de suspense de quelques dixièmes de secondes. La réponse (Halal / Sain / Éthique) doit s'afficher non pas comme une banale page de texte, mais comme l'ouverture d'un coffre (composant *LevelUpCelebration* ou *StatusPill*).
- **Le Tableau de Bord (`index.tsx`) :** La personnalisation de la "Impact Card" ("produits évités", "score santé") est fondamentale. L'utilisateur se bat contre lui-même (amélioration de soi) et contre l'industrie (protection de sa famille).
- **Preuve Sociale Géolocalisée (La Map) :** La carte des restaurants et boucheries n'est pas juste utilitaire, c'est un outil d'appartenance à une communauté. Voir que d'autres utilisateurs interagissent avec des lieux proches certifiés crée un sentiment de réassurance et un réflexe d'utilisation quotidien (effet "Waze" ou "PLBA").

## 2. Charge Cognitive & Minimalisme
- **Aération visuelle :** L'usage d'une typographie aérée (Inter) et du Vanta Design System réduit la charge mentale. L'utilisateur peut scanner dans l'urgence des courses du supermarché sans être agressé visuellement.
- **Micro-Copywriting :** Remplacer le verbiage technique ("Pas de certification", "E120 détecté") par un langage d'action émotionnelle : "Danger éthique identifié", "Ce produit contient du carmin (E120), une alternative plus saine existe". 

## 3. Points d'Exigence Sans Compromis (Ce qu'il faut faire) :
- **Système de "Streaks" (Séries) :** Introduire un compteur de "jours consécutifs de consommation responsable". Le cerveau humain déteste briser une chaîne (Loss Aversion).
- **Recadrage Négatif/Positif :** Quand un produit est "Haram" ou "Mauvais pour la santé", proposer IMMÉDIATEMENT une alternative "Excellente" disponible dans le Marketplace ou en magasin. Transformer la frustration de l'interdiction en solution instantanée.
- **Récompenses Intermittentes :** Lors de scans répétés de très bons produits, faire scintiller le composant `PremiumGate` ou offrir un badge virtue (or/platinum). La variabilité de la récompense crée l'addiction positive.

## Conclusion Psy
L'utilisateur n'achète pas un scanner, il achète "la tranquillité d'esprit" (Peace of Mind) et une "identité de consommateur vertueux/halal". Tout le flux utilisateur doit être orienté pour conforter cette identité. Les signaux visuels doivent le rassurer et le valoriser à chaque ouverture.
