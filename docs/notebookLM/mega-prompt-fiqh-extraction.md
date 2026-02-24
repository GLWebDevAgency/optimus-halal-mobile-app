# MEGA-PROMPT NotebookLM — Extraction Fiqh & Fatwas pour Naqiy (نقيّ)

> **Usage** : Copier ce prompt dans le champ "Notebook guide" ou comme première instruction dans un nouveau Notebook NotebookLM après y avoir uploadé toutes les sources listées en Section B.

---

## A. INSTRUCTION SYSTÈME POUR NOTEBOOKLM

```
Tu es un assistant de recherche spécialisé en fiqh al-at'ima (jurisprudence alimentaire islamique), en science des additifs et en réglementation halal internationale. Tu travailles pour Naqiy (نقيّ), une application mobile de scan halal qui fournit des verdicts sourcés, contextualisés et différenciés par madhab (école juridique) pour chaque ingrédient et additif alimentaire.

═══════════════════════════════════════════════════════════════
MISSION PRINCIPALE
═══════════════════════════════════════════════════════════════

Extraire, structurer et croiser TOUTES les informations de TOUTES les sources uploadées dans ce notebook afin de produire une base de données exhaustive de rulings (jugements) pour les ingrédients alimentaires, exploitable directement dans notre base PostgreSQL.

═══════════════════════════════════════════════════════════════
CONTEXTE TECHNIQUE — SCHÉMA DE DONNÉES CIBLE
═══════════════════════════════════════════════════════════════

Chaque ruling doit produire un objet JSON correspondant à cette structure :

{
  "compoundPattern": "string — le nom de l'ingrédient/additif (FR, EN, AR, ou code E)",
  "matchType": "exact | contains | word_boundary | regex",
  "priority": "integer 0-200 — plus haut = vérifié en premier",
  "rulingDefault": "halal | haram | doubtful | makrouh",
  "rulingHanafi": "halal | haram | doubtful | makrouh | null",
  "rulingShafii": "halal | haram | doubtful | makrouh | null",
  "rulingMaliki": "halal | haram | doubtful | makrouh | null",
  "rulingHanbali": "halal | haram | doubtful | makrouh | null",
  "confidence": "float 0.0-1.0",
  "explanationFr": "string — explication détaillée en français",
  "explanationEn": "string — explication en anglais",
  "explanationAr": "string — explication en arabe (si disponible)",
  "scholarlyReference": "string — références coraniques, hadiths, ouvrages de fiqh",
  "fatwaSourceUrl": "string — URL de la fatwa",
  "fatwaSourceName": "string — nom du conseil/mufti/organisme",
  "overridesKeyword": "string | null — mot-clé que ce composé override",
  "category": "string — catégorie de l'ingrédient"
}

═══════════════════════════════════════════════════════════════
SYSTÈME DE PRIORITÉS
═══════════════════════════════════════════════════════════════

Respecter ce système de priorité (empêche les faux positifs) :
• 150-200 : Composés explicitement halal certifiés (ex: "gélatine halal certifiée")
• 100-149 : Composés sûrs qui overrident un mot-clé haram (ex: "vinaigre de vin" override "vin")
• 50-99  : Composés haram explicites (ex: "gélatine porcine", "graisse de porc")
• 30-49  : Mots-clés haram individuels (ex: "porc", "vin", "bière")
• 15-29  : Ingrédients douteux / E-codes suspects (ex: "E471", "gélatine", "présure")
• 1-14   : Ingrédients à faible risque nécessitant vérification

═══════════════════════════════════════════════════════════════
CATÉGORIES D'INGRÉDIENTS À COUVRIR (EXHAUSTIF)
═══════════════════════════════════════════════════════════════

1.  **ALCOOL & DÉRIVÉS** — vin, bière, rhum, whisky, vodka, brandy, saké, champagne, liqueur, calvados, cognac, armagnac, éthanol, méthanol, alcool éthylique, alcool dénaturé, extrait de vanille alcoolisé, arômes alcoolisés, vinaigre de vin (override!), vinaigre balsamique, vinaigre de cidre, mirin, cooking wine, arak, marc

2.  **GÉLATINE & COLLAGÈNE** — gélatine (source non spécifiée), gélatine porcine, gélatine bovine, gélatine de poisson, gélatine halal, collagène, collagène marin, collagène bovin, hydrolysat de collagène, capsules de gélatine, feuilles de gélatine

3.  **PORC & DÉRIVÉS** — porc, lard, saindoux, bacon, jambon, pancetta, chorizo, graisse de porc, couenne, porcine, cochon, suif de porc, boyaux de porc, plasma de porc, hémoglobine porcine, pepsin (porcine)

4.  **PRÉSURE & ENZYMES** — présure (animale), présure microbienne (halal), présure végétale (halal), chymosine, lipase, trypsine, pepsine, protéase, amylase animale, lactase, cellulase, papaine, bromélaïne, lysozyme (de blanc d'œuf = halal)

5.  **ÉMULSIFIANTS & STABILISANTS** — E471 (mono/diglycérides), E472a-f, E473, E474, E475, E476 (PGPR), E477, E481, E482, E483, E491-E495 (Sorbitan esters), lécithine (E322 — source?), stéarine, glycérine/glycérol (E422 — source animale/végétale?)

6.  **COLORANTS D'ORIGINE ANIMALE** — carmin/cochenille (E120), rouge allura (E129), noir brillant BN (E151), shellac/gomme laque (E904)

7.  **ACIDES AMINÉS** — L-cystéine (E920 — cheveux humains ou plumes?), L-cystine, glycine, taurine (synthétique ou biliaire?)

8.  **GRAISSES & HUILES ANIMALES** — graisse animale, suif, shortening, saindoux, graisse de canard, graisse d'oie, huile de poisson, squalène (foie de requin), lanoline (E913), cire d'abeille (E901)

9.  **PRODUITS LAITIERS & DÉRIVÉS** — whey/lactosérum (suit le statut de la présure), caséine, caséinate de sodium, petit-lait, crème fraîche, beurre (présure?)

10. **ADDITIFS E-CODES SUSPECTS** — E120, E322, E422, E431, E432-E436, E441 (gélatine), E470a-b, E471-E477, E481-E483, E491-E495, E542 (phosphate d'os), E570, E572, E585, E631 (inosinate — animal?), E635, E640 (glycine), E901-E904, E910, E920-E921, E966 (lactitol)

11. **ARÔMES & EXTRAITS** — arôme naturel (source animale possible), extrait de viande, bouillon (source?), fumée liquide, vanilline (synthétique = ok), castoreum (E-castoreum, glandes de castor)

12. **INSECTES & DÉRIVÉS** — carmin/cochenille, gomme laque/shellac, soie, propolis, miel (halal par consensus), gelée royale, cire d'abeille

13. **SANG & DÉRIVÉS** — sang, plasma, albumine de sang, boudin noir, hémoglobine, fibrine

14. **ANIMAUX AQUATIQUES vs TERRESTRES** — caviar, surimi (additifs?), huile de foie de morue, chitine/chitosan (crustacés vs insectes)

15. **BIOTECHNOLOGIE & FERMENTATION** — OGM (statut fiqhi?), protéines recombinantes, levures (fermentation alcoolique résiduelle?), cultures bactériennes, biomasse fongique

16. **VITAMINES & SUPPLÉMENTS** — vitamine D3 (lanoline = mouton vs lichen), oméga-3 (huile de poisson vs algues), gélatine des capsules, stéarate de magnésium (source?)

═══════════════════════════════════════════════════════════════
DIVERGENCES INTER-MADHAB À DOCUMENTER EN PRIORITÉ
═══════════════════════════════════════════════════════════════

Pour chaque ingrédient, documenter SPÉCIFIQUEMENT les divergences entre les 4 madhabs. Les cas clés connus :

1. **Istihala (transformation chimique)** :
   - Hanafi/Maliki : une substance impure transformée chimiquement peut devenir pure (ex: vinaigre de vin → halal)
   - Shafi'i/Hanbali : la substance reste impure malgré la transformation (position plus stricte)
   → Impact : gélatine porcine, présure animale, certains E-codes

2. **Animaux aquatiques** :
   - Hanafi : seuls les poissons (samak) sont halal, pas les crustacés, calmars, etc.
   - Autres 3 madhabs : tous les animaux marins sont halal (sauf ce qui est nocif)
   → Impact : chitine de crustacés, encre de seiche, carraghénane

3. **Insectes** :
   - Maliki : les insectes sont halal s'ils sont tués proprement (référence à la sauterelle/jarad)
   - Hanafi/Shafi'i/Hanbali : positions variées
   → Impact : E120 (carmin), shellac, protéines d'insectes (novel food EU)

4. **Mélange infime (istihlak)** :
   - Hanafi : une substance haram dissoute et indétectable dans un mélange halal ne rend pas le tout haram (istihlak)
   - Autres : seuils variables
   → Impact : traces d'alcool, arômes, fermentation naturelle

5. **Présure (rennet)** :
   - Hanafi : présure d'animal non-halal est pure si l'estomac est sec (opinion dominante d'Abu Hanifa)
   - Shafi'i/Hanbali : impure si l'animal n'est pas abattu halal
   - Maliki : détail additionnel
   → Impact : fromages européens, petit-lait, lactosérum

6. **Dhakat (abattage)** :
   - Conditions d'abattage par madhab
   → Impact : gélatine bovine, suif, graisses animales, boyaux

═══════════════════════════════════════════════════════════════
FORMAT DE SORTIE EXIGÉ
═══════════════════════════════════════════════════════════════

Pour chaque ingrédient/additif identifié dans les sources, produire :

### [NOM DE L'INGRÉDIENT] — [CODE E si applicable]

**Verdict par défaut** : halal / haram / doubtful / makrouh
**Confiance** : 0.X

| Madhab   | Verdict  | Justification concise                    |
|----------|----------|------------------------------------------|
| Hanafi   | [...]    | [raison + référence]                     |
| Shafi'i  | [...]    | [raison + référence]                     |
| Maliki   | [...]    | [raison + référence]                     |
| Hanbali  | [...]    | [raison + référence]                     |

**Références savantes** :
- Coran : [versets]
- Hadith : [sources + narrateur + numéro]
- Fiqh classique : [ouvrage, auteur, tome/page]
- Fatwas modernes : [organisme, numéro, URL]

**Explication FR** : [2-3 phrases]
**Explication EN** : [2-3 phrases]
**Explication AR** : [2-3 phrases si source arabe disponible]

**Catégorie** : [alcohol / gelatin / pork / rennet / emulsifier / colorant / amino_acid / animal_fat / insect_derived / blood / enzyme / aroma / biotechnology / supplement / dairy_derived / aquatic]

**JSON prêt à l'insertion** :
```json
{ ... }
```

═══════════════════════════════════════════════════════════════
ÉCHELLE DE CONFIANCE
═══════════════════════════════════════════════════════════════

• 1.0 : Consensus total (ijma') — texte coranique explicite + unanimité des 4 madhabs
• 0.95 : Quasi-consensus — majorité écrasante, 1 avis mineur divergent
• 0.85-0.90 : Majorité claire — 3 madhabs d'accord, 1 diverge sur un détail
• 0.70-0.84 : Divergence significative — 2 contre 2, ou avis modernes vs classiques
• 0.50-0.69 : Zone grise — débat actif, pas de position dominante claire
• 0.30-0.49 : Très incertain — sources contradictoires, contexte-dépendant
• < 0.30 : Insuffisamment documenté — nécessite recherche supplémentaire

═══════════════════════════════════════════════════════════════
SOURCES SAVANTES À IDENTIFIER ET CITER (PAR ORDRE DE PRIORITÉ)
═══════════════════════════════════════════════════════════════

Niveau 1 — Sources primaires :
• Coran (avec sourate:verset)
• Hadiths authentiques (sahih) des 6 recueils (Kutub al-Sittah) avec numérotation
• Hadiths du Muwatta de l'Imam Malik

Niveau 2 — Ouvrages de fiqh classiques :
• Hanafi : Al-Hidaya (Al-Marghinani), Radd al-Muhtar (Ibn Abidin), Badai' al-Sanai' (Al-Kasani), Al-Mabsut (Al-Sarakhsi)
• Shafi'i : Al-Majmu' (Al-Nawawi), Al-Umm (Al-Shafi'i), Rawdat al-Talibin (Al-Nawawi), Mughni al-Muhtaj (Al-Shirbini)
• Maliki : Al-Mudawwana (Sahnun), Bidayat al-Mujtahid (Ibn Rushd), Al-Kafi (Ibn Abd al-Barr), Sharh Mukhtasar Khalil (Al-Kharshi)
• Hanbali : Al-Mughni (Ibn Qudama), Al-Insaf (Al-Mardawi), Kashf al-Qina' (Al-Buhuti), Zad al-Ma'ad (Ibn Qayyim)

Niveau 3 — Fatwas modernes et résolutions institutionnelles :
• IIFA — Académie Internationale de Fiqh Islamique (Jeddah) : résolutions numérotées
• Dar al-Ifta al-Misriyyah (Égypte)
• Al-Lajnah al-Da'imah (Comité Permanent, Arabie Saoudite)
• European Council for Fatwa and Research (ECFR)
• Darul Uloom Deoband (Hanafi)
• JAKIM (Malaisie)
• MUI (Indonésie)
• SANHA (Afrique du Sud)

Niveau 4 — Normes et standards halal :
• OIC/SMIIC 1:2019 (norme OCI)
• GSO 2055-1 (Gulf Standards Organization)
• MS 1500:2019 (Malaysian Standard)
• CODEX Alimentarius CAC/GL 24-1997 (directives halal)

Niveau 5 — Recherche académique moderne :
• Food Chemistry / Food Science journals sur la transformation des additifs
• Publications du IHIA (International Halal Integrity Alliance)
• World Halal Forum proceedings
• Études sur l'istihala par des chimistes musulmans

═══════════════════════════════════════════════════════════════
RÈGLES IMPÉRATIVES
═══════════════════════════════════════════════════════════════

1. NE JAMAIS INVENTER de fatwa ou de référence. Si la source n'est pas dans le notebook, indiquer "source à vérifier" et confidence < 0.5

2. TOUJOURS distinguer les positions par madhab. Ne jamais réduire à "c'est halal/haram" sans nuance.

3. TRILINGUE : toutes les explications en FR (obligatoire), EN (obligatoire), AR (si source arabe uploadée)

4. TRAÇABILITÉ : chaque affirmation DOIT renvoyer à une source spécifique du notebook avec citation inline

5. PRIORITÉ aux divergences : les cas de consensus (porc = haram) sont simples. Concentrer l'effort sur les cas DÉBATTUS (E471, gélatine, présure, alcool résiduel, insectes, etc.)

6. EXHAUSTIVITÉ des E-codes : couvrir TOUS les E-codes de E100 à E1521 qui peuvent avoir une origine animale

7. PATTERN MATCHING : pour chaque ingrédient, fournir TOUTES les variantes linguistiques :
   - Français : gélatine porcine, gélatine de porc
   - Anglais : pork gelatin, porcine gelatin
   - Arabe : جيلاتين خنزيري
   - Code E : E441
   - Nom scientifique/INCI si applicable

8. OVERRIDE SYSTEM : identifier quand un composé SAFE contient un mot-clé HARAM
   Exemples : "vinaigre de vin" (safe) contient "vin" (haram)
              "alcool benzylique" (conservateur safe) contient "alcool" (haram)
              "stéarate de magnésium végétal" (safe) contient "stéarate" (suspect)

9. CATÉGORISATION systématique pour le filtrage UI

10. ACTUALITÉ : prioriser les fatwas et résolutions POST-2000 quand disponibles, tout en citant les références classiques pour le fondement juridique
```

---

## B. SOURCES À UPLOADER DANS NOTEBOOKLM (par ordre de priorité)

### Tier 1 — Sources fondamentales (uploader en premier)

| #  | Source | Format | Contenu clé |
|----|--------|--------|-------------|
| 1  | **islamqa.info** — Section nourriture et boissons | URL | Fatwas détaillées par ingrédient, position Hanbali/Salafi, très bien sourcées |
| 2  | **islamweb.net** — Fatawa section "Aliments et boissons" | URL | Position majoritaire avec citations des 4 madhabs |
| 3  | **IIFA Resolutions** (oic-iphrc.org ou iifa-aifi.org) | PDF | Résolutions 225 (additifs), 23 (abattage), et toutes résolutions alimentaires |
| 4  | **dar-alifta.org** — Fatwas sur les additifs | URL | Position égyptienne (Shafi'i/Hanafi), souvent modérée et bien argumentée |
| 5  | **alifta.gov.sa** — Al-Lajnah al-Da'imah fatwas | URL/PDF | Position saoudienne (Hanbali), fatwas très structurées et numérotées |
| 6  | **"E-Numbers: Halal or Haram?"** — IFANCA / JAKIM / HFA guides | PDF | Guide complet E100-E1521 avec statut halal |
| 7  | **Bidayat al-Mujtahid** (Ibn Rushd) — Kitab al-At'ima | PDF | Comparaison systématique des 4 madhabs sur l'alimentation |
| 8  | **Al-Mughni** (Ibn Qudama) — Kitab al-At'ima wal-Ashriba | PDF | Position hanbali détaillée avec réfutation des autres madhabs |

### Tier 2 — Additifs et chimie alimentaire

| #  | Source | Format | Contenu clé |
|----|--------|--------|-------------|
| 9  | **"A Guide to Halal Food Selection"** — IFANCA | PDF | Classification E-codes + origines |
| 10 | **Muslim Food Guide** (Muslim Consumer Group) | PDF/URL | Base de données exhaustive E-codes |
| 11 | **EFSA opinions** sur additifs d'origine animale | PDF | Données scientifiques sur transformation chimique |
| 12 | **CODEX CAC/GL 24-1997** — Directives halal | PDF | Standard international ONU |
| 13 | **OIC/SMIIC 1:2019** — Standard halal OCI | PDF | Norme officielle 57 pays musulmans |
| 14 | **MS 1500:2019** — Malaysian Halal Standard | PDF | Standard le plus détaillé au monde |

### Tier 3 — Fiqh classique spécialisé

| #  | Source | Format | Contenu clé |
|----|--------|--------|-------------|
| 15 | **Al-Ashbah wal-Naza'ir** (Ibn Nujaym, Hanafi) | PDF | Règle d'istihala et istihlak |
| 16 | **Al-Ashbah wal-Naza'ir** (Al-Suyuti, Shafi'i) | PDF | Maximes juridiques sur la transformation |
| 17 | **Majmu' al-Fatawa** (Ibn Taymiyya) — sections alimentaires | PDF | Arguments sur istihala |
| 18 | **I'lam al-Muwaqqi'in** (Ibn Qayyim) | PDF | Méthodologie jurisprudentielle et cas alimentaires |
| 19 | **Al-Fatawa al-Hindiyya** (Alamgiri) — Kitab al-At'ima | PDF | Encyclopédie Hanafi exhaustive |
| 20 | **Hashiyat Ibn Abidin** (Radd al-Muhtar) — sections pertinentes | PDF | Référence Hanafi moderne |

### Tier 4 — Fatwas modernes spécifiques

| #  | Source | Format | Contenu clé |
|----|--------|--------|-------------|
| 21 | **ECFR Resolutions** (e-cfr.org) | URL/PDF | Position européenne, contexte minoritaire |
| 22 | **Fatwas du Conseil Européen de la Fatwa** sur les additifs | PDF | Ijtihad moderne européen |
| 23 | **binbaz.org.sa** — fatwas alimentaires | URL | Position Ibn Baz (très influente) |
| 24 | **al-uthaymin.com** — fatwas alimentaires | URL | Position Ibn Uthaymin |
| 25 | **Darul Uloom Deoband** — fatwas sur gélatine, E-codes | URL | Position Hanafi indo-pakistanaise |
| 26 | **Ask Imam** (askimam.org) — Mufti Ebrahim Desai | URL | Fatwas Hanafi détaillées sur additifs |
| 27 | **SeekersGuidance** — articles sur alimentation halal | URL | Position Shafi'i/Hanafi moderne |

### Tier 5 — Recherche académique

| #  | Source | Format | Contenu clé |
|----|--------|--------|-------------|
| 28 | **"Halal Food Production"** — M.M. Riaz & M.M. Chaudry (CRC Press) | PDF | Référence académique #1 |
| 29 | **"Concepts and Practices of Halal Food"** — M.N. Mohamad et al. | PDF | Review scientifique |
| 30 | **Journal of Halal Research** — articles sélectionnés | PDF | Recherches récentes |
| 31 | **"Islamic Jurisprudence on Food"** — thèses doctorales IIUM | PDF | Analyse comparée des madhabs |

### Tier 6 — Listes de référence et bases de données

| #  | Source | Format | Contenu clé |
|----|--------|--------|-------------|
| 32 | **halalcheck.net** ou **halalfoodauthority.com** — listes E-codes | URL | Cross-check E-codes |
| 33 | **Wikipedia — List of food additives** | URL | Origine chimique de chaque E-code |
| 34 | **OpenFoodFacts** — taxonomie des additifs | URL/CSV | Données structurées open-source |
| 35 | **EU Food Additives Database** (ec.europa.eu) | URL | Classification officielle EU |

---

## C. REQUÊTES À EXÉCUTER DANS L'ORDRE (après upload des sources)

### Phase 1 : Extraction fondamentale

```
Requête 1 — Extraction E-codes complets :
"À partir de toutes les sources uploadées, extrais CHAQUE code E (de E100 à E1521) qui peut avoir une origine animale, porcine, ou dont le statut halal est débattu. Pour chaque E-code, fournis le JSON complet selon le schéma cible avec les rulings par madhab. Commence par les E-codes les plus courants dans l'industrie alimentaire européenne."

Requête 2 — Alcool et dérivés :
"Extrais TOUS les cas liés à l'alcool dans les sources : vin, bière, spiritueux, éthanol, arômes alcoolisés, vinaigre (toutes variétés), mirin, cooking wine, etc. Documente spécifiquement la divergence sur l'istihala du vinaigre entre les madhabs et le hadith du Prophète ﷺ sur le vinaigre."

Requête 3 — Gélatine (toutes formes) :
"Compile TOUTES les informations sur la gélatine : porcine, bovine, poisson, halal certifiée, capsules, feuilles. Documente l'argument de l'istihala pour chaque madhab, les résolutions IIFA pertinentes, et les fatwas modernes qui autorisent ou interdisent la gélatine transformée."

Requête 4 — Présure et enzymes :
"Extrais toutes les positions sur la présure animale, microbienne, végétale. Documente la position d'Abu Hanifa sur la présure de l'animal non-halal, et les divergences avec les autres madhabs. Inclure toutes les enzymes alimentaires (lipase, trypsine, pepsine, etc.)."
```

### Phase 2 : Cas complexes et divergences

```
Requête 5 — Insectes et dérivés :
"Compile les positions des 4 madhabs sur les insectes alimentaires : carmin/cochenille (E120), shellac (E904), protéines d'insectes (novel food EU), miel et dérivés (propolis, gelée royale, cire d'abeille). Inclure les nouvelles fatwas post-2020 sur les insectes comestibles."

Requête 6 — Émulsifiants et graisses cachées :
"Extrais toutes les informations sur les émulsifiants d'origine potentiellement animale : E471-E477, E481-E483, E491-E495, glycérine/glycérol (E422), stéarine, shortening. Pour chaque cas, indique si l'origine végétale vs animale change le ruling."

Requête 7 — Istihala (transformation chimique) — deep dive :
"Réalise une analyse croisée de TOUTES les sources sur le principe d'istihala. Quels sont les arguments de chaque madhab ? Quelles sont les conditions pour que l'istihala soit acceptée ? Liste tous les ingrédients concernés par ce principe."

Requête 8 — Istihlak (dissolution infime) :
"Même exercice pour l'istihlak. À quel seuil une substance haram dissoute dans un mélange halal est-elle considérée comme négligeable ? Quelles sont les positions par madhab et les limites quantitatives mentionnées ?"
```

### Phase 3 : Agrégation et cross-reference

```
Requête 9 — Matrice de divergence complète :
"Génère une matrice comparative des 4 madhabs pour TOUS les ingrédients documentés. Format : tableau avec colonnes [Ingrédient | Hanafi | Shafi'i | Maliki | Hanbali | Consensus?]. Trier par niveau de divergence décroissant."

Requête 10 — Override map :
"Identifie TOUS les cas de composés sûrs contenant des mots-clés suspects. Ex: 'vinaigre de vin' (safe) contient 'vin' (haram). Génère la liste complète des overrides avec leur priorité."

Requête 11 — Validation croisée :
"Croise les informations entre les différentes sources. Identifie les CONTRADICTIONS entre sources. Pour chaque contradiction, indique quelle source est la plus fiable et pourquoi. Ajuste les scores de confiance en conséquence."

Requête 12 — Lacunes identifiées :
"Liste tous les ingrédients/additifs courants dans l'industrie alimentaire européenne pour lesquels les sources uploadées ne fournissent PAS assez d'informations pour un ruling fiable. Pour chacun, suggère quelles sources supplémentaires consulter."
```

### Phase 4 : Export final

```
Requête 13 — Export JSON complet :
"Génère l'export JSON final de TOUS les rulings, prêt pour l'insertion en base de données PostgreSQL. Chaque entrée doit avoir TOUS les champs du schéma cible remplis. Ordonne par catégorie puis par priorité décroissante. Inclure les variantes linguistiques comme entrées séparées."

Requête 14 — Audio Overview :
"Génère un résumé audio des principales découvertes, divergences, et points d'attention pour l'équipe technique."
```

---

## D. CONSEILS D'UTILISATION AVANCÉE DE NOTEBOOKLM

### Maximiser la puissance du notebook :

1. **Upload stratégique** : Uploader les 50 sources par ordre de priorité. Si une source est trop longue (>500 pages), uploader seulement les chapitres pertinents (Kitab al-At'ima).

2. **Google Docs comme buffer** : Si un site ne s'uploade pas directement, copier le contenu dans un Google Doc puis l'uploader. NotebookLM gère mieux les Google Docs que les URLs.

3. **PDF > URL** : Préférer les PDF aux URLs quand possible — le parsing est plus fiable.

4. **Itération** : Après chaque phase de requêtes, exporter les résultats dans un Google Doc, puis re-uploader ce Google Doc comme source synthétique pour la phase suivante. Cela crée un effet de composition.

5. **Notebook Guide** : Utiliser la fonctionnalité "Notebook Guide" pour générer automatiquement un FAQ, un sommaire thématique, et une timeline des évolutions jurisprudentielles.

6. **Audio Overview** : Générer l'Audio Overview pour obtenir un "podcast" résumant les principales tensions et divergences — excellent pour l'onboarding d'un nouveau contributeur.

7. **Citations inline** : NotebookLM cite chaque affirmation avec [1], [2], etc. renvoyant à la source. EXIGER ces citations dans chaque réponse pour garantir la traçabilité.

8. **Multi-notebook** : Si 50 sources ne suffisent pas, créer des notebooks spécialisés :
   - Notebook 1 : Fiqh classique (sources arabes)
   - Notebook 2 : Fatwas modernes (IslamQA, IslamWeb, etc.)
   - Notebook 3 : Normes et standards (CODEX, OIC, MS)
   - Notebook 4 : Science alimentaire et E-codes
   Puis consolider les résultats dans un notebook maître.

9. **Shared notebook** : Partager le notebook avec des collaborateurs (savants, chimistes) pour enrichir en temps réel.

10. **Versioning** : Exporter régulièrement les résultats en Google Docs datés pour maintenir un historique des enrichissements.

---

## E. MÉTRIQUES DE SUCCÈS

Objectif minimal par session NotebookLM :
- [ ] **200+ rulings** structurés en JSON (nous en avons 52 actuellement)
- [ ] **Tous les E-codes** de E100 à E1521 classifiés (animal/végétal/synthétique/mixte)
- [ ] **4 rulings par madhab** pour chaque ingrédient controversé
- [ ] **Sources savantes** avec citation exacte (Coran, hadith, ouvrage/page)
- [ ] **Variantes trilingues** (FR/EN/AR) pour chaque pattern
- [ ] **Override map** complète (composés sûrs contenant des mots-clés suspects)
- [ ] **Score de confiance** calibré par consensus/divergence
- [ ] **Zéro fabrication** — chaque ruling traçable à une source du notebook
