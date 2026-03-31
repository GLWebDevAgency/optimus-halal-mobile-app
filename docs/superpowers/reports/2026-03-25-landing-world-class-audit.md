# Audit World-Class de la Landing `/web`

Date: 2026-03-25
Benchmark: mix world-class consumer tech
Référentiel implicite: Apple pour l'exigence visuelle, Netflix pour la netteté du produit et du funnel, top SaaS consumer pour la conversion et la mesure

## Verdict exécutif

**Note globale: 5.4 / 10**

La landing actuelle est **ambitieuse, premium dans l'intention, proprement codée et visuellement au-dessus de la moyenne d'un produit early-stage**, mais elle n'est **pas du tout au niveau Apple / Netflix / top 1 mondial** aujourd'hui.

Le plus gros problème n'est pas le goût visuel de base. Le plus gros problème est l'**écart entre ambition premium et rigueur d'exécution**:

- le first paint masque une grande partie du message et dégrade immédiatement l'impact
- les CTA principaux ne sont pas branchés
- plusieurs preuves produit paraissent encore simulées ou placeholder
- la version mobile ne livre pas un above-the-fold flagship
- l'architecture de preuve, de confiance et de mesure n'est pas au niveau world-class

En une phrase:

> **C'est une landing de très bon niveau indie premium, pas une landing de catégorie mondiale.**

Estimation du niveau actuel vs cible world-class:

- direction artistique: environ **65%** de la cible
- crédibilité produit / preuve / conversion: environ **35%**
- rigueur premium globale: environ **30-40%**

## Ce qui impressionne déjà

- Palette de marque chaude et identifiable, avec une vraie personnalité visuelle.
- Intention premium claire: sticky phone, lumière dorée, motion, halo, glass, grain, profondeur.
- Copy globalement habitée, avec une tonalité émotionnelle cohérente avec la promesse de protection familiale.
- Socle SEO technique déjà en place: metadata, Open Graph, JSON-LD, sitemap, robots, manifest.
- Build production et lint passent, donc la base n'est pas bricolée.

## Ce qui bloque immédiatement le niveau top mondial

- **Hero et sections SSR cachés au chargement**: la landing ne livre pas son message avec violence et clarté dès la première impression.
- **CTA critiques non fonctionnels**: plusieurs liens de téléchargement pointent encore vers `#`.
- **Preuve produit insuffisamment crédible**: écrans avec emoji, placeholder d'image, carte abstraite, faux QR code.
- **Preuve business / confiance / mesure incomplète**: pas d'analytics, pas de pipeline de mesure, pas de preuve sociale lourde.
- **Narration un peu dispersée**: la landing veut à la fois vendre le scan, la carte, le trust score, le futur marketplace et la monétisation.

## Scorecard

| Axe | Score | Niveau world-class attendu | Écart concret | Impact | Sévérité |
| --- | --- | --- | --- | --- | --- |
| Direction artistique / identité visuelle | 7.3/10 | Signature visuelle immédiatement iconique et ultra maîtrisée | Belle base, mais encore plus “premium startup” que “marque mondiale” | Perception de marque | P1 |
| Hero et impact above-the-fold | 3.2/10 | Message et désir immédiats au first paint | Le hero arrive masqué, flou, incomplet au rendu initial | Conversion + désirabilité | P0 |
| Motion / animations / effets | 5.8/10 | Motion au service du sens, jamais au détriment de la lecture | Trop d'effets initiaux cachent le contenu au lieu de le magnifier | Compréhension + premium feel | P1 |
| Qualité et crédibilité des screens produit | 4.1/10 | Screens irréprochables, photo-réalistes, crédibles | Placeholders, emoji, map abstraite, faux QR | Trust produit | P0 |
| Version mobile / responsive | 4.8/10 | Mobile flagship, dense, claire, désirante dès le haut de page | Above-the-fold faible, CTA mobile différé, composition peu agressive | Conversion mobile | P0 |
| Architecture des sections / storytelling | 6.1/10 | Récit hyper focalisé, sans dilution | Histoire intéressante mais un peu éclatée entre scan, carte, trust score, marketplace | Clarté stratégique | P1 |
| Copywriting / psychologie / confiance | 6.5/10 | Preuve dure + émotion + autorité | Bonne émotion, preuve encore trop légère ou auto-déclarée | Confiance + persuasion | P1 |
| Pricing / offre / perception de valeur | 5.5/10 | Offre évidente, légitime, aspirante | Le pricing ressemble davantage à un soutien qu'à une offre premium irrésistible | Monétisation | P1 |
| SEO technique / métadonnées / schema | 7.1/10 | Base technique excellente + assets sociaux forts | Fondations solides, mais pas encore “elite SEO asset system” | Acquisition organique | P2 |
| Readiness Google / analytics | 2.0/10 | GA4 + events + console + mesure funnel | Aucune instrumentation visible dans le repo | Pilotage business | P1 |
| Image de marque / cohérence premium | 6.2/10 | Marque perçue comme inévitable, massive, sûre d'elle | Très bonne intention, mais plusieurs détails cassent l'illusion | Aura de marque | P1 |

## Audit chirurgical

### 1. Hero et first paint: principal point de rupture

Le plus gros problème de la landing est ici.

- Les wrappers d'animation rendent le contenu initial en état caché: `opacity: 0`, `blur`, translation et `rotateX`. Voir `web/src/components/animations/animate-in.tsx` et `web/src/components/animations/split-text.tsx`.
- En pratique, le H1, les badges, plusieurs paragraphes et blocs de preuve existent dans le HTML mais arrivent **invisibles au premier rendu SSR**.
- Sur une landing world-class, le premier écran doit déjà vendre avant que le moindre observer, scroll ou animation n'entre en jeu.

Conséquence:

- sur capture desktop prod, la hero paraît sous-exploitée et partiellement vide
- sur mobile, l'impact initial est encore plus faible
- la page ressemble davantage à une démo motion en attente qu'à une machine de conviction

Preuves techniques:

- `web/src/components/animations/animate-in.tsx`
- `web/src/components/animations/split-text.tsx`
- `web/src/components/layout/sections/hero.tsx`

### 2. Motion: ambitieux, mais trop souvent avant la clarté

Le problème n'est pas “il y a trop d'animation” au sens quantitatif. Le problème est qu'une partie de la motion intervient **avant la preuve**.

Points observés:

- `SplitText` est appliqué à beaucoup de titres, avec un reveal lettre par lettre.
- `AnimateIn` masque par défaut les éléments.
- `SmoothScroll` active Lenis + Snap, ce qui ajoute un comportement fort à l'expérience.
- le pricing ajoute `TiltCard` et `CursorGlow`, donc encore une couche d'interaction décorative.

Le résultat:

- sophistication perçue: oui
- autorité et netteté premium: non, pas encore

Une marque Apple-grade cache rarement son message principal derrière plusieurs couches de reveal. Elle le montre d'abord, puis l'enrichit.

Preuves techniques:

- `web/src/components/animations/smooth-scroll.tsx`
- `web/src/components/animations/tilt-card.tsx`
- `web/src/components/animations/cursor-glow.tsx`
- `web/src/components/layout/sections/pricing.tsx`

### 3. CTA et friction: plusieurs dead ends cassent la crédibilité

Le niveau world-class s'arrête instantanément quand les CTA premium ne mènent nulle part.

Constats:

- CTA desktop navbar: `href="#"`.
- CTA mobile navbar: `href="#"`.
- CTA hero principal: `href="#"`.
- CTA mobile sticky bar: `href="#"`.
- CTA app stores dans le bloc final: `href="#"`.
- le formulaire “Me prévenir” affiche un champ email et un bouton, mais sans wiring visible.

Impact:

- perte de confiance immédiate
- sentiment de landing “mockée”
- baisse mécanique de conversion

C'est du **P0 business et crédibilité**.

Preuves techniques:

- `web/src/components/layout/navbar.tsx`
- `web/src/components/layout/mobile-cta-bar.tsx`
- `web/src/components/layout/sections/hero.tsx`
- `web/src/components/layout/sections/cta-download.tsx`
- `web/src/components/layout/sections/coming-soon-section.tsx`

### 4. Les screens produit: beau cadre, crédibilité insuffisante

Le concept du téléphone sticky est fort. Le problème est le contenu du téléphone.

Ce qui fonctionne:

- bon travail sur la frame, la profondeur, les ombres, le sentiment de device
- cohérence chromatique correcte
- plusieurs écrans ont une vraie intention UI

Ce qui casse le niveau mondial:

- écran résultat scan: image produit encore simulée avec emoji `🍫`
- écran restaurant: image hero encore simulée avec emoji `🍽️`
- carte: map encore abstraite, pas crédible comme vraie expérience cartographique premium
- QR final: ce n'est pas un vrai QR, c'est juste une icône

À ce niveau d'exigence, **la moindre preuve fake est toxique**. Une landing Apple/Netflix-grade ne triche pas sur ses preuves visuelles.

Preuves techniques:

- `web/src/components/phone/screens/scan-result-screen.tsx`
- `web/src/components/phone/screens/restaurant-screen.tsx`
- `web/src/components/phone/screens/map-screen.tsx`
- `web/src/components/layout/sections/cta-download.tsx`

### 5. Mobile: pas encore flagship

La landing a clairement été pensée desktop-first dans sa théâtralité.

Problèmes mobile observés:

- la barre CTA mobile est volontairement cachée en haut de scroll
- le hero perd en lisibilité et en densité persuasive
- la mise en scène sticky phone est moins impressionnante et moins utile
- la page dépend trop du mouvement pour révéler sa valeur

Un site world-class mobile doit gagner dans les **2 premières secondes**, écran fixe, thumb-zone, sans indulgence.

Preuves techniques:

- `web/src/components/layout/mobile-cta-bar.tsx`
- `web/src/components/phone/landing-phone-orchestrator.tsx`
- capture prod mobile: `/private/tmp/naqiy-mobile.png`

### 6. Storytelling et structure: bonne base, focus encore imparfait

Le funnel a une logique:

1. problème
2. scan
3. compréhension
4. score
5. personnalisation
6. carte
7. commerce
8. futur marketplace
9. pricing
10. CTA final

Le problème est que la page veut défendre trop de batailles à la fois:

- app de scan halal
- moteur de décryptage ingrédients
- système de scoring certifieurs
- carte et adresses vérifiées
- futur marketplace
- offre premium

Résultat:

- la proposition est riche
- la proposition n'est pas encore chirurgicale

Le bloc `ComingSoon` ouvre en plus une nouvelle promesse marketplace avant que la promesse cœur soit devenue irrésistible.

Preuves techniques:

- `web/src/components/phone/landing-phone-orchestrator.tsx`
- `web/src/components/layout/sections/coming-soon-section.tsx`

### 7. Copywriting, communication, psychologie

Le ton est bon. Il y a de la conviction, de la protection, du foyer, du sérieux, du halal + tayyib.

Forces:

- langage simple et émotionnel
- promesse familiale forte
- bon usage des anxiétés réelles: doute, ingrédients, confiance, déplacement inutile

Faiblesses:

- certaines promesses restent auto-déclarées et pas assez “prouvées”
- `Propulsé par l'IA` est un signal faible, presque générique
- les chiffres sont présents mais pas encore transformés en preuve lourde
- absence de témoignages, avis, presse, capture App Store, notation, démonstration comparative, ou preuves externes fortes

Le copy est meilleur que la moyenne. Il n'est pas encore adossé à une **architecture de preuve mondiale**.

Preuves techniques:

- `web/src/components/layout/sections/social-proof.tsx`
- `web/src/components/layout/sections/hero.tsx`

### 8. Pricing: honnête, mais pas encore irrésistible

Le pricing a une qualité morale:

- gratuit réellement mis en avant
- ton indépendant, sans pub ni revente de données
- positionnement communauté utile

Mais world-class n'est pas juste “moral”. World-class, c'est aussi **désirabilité + évidence + framing**.

Ce qui manque:

- raison premium plus désirable que “soutenir le projet”
- démonstration nette du saut de valeur entre gratuit et Naqiy+
- preuve que `2,99€` est une évidence économique
- structure d'offre plus forte: essai, annuel, économie, preuve d'usage, bénéfices exclusifs plus distincts

Aujourd'hui, l'offre payante ressemble plus à un **soutien vertueux** qu'à une **offre premium impossible à refuser**.

Preuves techniques:

- `web/src/components/layout/sections/pricing.tsx`

### 9. SEO technique: bon socle, pas encore excellence éditoriale/sociale

Le socle est sain:

- title, description, keywords, canonical, Open Graph, Twitter
- robots
- sitemap
- manifest
- JSON-LD `MobileApplication`

Mais à exigence world-class, il manque encore:

- asset social plus fort: l'OG actuel est trop centré logo, pas assez produit / bénéfice / scène de valeur
- pas de vraie stratégie d'instrumentation SEO + search insight
- cohérence internationale incomplète: `lang="fr"` côté page, mais `inLanguage: ["fr", "en", "ar"]` côté JSON-LD sans alternates/hreflang réels visibles

Verdict:

- techniquement sérieux
- pas encore stratégiquement “elite”

Preuves techniques:

- `web/src/app/layout.tsx`
- `web/src/app/manifest.ts`
- `web/src/app/sitemap.ts`
- `web/src/app/robots.ts`
- `web/public/og-image.png`

### 10. Google / analytics readiness: angle mort majeur

Je n'ai trouvé aucune instrumentation visible de type:

- GA4 / gtag
- GTM
- PostHog
- Mixpanel
- Plausible
- Clarity
- Hotjar

Conséquence:

- impossible de mesurer le funnel réel
- impossible d'optimiser mobile vs desktop proprement
- impossible de savoir quels blocs travaillent vraiment
- impossible de piloter un niveau world-class de manière disciplinée

Ce n'est pas un problème de “beauté”. C'est un problème de **maturité produit-business**.

## Teardown section par section

### Hero

- Belle direction visuelle.
- Architecture left/right intéressante.
- Mais le hero n'écrase pas l'écran avec une promesse visible immédiatement.
- Le dual-store CTA fusionné n'est pas premium.
- La zone de texte paraît trop dépendante de l'animation pour exister.

### Scan

- Bonne entrée dans l'usage réel.
- Simple, utile, claire.
- Mais la densité de preuve reste légère par rapport au poids de la promesse.

### Résultat scan

- Bonne intention de clarté et de vitesse.
- Le concept “3 secondes. Zéro doute.” est fort.
- Mais la crédibilité dépend trop du mockup, encore imparfait.

### Analysis

- Très bon terrain émotionnel et éducatif.
- La citation religieuse ajoute une profondeur culturelle cohérente.
- Attention toutefois à garder un ton d'autorité moderne et pas seulement “moral”.

### NaqiyScore

- Très bon différenciateur produit.
- Probablement l'un des meilleurs blocs conceptuellement.
- Doit devenir une preuve intellectuelle irréfutable, pas seulement une feature de marque.

### Social proof / personnalisation

- Bonne extension de la promesse individuelle.
- Mais il manque des preuves externes: usages, notes, verbatims, validation marché.

### Map / restaurant

- Bonne ouverture de périmètre.
- Mais la mise en scène des écrans ne soutient pas encore la promesse “je peux faire confiance”.

### Coming soon

- Beau terrain d'expansion stratégique.
- Mauvais timing relatif pour une landing qui doit d'abord vendre l'existant.

### Pricing

- Honnête et humain.
- Pas encore assez fort comme machine de monétisation premium.

### CTA final

- Émotionnellement bon.
- Techniquement, la preuve s'effondre avec le faux QR et les liens morts.

## Top 10 écarts à traiter

1. **Contenu marketing masqué au rendu initial SSR**
   Impact: destruction du first impression premium, surtout sur hero.

2. **CTA de téléchargement non branchés**
   Impact: casse immédiate de la confiance et de la conversion.

3. **Mockups produit avec placeholders / emoji / simulation visible**
   Impact: baisse de crédibilité produit et marque.

4. **Faux QR code dans le CTA final**
   Impact: signal anti-premium et anti-trust.

5. **Mobile above-the-fold trop faible**
   Impact: perte forte sur le trafic majoritaire probable.

6. **Architecture de preuve insuffisante**
   Impact: promesse forte mais pas assez validée par preuves externes.

7. **Motion trop défensive vis-à-vis de la clarté**
   Impact: expérience perçue comme plus “démo” que “marque souveraine”.

8. **Pricing trop “soutien” et pas assez “offre premium”**
   Impact: affaiblissement du désir et de la monétisation.

9. **Bloc marketplace trop tôt dans le récit**
   Impact: dilution du focus produit principal.

10. **Absence d'analytics / instrumentation**
   Impact: impossibilité de piloter le passage au niveau world-class.

## Conclusion franche

Si l'objectif est réellement “niveau Apple / Netflix / numéro 1 mondial”, alors le verdict est simple:

**la landing a le goût, mais pas encore la discipline d'exécution.**

Elle montre:

- une vraie ambition esthétique
- une bonne base de narration
- un produit potentiellement très fort

Mais elle échoue encore sur les éléments qui séparent le premium du world-class:

- brutalité de clarté au first paint
- véracité absolue des preuves
- rigueur des CTA
- souveraineté mobile
- architecture de confiance
- pilotage par la mesure

Le chantier prioritaire n'est pas “faire plus joli”.

Le chantier prioritaire est:

> **faire paraître Naqiy inévitable, crédible, immédiatement compréhensible et irréprochable dans les preuves.**


Refonte Landing V1.5 — Clarté, Waitlist, Preuve, Mesure
Résumé
Objectif: transformer la landing /web d’une vitrine “indie premium” en une landing beaucoup plus crédible, mesurable et conversion-first, sans refaire la marque, mais en changeant profondément l’expérience.

La première vague sera une quasi-refonte orientée business:

hero et first paint totalement clarifiés
tous les CTA “Télécharger” redirigés vers une vraie waitlist
écrans app refaits en replicas ultra crédibles, sans placeholder
mobile repensé comme surface prioritaire
PostHog web intégré dès cette vague
marketplace conservé, mais repoussé tout en bas comme ouverture secondaire
Changements clés
1. Recomposer la landing autour d’un récit plus court et plus net
Nouvel ordre narratif:

Hero conversion-first
Preuve de valeur immédiate du scan
Décryptage / sources / NaqiyScore
Carte et commerces de confiance
Pricing repensé
Waitlist principale
Marketplace teaser secondaire
Footer
Décisions:

supprimer le rôle “section héroïque” du marketplace dans le milieu du funnel
fusionner ou condenser les sections redondantes pour éviter la sensation “trop de batailles à la fois”
garder le téléphone sticky, mais l’aligner sur 4 preuves produit majeures: accueil, scan, résultat, carte/resto
2. Corriger le first paint et redéfinir la motion
AnimateIn et SplitText ne doivent plus cacher le contenu critique au SSR. Hero, sous-titre, CTA primaire, preuve principale et pricing headline doivent être visibles dès le HTML initial.
Les animations restent, mais passent d’un rôle de révélation à un rôle d’accent.
Conserver Lenis si le rendu reste premium, mais retirer le snapping de section sur la landing pour retrouver une lecture plus souveraine, surtout sur mobile.
Réserver les effets décoratifs lourds (SplitText caractère par caractère, tilt, cursor glow) aux éléments secondaires ou desktop-only.
3. Refaire les preuves produit et les CTA
Remplacer les écrans “placeholder” par des replicas ultra crédibles: aucun emoji, aucune fausse photo, aucun faux QR.
Créer des assets locaux dédiés pour la landing (web/public/images/landing/...) afin d’éviter toute dépendance runtime à des fetch externes.
Tous les CTA “Télécharger” convergent vers une même action waitlist:
ouverture de section dédiée ou scroll vers formulaire principal
message cohérent “rejoins la liste / sois prévenu du lancement”
même tracking, même copy, même état de succès
Le bloc QR est remplacé par une vraie preuve utile: waitlist, store coming soon, ou badge de disponibilité, mais pas une icône déguisée en QR.
4. Ajouter un vrai flux waitlist et la mesure web
Nouveau flux public:

ajouter un routeur tRPC public côté backend, par exemple lead.joinWaitlist
ajouter une table dédiée, par exemple waitlist_leads, avec au minimum:
email normalisé et unique
source
locale
utm_source, utm_medium, utm_campaign, utm_content, utm_term
consent_at
created_at
réponse API: created ou existing, sans erreur bruyante sur doublon
envoi email via Brevo en non-bloquant si configuré, sinon persistance seule
Mesure web:

intégrer PostHog côté web, aligné sur le host EU déjà utilisé sur mobile
nouveaux env vars publics:
NEXT_PUBLIC_POSTHOG_API_KEY
NEXT_PUBLIC_POSTHOG_HOST
pas de session replay en V1
capturer au minimum:
landing_view
hero_primary_cta_clicked
pricing_cta_clicked
waitlist_started
waitlist_submitted
waitlist_already_exists
marketplace_teaser_clicked
scroll_depth_25/50/75/100
enregistrer les UTM comme super properties de session
5. Repositionner copy, trust et pricing
Hero: promesse plus frontale, moins décorative, plus immédiatement utile.
Supprimer ou affaiblir les signaux génériques type “Propulsé par l’IA” si aucune preuve dure ne les soutient.
Renforcer les preuves existantes avec ce qui est réellement défendable: critères NaqiyScore, certifieurs couverts, logique de sources, bénéfices familiaux.
Pricing: déplacer le framing de “soutenir le projet” vers “gagner en contrôle, personnalisation et sérénité”, tout en gardant le ton indépendant.
Marketplace: teaser final seulement, lié à la waitlist, sans brouiller la promesse cœur du scan.
APIs / interfaces / types à ajouter
Nouveau routeur backend public: lead.joinWaitlist(input) -> { status: "created" | "existing" }
Nouveau schéma DB: waitlist_leads
Nouveau provider web analytics PostHog + hook/helper de tracking
Nouveau contrat frontend pour le formulaire waitlist:
email
source
locale
utm*
consent
Plan de test
SSR / first paint:
le hero principal est lisible sans JS et sans scroll
aucune headline critique ne sort en opacity: 0
CTA:
tous les CTA majeurs mènent vers la waitlist, aucun href="#" restant
succès, erreur validation et doublon sont gérés proprement
Waitlist backend:
email invalide refusé
email valide créé
second submit même email retourne existing
UTM et source sont persistés
Analytics:
PostHog s’initialise seulement si clé présente
les événements critiques se déclenchent une seule fois par action
Mobile:
hero convaincant sur 390px de large sans dépendre d’animations tardives
CTA accessible sans attendre une grande profondeur de scroll
Preuves visuelles:
zéro emoji / zéro faux QR / zéro placeholder dans les écrans landing
Vérification finale:
pnpm build et pnpm lint sur web
tests backend ciblés pour le routeur waitlist
Assumptions et choix verrouillés
les stores ne sont pas encore la destination principale des CTA web; la V1.5 convertit vers une waitlist mesurable
PostHog web est retenu pour cohérence avec le mobile
les écrans landing restent des replicas React, mais refaits pour devenir crédibles
le marketplace reste dans la landing, mais uniquement comme sujet secondaire en bas de page
la palette Naqiy actuelle est conservée; on ne fait pas de rebrand complet dans cette vague