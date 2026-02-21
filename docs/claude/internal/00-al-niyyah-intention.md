# 00 — Al-Niyyah : L'Intention Fondatrice

> "Innama al-a'malu bin-niyyat" — Les actes ne valent que par leurs intentions.
> — Hadith rapporte par Al-Bukhari et Muslim

---

## Pourquoi ce projet existe

Optimus Halal nait d'un constat simple et douloureux : le musulman francophone qui fait ses courses est seul.

Seul devant un rayon de supermarche ou les emballages mentent par omission. Seul face a un E471 dont il ne sait pas s'il est d'origine animale ou vegetale. Seul face a un "certifie halal" dont il ne connait pas la valeur reelle du certificat. Seul face a une boucherie qui affiche "halal" sans qu'aucune autorite independante n'ait jamais verifie.

Cette solitude a un cout spirituel. Elle genere de l'anxiete permanente, du doute qui ronge, et parfois du renoncement : "Je ne sais plus quoi manger, alors j'arrete de chercher." Ce renoncement est une defaite — pas celle du consommateur, mais celle d'un ecosysteme qui a echoue a servir sa communaute.

**Optimus Halal existe pour mettre fin a cette solitude.**

---

## La Niyyah comme filtre de decision

Chaque decision produit, technique, commerciale ou communicationnelle doit passer par ce filtre :

### Ce que nous sommes

| Principe | Application concrete |
|----------|---------------------|
| **Un outil de transparence** | Nous revealons des informations verifiables. Nous citons nos sources. Nous affichons nos niveaux de confiance. |
| **Un serviteur de la communaute** | L'app existe pour aider, pas pour juger. Chaque ecran, chaque interaction doit apporter de la valeur a l'utilisateur. |
| **Un pont entre le savoir et l'action** | Nous transformons des donnees brutes (ingredients, certifications, avis de savants) en decisions claires et personnalisees. |
| **Un catalyseur de confiance** | Nous aidons les bons commerces a etre trouves et les bons produits a etre choisis. Le ranking recompense l'exigence. |

### Ce que nous ne sommes PAS

| Interdit | Raison | Garde-fou technique |
|----------|--------|-------------------|
| **Nous ne sommes pas des muftis** | Nous n'emettons pas de fatwas. Nous presentons les avis existants des ecoles reconnues. | L'UI affiche toujours "selon l'ecole X" et jamais "c'est halal/haram" de maniere absolue quand il y a divergence. |
| **Nous ne sommes pas des juges** | Nous ne condamnons pas les commerces ou les marques. Nous presentons des faits. | Pas de "blacklist". Le mot "haram" n'apparait jamais seul — toujours avec un contexte et une source. |
| **Nous ne sommes pas un outil de culpabilisation** | L'app ne doit JAMAIS generer plus d'anxiete qu'elle n'en resout. | Chaque ecran "negatif" (produit douteux) est suivi d'alternatives positives. La gamification recompense l'effort, pas la perfection. |
| **Nous ne sommes pas a vendre** | Aucun commerce, aucune marque, aucun organisme ne peut acheter son statut halal sur la plateforme. | Le `relevanceScore` est algorithmique (distance, certification, avis, fraicheur). Aucun champ `boostPaid` n'existe et n'existera jamais. |
| **Nous ne sommes pas un outil de division** | Les divergences entre madhabs sont presentees avec respect. Aucune ecole n'est superieure a une autre. | L'interface propose un filtre par madhab, pas un classement. Les 4 ecoles ont la meme place dans l'UI. |

---

## Le Test de la Niyyah

Avant chaque feature, chaque design, chaque choix business, poser ces trois questions :

1. **Est-ce que cette decision aide le musulman a mieux pratiquer sa foi ?**
   - Si oui → on avance.
   - Si non mais c'est neutre → on evalue le cout/benefice.
   - Si non et c'est nuisible → on refuse, meme si c'est rentable.

2. **Est-ce que je serais a l'aise d'expliquer cette decision devant Allah ?**
   - Ce test elimine les raccourcis ethiques. Pas de dark patterns "pour la retention". Pas de notifications anxiogenes "pour l'engagement". Pas de faux sentiment d'urgence "pour la conversion".

3. **Est-ce que cette decision renforce ou affaiblit la confiance de la communaute ?**
   - La confiance est le seul actif qui compte. Tout le reste — les metrics, le CA, le nombre d'utilisateurs — decoule de la confiance. Perdre la confiance = perdre tout.

---

## La Hierarchie des Valeurs

Quand deux objectifs entrent en conflit, cette hierarchie tranche :

```
1. Verite et transparence (Al-Sidq)
   └── On ne ment jamais, meme par omission. Si on ne sait pas, on dit "incertain".

2. Protection de l'utilisateur (Al-Hifdh)
   └── La securite des donnees, la vie privee, et le bien-etre psychologique priment sur tout.

3. Service de la communaute (Al-Khidmah)
   └── L'app existe pour servir, pas pour extraire. Chaque interaction doit laisser l'utilisateur mieux qu'avant.

4. Excellence du produit (Al-Itqan)
   └── Faire bien les choses parce qu'Allah aime celui qui, quand il fait quelque chose, le fait avec excellence.

5. Viabilite economique (Al-Rizq)
   └── L'entreprise doit survivre pour continuer a servir. Mais le revenu est une consequence, jamais un objectif premier.
```

**Exemple concret** : Si une feature premium (niveau 5) entre en conflit avec la transparence (niveau 1), la transparence gagne. C'est pourquoi le statut halal d'un produit sera TOUJOURS gratuit — meme si le mettre derriere un paywall triplerait le revenu.

---

## Bismillah

Ce document est ecrit avec la conscience que chaque ligne de code est un acte. Que chaque pixel affiche porte une responsabilite. Que chaque donnee stockee est un depot de confiance.

Nous commencons par Bismillah, et nous avançons avec tawakkul — en mettant tout notre effort dans l'excellence, et en remettant le resultat a Allah.

> "Attache d'abord ton chameau, puis place ta confiance en Allah."
> — Hadith rapporte par At-Tirmidhi
