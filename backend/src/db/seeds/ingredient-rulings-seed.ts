/**
 * Ingredient Rulings Seed Data
 *
 * Comprehensive, scholarly-sourced halal rulings for ingredient detection.
 * Each entry has been researched from authoritative Islamic sources:
 *   - islamqa.info (Sheikh Salih al-Munajjid)
 *   - islamweb.net (Qatari Fatwa Center)
 *   - alifta.gov.sa (Saudi Permanent Committee)
 *   - binbaz.org.sa (Sheikh Abdul-Aziz ibn Baz)
 *   - dar-alifta.org (Egyptian Dar al-Ifta)
 *   - IIFA/Jeddah (International Islamic Fiqh Academy)
 *
 * Priority system:
 *   100+ = Safe compounds (override keywords)
 *   50-99 = Haram/doubtful compounds
 *   1-49  = Individual keywords
 */

import type { NewIngredientRuling } from "../schema/ingredient-rulings.js";

export const ingredientRulingsSeed: NewIngredientRuling[] = [
  // ═══════════════════════════════════════════════════════════════
  // SAFE COMPOUNDS (priority 100+) — override keyword matches
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "vinaigre de vin",
    matchType: "contains",
    priority: 110,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "halal",
    confidence: 0.6,
    explanationFr:
      "Le vinaigre de vin est sujet à divergence savante. L'istihala (transformation chimique complète du vin en vinaigre) est acceptée par les Hanafites. Les Hanbalites suivent Ibn Uthaymeen (halal si produit par des non-musulmans). Les Chafiites et Malikites considèrent le vinaigre délibérément produit à partir de vin comme douteux.",
    explanationEn:
      "Wine vinegar is subject to scholarly disagreement. Istihala (complete chemical transformation) is accepted by Hanafis. Hanbalis follow Ibn Uthaymeen (halal if produced by non-Muslims). Shafi'is and Malikis consider deliberately produced wine vinegar doubtful.",
    scholarlyReference:
      "Muslim 2051, Abu Dawud 3675, Ibn Uthaymeen Ash-Sharh al-Mumti', Majmoo' al-Fataawa 21/483",
    fatwaSourceUrl: "https://islamqa.info/en/answers/276185",
    fatwaSourceName: "IslamQA #276185, #191176",
    overridesKeyword: "vin",
    category: "vinegar",
  },
  {
    compoundPattern: "vinaigre",
    matchType: "word_boundary",
    priority: 105,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.95,
    explanationFr:
      "Le vinaigre (sans précision) est halal par consensus. Le Prophète ﷺ a dit : « Quel bon condiment que le vinaigre ! » (Muslim 2051). La transformation naturelle du vin en vinaigre (istihala) est acceptée par toutes les écoles.",
    explanationEn:
      "Vinegar (unspecified) is halal by consensus. The Prophet ﷺ said: 'What a good condiment vinegar is!' (Muslim 2051). Natural transformation from wine to vinegar (istihala) is accepted by all schools.",
    scholarlyReference: "Sahih Muslim 2051, 2052",
    fatwaSourceUrl: "https://islamqa.info/en/answers/2283",
    fatwaSourceName: "IslamQA #2283",
    overridesKeyword: "vin",
    category: "vinegar",
  },
  {
    compoundPattern: "vinegar",
    matchType: "word_boundary",
    priority: 105,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.95,
    explanationFr:
      "Le vinaigre est halal par consensus des quatre écoles. Hadith : « Quel bon condiment que le vinaigre ! » (Muslim 2051).",
    explanationEn:
      "Vinegar is halal by consensus of all four schools. Hadith: 'What a good condiment vinegar is!' (Muslim 2051).",
    scholarlyReference: "Sahih Muslim 2051",
    fatwaSourceUrl: "https://islamqa.info/en/answers/2283",
    fatwaSourceName: "IslamQA #2283",
    overridesKeyword: "wine",
    category: "vinegar",
  },
  {
    compoundPattern: "wine vinegar",
    matchType: "contains",
    priority: 110,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "halal",
    confidence: 0.6,
    explanationFr:
      "Vinaigre de vin : divergence savante sur le vinaigre produit délibérément à partir de vin. Hanafites : halal (istihala). Hanbalites : halal (Ibn Uthaymeen). Chafiites/Malikites : douteux.",
    explanationEn:
      "Wine vinegar: scholarly disagreement on vinegar deliberately produced from wine. Hanafi: halal (istihala). Hanbali: halal (Ibn Uthaymeen). Shafi'i/Maliki: doubtful.",
    scholarlyReference:
      "Muslim 2051, Abu Dawud 3675, Ibn Uthaymeen Ash-Sharh al-Mumti'",
    fatwaSourceUrl: "https://islamqa.info/en/answers/276185",
    fatwaSourceName: "IslamQA #276185",
    overridesKeyword: "wine",
    category: "vinegar",
  },
  {
    compoundPattern: "gélatine bovine halal",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.98,
    explanationFr:
      "Gélatine bovine certifiée halal (abattage rituel) : halal par consensus unanime des quatre écoles.",
    explanationEn:
      "Halal-certified bovine gelatin (ritual slaughter): halal by unanimous consensus of all four schools.",
    scholarlyReference: "IslamQA Fatwa 219137, IslamWeb Fatwa 86671",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    overridesKeyword: "gélatine",
    category: "gelatin",
  },
  {
    compoundPattern: "gélatine de poisson",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.97,
    explanationFr:
      "Gélatine de poisson : halal par consensus. Les poissons n'exigent pas d'abattage rituel (Coran 5:96, Abu Dawud : « Deux morts nous sont licites : le poisson et la sauterelle »).",
    explanationEn:
      "Fish gelatin: halal by consensus. Fish do not require ritual slaughter (Quran 5:96, Abu Dawud: 'Two dead things are lawful for us: fish and locusts').",
    scholarlyReference: "Coran 5:96, Sunan Abu Dawud, Ibn Majah",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    overridesKeyword: "gélatine",
    category: "gelatin",
  },
  {
    compoundPattern: "fish gelatin",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.97,
    explanationFr:
      "Gélatine de poisson : halal par consensus unanime.",
    explanationEn:
      "Fish gelatin: halal by unanimous consensus.",
    scholarlyReference: "Quran 5:96",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    overridesKeyword: "gelatin",
    category: "gelatin",
  },
  {
    compoundPattern: "halal gelatin",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.98,
    explanationFr:
      "Gélatine certifiée halal : halal par consensus.",
    explanationEn:
      "Halal-certified gelatin: halal by consensus.",
    scholarlyReference: "IslamQA Fatwa 219137",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    overridesKeyword: "gelatin",
    category: "gelatin",
  },
  {
    compoundPattern: "présure microbienne",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.97,
    explanationFr:
      "Présure microbienne (produite par fermentation fongique/bactérienne) : halal par consensus. Source non-animale.",
    explanationEn:
      "Microbial rennet (produced by fungal/bacterial fermentation): halal by consensus. Non-animal source.",
    scholarlyReference: "IIFA Resolution 210, IslamQA #115306",
    fatwaSourceUrl: "https://islamqa.info/en/answers/115306",
    fatwaSourceName: "IslamQA #115306",
    overridesKeyword: "présure",
    category: "rennet",
  },
  {
    compoundPattern: "microbial rennet",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.97,
    explanationFr: "Présure microbienne : halal par consensus.",
    explanationEn: "Microbial rennet: halal by consensus.",
    scholarlyReference: "IIFA Resolution 210",
    fatwaSourceUrl: "https://iifa-aifi.org/en/33099.html",
    fatwaSourceName: "IIFA Resolution 210",
    overridesKeyword: "rennet",
    category: "rennet",
  },
  {
    compoundPattern: "vegetable rennet",
    matchType: "contains",
    priority: 100,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "halal",
    rulingMaliki: "halal",
    rulingHanbali: "halal",
    confidence: 0.98,
    explanationFr: "Présure végétale : halal par consensus.",
    explanationEn: "Vegetable rennet: halal by consensus.",
    scholarlyReference: "Consensus savant",
    fatwaSourceUrl: "https://islamqa.info/en/answers/115306",
    fatwaSourceName: "IslamQA #115306",
    overridesKeyword: "rennet",
    category: "rennet",
  },
  {
    compoundPattern: "graisse de canard",
    matchType: "contains",
    priority: 100,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "Le canard est un animal halal, mais la graisse commerciale provient généralement d'un abattage non-rituel. Le statut dépend de la méthode d'abattage. Si certifié halal : halal. Sinon : douteux (l'animal est mayta).",
    explanationEn:
      "Duck is a halal animal, but commercial duck fat usually comes from non-ritual slaughter. Status depends on slaughter method. If halal-certified: halal. Otherwise: doubtful (the animal is mayta).",
    scholarlyReference: "IslamQA #169813",
    fatwaSourceUrl: "https://islamqa.info/en/answers/169813",
    fatwaSourceName: "IslamQA #169813",
    overridesKeyword: "lard",
    category: "animal_fat",
  },
  {
    compoundPattern: "graisse d'oie",
    matchType: "contains",
    priority: 100,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "L'oie est un animal halal, mais la graisse commerciale provient généralement d'un abattage non-rituel. Douteux sauf certification halal.",
    explanationEn:
      "Goose is a halal animal, but commercial goose fat usually comes from non-ritual slaughter. Doubtful unless halal-certified.",
    scholarlyReference: "IslamQA #169813, analogie avec le canard",
    fatwaSourceUrl: "https://islamqa.info/en/answers/169813",
    fatwaSourceName: "IslamQA #169813",
    overridesKeyword: "lard",
    category: "animal_fat",
  },

  // ═══════════════════════════════════════════════════════════════
  // HARAM COMPOUNDS (priority 50-99) — specific combinations
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "gélatine porcine",
    matchType: "contains",
    priority: 90,
    rulingDefault: "haram",
    rulingHanafi: "doubtful",
    rulingShafii: "haram",
    rulingMaliki: "doubtful",
    rulingHanbali: "haram",
    confidence: 0.88,
    explanationFr:
      "Gélatine dérivée du porc. Haram selon la majorité (Chafiites, Hanbalites, Comité permanent saoudien). Les Hanafites et Malikites considèrent l'istihala (transformation chimique) comme potentiellement purificatrice, rendant le statut « douteux » plutôt que catégoriquement haram. Le Dar al-Ifta égyptien la déclare halal via istihala. L'IIFA a différé sa décision (Résolution 210).",
    explanationEn:
      "Pork-derived gelatin. Haram per majority (Shafi'i, Hanbali, Saudi Permanent Committee). Hanafis and Malikis consider istihala (chemical transformation) as potentially purifying, making status 'doubtful' rather than categorically haram. Egyptian Dar al-Ifta declares it halal via istihala. IIFA deferred (Resolution 210).",
    scholarlyReference:
      "Coran 6:145, Bukhari 2236, IIFA Resolution 210, IslamQA #219137, Dar al-Ifta #6891",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137, IIFA Resolution 210, Dar al-Ifta #6891",
    overridesKeyword: "gélatine",
    category: "gelatin",
  },
  {
    compoundPattern: "pork gelatin",
    matchType: "contains",
    priority: 90,
    rulingDefault: "haram",
    rulingHanafi: "doubtful",
    rulingShafii: "haram",
    rulingMaliki: "doubtful",
    rulingHanbali: "haram",
    confidence: 0.88,
    explanationFr:
      "Gélatine porcine : haram selon la majorité, douteux pour Hanafites/Malikites (istihala).",
    explanationEn:
      "Pork gelatin: haram per majority, doubtful for Hanafis/Malikis (istihala).",
    scholarlyReference: "IslamQA #219137, IIFA Resolution 210",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    overridesKeyword: "gelatin",
    category: "gelatin",
  },
  {
    compoundPattern: "gélatine de porc",
    matchType: "contains",
    priority: 90,
    rulingDefault: "haram",
    rulingHanafi: "doubtful",
    rulingShafii: "haram",
    rulingMaliki: "doubtful",
    rulingHanbali: "haram",
    confidence: 0.88,
    explanationFr:
      "Gélatine de porc : haram selon la majorité, douteux pour Hanafites/Malikites (istihala).",
    explanationEn:
      "Pork gelatin: haram per majority, doubtful for Hanafis/Malikis (istihala).",
    scholarlyReference: "IslamQA #219137",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    overridesKeyword: "gélatine",
    category: "gelatin",
  },
  {
    compoundPattern: "graisse de porc",
    matchType: "contains",
    priority: 90,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Graisse de porc : haram par consensus unanime (ijma'). « لحم الخنزير » dans le Coran (6:145) couvre toutes les parties du porc, y compris la graisse. Al-Qurtubi rapporte le consensus de la Oumma.",
    explanationEn:
      "Pork fat: haram by unanimous consensus (ijma'). 'Lahm al-khinzir' in the Quran (6:145) covers all parts of the pig including fat. Al-Qurtubi reports community consensus.",
    scholarlyReference:
      "Coran 6:145, Bukhari 2236, Muslim 1581a, Ibn Hazm al-Muhalla, Ibn Baz Fatwa 19486",
    fatwaSourceUrl: "https://binbaz.org.sa/fatwas/19486",
    fatwaSourceName: "Ibn Baz Fatwa 19486, IslamQA #356223",
    category: "pork",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — PORK (priority 30-40)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "porc",
    matchType: "word_boundary",
    priority: 40,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Le porc est interdit par le Coran en 4 versets (2:173, 5:3, 6:145, 16:115). Le terme « rijs » (souillure) en 6:145 vise l'animal entier. Ijma' sur l'interdiction de toutes les parties : viande, graisse, os, peau, moelle. Ibn Hazm (al-Muhalla) le confirme explicitement.",
    explanationEn:
      "Pork is prohibited by the Quran in 4 verses (2:173, 5:3, 6:145, 16:115). The term 'rijs' (abomination) in 6:145 refers to the entire animal. Ijma' on prohibition of all parts: meat, fat, bone, skin, marrow. Ibn Hazm (al-Muhalla) confirms explicitly.",
    scholarlyReference:
      "Coran 2:173, 5:3, 6:145, 16:115, Bukhari 2236, Muslim 1581a, Ibn Hazm al-Muhalla",
    fatwaSourceUrl: "https://islamweb.net/en/fatwa/131651",
    fatwaSourceName: "IslamWeb #131651",
    category: "pork",
  },
  {
    compoundPattern: "pork",
    matchType: "word_boundary",
    priority: 40,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Porc : haram par le Coran (4 versets) et consensus unanime des savants.",
    explanationEn:
      "Pork: haram by the Quran (4 verses) and unanimous scholarly consensus.",
    scholarlyReference: "Quran 2:173, 5:3, 6:145, 16:115",
    fatwaSourceUrl: "https://islamweb.net/en/fatwa/131651",
    fatwaSourceName: "IslamWeb #131651",
    category: "pork",
  },
  {
    compoundPattern: "lard",
    matchType: "word_boundary",
    priority: 38,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Le lard (saindoux) est la graisse fondue de porc. Haram par consensus unanime. Al-Qurtubi rapporte l'ijma' sur l'interdiction de la graisse de porc.",
    explanationEn:
      "Lard is rendered pork fat. Haram by unanimous consensus. Al-Qurtubi reports ijma' on prohibition of pork fat.",
    scholarlyReference:
      "Coran 6:145, Ibn Baz Fatwa 19486, Dar al-Ifta #7516",
    fatwaSourceUrl: "https://www.dar-alifta.org/en/fatwa/details/7516",
    fatwaSourceName: "Dar al-Ifta #7516, Ibn Baz #19486",
    category: "pork",
  },
  {
    compoundPattern: "saindoux",
    matchType: "word_boundary",
    priority: 38,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Saindoux = graisse de porc fondue. Haram par consensus unanime des quatre écoles.",
    explanationEn:
      "Saindoux = rendered pork fat. Haram by unanimous consensus of all four schools.",
    scholarlyReference: "Coran 6:145, Ibn Baz Fatwa 19486",
    fatwaSourceUrl: "https://binbaz.org.sa/fatwas/19486",
    fatwaSourceName: "Ibn Baz #19486",
    category: "pork",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — GELATIN (priority 20-30)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "gelatin",
    matchType: "word_boundary",
    priority: 25,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.6,
    explanationFr:
      "Gélatine (source non précisée) : douteux. Peut être d'origine porcine, bovine, ou de poisson. En l'absence de précision, le statut est douteux. Vérifier la certification halal ou la source.",
    explanationEn:
      "Gelatin (source unspecified): doubtful. May be pork, bovine, or fish-derived. Without specification, status is doubtful. Check halal certification or source.",
    scholarlyReference:
      "IslamQA #219137, IslamWeb #86671, IIFA Resolution 210",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    category: "gelatin",
  },
  {
    compoundPattern: "gélatine",
    matchType: "word_boundary",
    priority: 25,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.6,
    explanationFr:
      "Gélatine (source non précisée) : douteux. L'origine (porc, bovin, poisson) détermine le statut halal. Vérifier la source ou la certification.",
    explanationEn:
      "Gelatin (unspecified source): doubtful. The origin (pork, bovine, fish) determines halal status. Check source or certification.",
    scholarlyReference: "IslamQA #219137",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    category: "gelatin",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — ALCOHOL (priority 20-35)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "vin",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Le vin (khamr) est interdit par le Coran (5:90-91) : « Le vin, le jeu de hasard, les pierres dressées et les flèches divinatoires sont une abomination, une œuvre du Diable. Écartez-vous-en ! » Consensus unanime de tous les savants depuis 14 siècles.",
    explanationEn:
      "Wine (khamr) is prohibited by the Quran (5:90-91): 'Intoxicants, gambling, stone altars and divining arrows are an abomination from the work of Satan. So avoid them.' Unanimous consensus of all scholars for 14 centuries.",
    scholarlyReference:
      "Coran 5:90-91, Muslim 2003a, Abu Dawud 3681, Tirmidhi 1295",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "wine",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Vin : haram par le Coran (5:90-91) et consensus unanime.",
    explanationEn:
      "Wine: haram by the Quran (5:90-91) and unanimous consensus.",
    scholarlyReference: "Quran 5:90-91, Muslim 2003a",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "alcool",
    matchType: "word_boundary",
    priority: 28,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.95,
    explanationFr:
      "L'alcool (éthanol) comme ingrédient est haram. Le Prophète ﷺ a dit : « Tout enivrant est khamr et tout khamr est haram » (Muslim 2003a). « Ce qui enivre en grande quantité est haram en petite quantité » (Abu Dawud 3681).",
    explanationEn:
      "Alcohol (ethanol) as an ingredient is haram. The Prophet ﷺ said: 'Every intoxicant is khamr and every khamr is haram' (Muslim 2003a). 'What intoxicates in large quantities is haram in small quantities' (Abu Dawud 3681).",
    scholarlyReference: "Muslim 2003a, Abu Dawud 3681, Tirmidhi 1865",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "alcohol",
    matchType: "word_boundary",
    priority: 28,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.95,
    explanationFr: "Alcool : haram. « Tout enivrant est khamr » (Muslim 2003a).",
    explanationEn:
      "Alcohol: haram. 'Every intoxicant is khamr' (Muslim 2003a).",
    scholarlyReference: "Muslim 2003a, Abu Dawud 3681",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "ethanol",
    matchType: "word_boundary",
    priority: 26,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.9,
    explanationFr:
      "Éthanol : substance active de l'alcool. Haram comme ingrédient. Note : les traces naturelles d'éthanol dans le pain, les fruits mûrs (<0.5%) résultant de fermentation naturelle sont halal selon l'IIFA (Résolution 225).",
    explanationEn:
      "Ethanol: the active substance in alcohol. Haram as an ingredient. Note: natural traces of ethanol in bread, ripe fruit (<0.5%) from natural fermentation are halal per IIFA (Resolution 225).",
    scholarlyReference: "Muslim 2003a, IIFA Resolution 225",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520, IIFA Resolution 225",
    category: "alcohol",
  },
  {
    compoundPattern: "éthanol",
    matchType: "word_boundary",
    priority: 26,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.9,
    explanationFr:
      "Éthanol : haram comme ingrédient. Traces naturelles de fermentation (<0.5%) : halal (IIFA Résolution 225).",
    explanationEn:
      "Ethanol: haram as ingredient. Natural fermentation traces (<0.5%): halal (IIFA Resolution 225).",
    scholarlyReference: "IIFA Resolution 225",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "bière",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "La bière est haram par consensus des quatre écoles. La position de fatwa hanafite suit l'Imam Muhammad al-Shaybani (pas Abu Hanifa) : toute boisson enivrante est khamr, même issue de céréales.",
    explanationEn:
      "Beer is haram by consensus of all four schools. The Hanafi fatwa position follows Imam Muhammad al-Shaybani (not Abu Hanifa): every intoxicating drink is khamr, even from grains.",
    scholarlyReference:
      "Muslim 2003a, Abu Dawud 3681, position mu'tamad hanafite via Muhammad al-Shaybani",
    fatwaSourceUrl:
      "https://seekersguidance.org/answers/general-counsel/did-imam-abu-hanifa-distinguish-between-the-legal-rulings-for-wine-and-beer/",
    fatwaSourceName: "SeekersGuidance, MuslimMatters",
    category: "alcohol",
  },
  {
    compoundPattern: "beer",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr: "Bière : haram par consensus (position mu'tamad hanafite).",
    explanationEn: "Beer: haram by consensus (Hanafi mu'tamad position).",
    scholarlyReference: "Muslim 2003a, Muhammad al-Shaybani",
    fatwaSourceUrl:
      "https://seekersguidance.org/answers/general-counsel/did-imam-abu-hanifa-distinguish-between-the-legal-rulings-for-wine-and-beer/",
    fatwaSourceName: "SeekersGuidance",
    category: "alcohol",
  },
  {
    compoundPattern: "rhum",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr: "Rhum : spiritueux distillé, haram par consensus unanime.",
    explanationEn: "Rum: distilled spirit, haram by unanimous consensus.",
    scholarlyReference: "Coran 5:90-91, Muslim 2003a",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "rum",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr: "Rhum : haram par consensus.",
    explanationEn: "Rum: haram by consensus.",
    scholarlyReference: "Quran 5:90-91",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "whisky",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr: "Whisky : spiritueux distillé, haram par consensus unanime.",
    explanationEn: "Whisky: distilled spirit, haram by unanimous consensus.",
    scholarlyReference: "Coran 5:90-91, Muslim 2003a",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "vodka",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr: "Vodka : spiritueux distillé, haram par consensus unanime.",
    explanationEn: "Vodka: distilled spirit, haram by unanimous consensus.",
    scholarlyReference: "Coran 5:90-91, Muslim 2003a",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },
  {
    compoundPattern: "brandy",
    matchType: "word_boundary",
    priority: 30,
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.99,
    explanationFr:
      "Brandy : eau-de-vie distillée du vin, haram par consensus unanime.",
    explanationEn:
      "Brandy: spirit distilled from wine, haram by unanimous consensus.",
    scholarlyReference: "Coran 5:90-91, Muslim 2003a",
    fatwaSourceUrl: "https://islamqa.info/en/answers/201520",
    fatwaSourceName: "IslamQA #201520",
    category: "alcohol",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — CARMINE / INSECTS (priority 20-30)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "carmine",
    matchType: "word_boundary",
    priority: 25,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "Carmin (E120) : colorant extrait de la cochenille (insecte). Divergence savante : les Malikites autorisent la consommation d'insectes (Coran 6:145 : seules 4 choses sont explicitement interdites). Les Hanafites/Chafiites/Hanbalites classent les insectes comme « khabaith » (Coran 7:157). IslamQA.info (#382570) et le Dar al-Ifta égyptien le déclarent licite via istihala. Le Dar al-Ifta de Jordanie (#3240) le permet sous conditions.",
    explanationEn:
      "Carmine (E120): dye extracted from cochineal insects. Scholarly disagreement: Malikis permit insect consumption (Quran 6:145: only 4 things explicitly forbidden). Hanafis/Shafi'is/Hanbalis classify insects as 'khabaith' (Quran 7:157). IslamQA.info (#382570) and Egyptian Dar al-Ifta declare it permissible via istihala. Jordanian Iftaa' (#3240) permits under conditions.",
    scholarlyReference:
      "Coran 6:145, 7:157, Ibn Majah (sauterelles hadith), IIFA Resolutions 198/210, IslamQA #382570, #162658",
    fatwaSourceUrl: "https://islamqa.info/en/answers/382570",
    fatwaSourceName:
      "IslamQA #382570, Jordanian Iftaa' #3240, Dar al-Ifta Egypt",
    category: "insect_derived",
  },
  {
    compoundPattern: "cochineal",
    matchType: "word_boundary",
    priority: 25,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "Cochenille (E120) : voir carmin. Divergence entre les écoles. Malikites : halal. Majorité : douteux (istihala discutée).",
    explanationEn:
      "Cochineal (E120): see carmine. Disagreement between schools. Maliki: halal. Majority: doubtful (istihala debated).",
    scholarlyReference: "IslamQA #382570, IIFA Resolutions 198/210",
    fatwaSourceUrl: "https://islamqa.info/en/answers/382570",
    fatwaSourceName: "IslamQA #382570",
    category: "insect_derived",
  },
  {
    compoundPattern: "e120",
    matchType: "word_boundary",
    priority: 25,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "E120 (carmin/cochenille) : colorant d'insecte. Malikites : halal. Autres écoles : douteux.",
    explanationEn:
      "E120 (carmine/cochineal): insect-derived dye. Maliki: halal. Other schools: doubtful.",
    scholarlyReference: "IslamQA #382570, Jordanian Iftaa' #3240",
    fatwaSourceUrl:
      "https://www.aliftaa.jo/research-fatwa-english/3240",
    fatwaSourceName: "Jordanian Iftaa' #3240",
    category: "insect_derived",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — RENNET & WHEY (priority 15-25)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "rennet",
    matchType: "word_boundary",
    priority: 20,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "haram",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "Présure animale (source non précisée) : divergence majeure. Les Hanafites (Abu Hanifa) et le Comité permanent saoudien (Ibn Baz) la déclarent halal : la présure n'est pas un organe vivant, elle ne « meurt » pas avec l'animal. Les Sahabas mangeaient le fromage des Zoroastriens sans questionnement ('Umar ibn al-Khattab). Les Chafiites/Hanbalites (position mu'tamad) : haram si l'animal n'a pas été abattu rituellement.",
    explanationEn:
      "Animal rennet (unspecified source): major disagreement. Hanafis (Abu Hanifa) and Saudi Permanent Committee (Ibn Baz) declare it halal: rennet is not a living organ, it doesn't 'die' with the animal. The Companions ate Zoroastrian cheese without inquiry ('Umar ibn al-Khattab). Shafi'i/Hanbali (mu'tamad): haram if animal not ritually slaughtered.",
    scholarlyReference:
      "IslamQA #2841, #115306, #262339, IslamWeb #347143, Mishkat 4227, Permanent Committee fatwa, Dar al-Ifta #9411",
    fatwaSourceUrl: "https://islamqa.info/en/answers/115306",
    fatwaSourceName:
      "IslamQA #115306, Saudi Permanent Committee, Dar al-Ifta #9411",
    category: "rennet",
  },
  {
    compoundPattern: "présure",
    matchType: "word_boundary",
    priority: 20,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "haram",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.65,
    explanationFr:
      "Présure (source non précisée) : voir « rennet ». Hanafites/Comité permanent : halal. Chafiites/Hanbalites : douteux/haram.",
    explanationEn:
      "Rennet (unspecified): see 'rennet'. Hanafi/Permanent Committee: halal. Shafi'i/Hanbali: doubtful/haram.",
    scholarlyReference: "IslamQA #115306, #2841",
    fatwaSourceUrl: "https://islamqa.info/en/answers/115306",
    fatwaSourceName: "IslamQA #115306",
    category: "rennet",
  },
  {
    compoundPattern: "whey",
    matchType: "word_boundary",
    priority: 18,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.6,
    explanationFr:
      "Lactosérum (whey) : le statut suit celui du fromage source. Si la présure utilisée était halal ou microbienne : halal. Si présure animale (non-halal) : dépend du madhab. Hanafites/Ibn Taymiyyah : halal. Chafiites/Hanbalites : douteux. L'argument de la quantité négligeable (al-qadr al-yasir) est aussi invoqué.",
    explanationEn:
      "Whey: status follows the source cheese. If rennet was halal or microbial: halal. If animal rennet (non-halal): depends on madhab. Hanafi/Ibn Taymiyyah: halal. Shafi'i/Hanbali: doubtful. The negligible amount argument (al-qadr al-yasir) is also invoked.",
    scholarlyReference:
      "IslamWeb #198295, #321622, IslamQA #115306, Ibn Taymiyyah",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/198295",
    fatwaSourceName: "IslamWeb #198295",
    category: "rennet",
  },
  {
    compoundPattern: "lactosérum",
    matchType: "word_boundary",
    priority: 18,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.6,
    explanationFr:
      "Lactosérum : voir « whey ». Le statut dépend de la présure du fromage source.",
    explanationEn:
      "Whey: see 'whey'. Status depends on the rennet used in the source cheese.",
    scholarlyReference: "IslamWeb #198295",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/198295",
    fatwaSourceName: "IslamWeb #198295",
    category: "rennet",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — E471 / EMULSIFIERS (priority 15-20)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "mono-",
    matchType: "contains",
    priority: 15,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "Mono-glycérides (E471) : émulsifiant pouvant être d'origine végétale (soja, palme) ou animale (dont porc). Sans précision de source, douteux. IslamWeb (#387325) et l'ECFR les déclarent licites par défaut (al-asl al-ibahah). En pays non-musulman, prudence recommandée (IslamQA #114129).",
    explanationEn:
      "Mono-glycerides (E471): emulsifier that can be plant (soy, palm) or animal (including pork) derived. Without source specification, doubtful. IslamWeb (#387325) and ECFR declare permissible by default (al-asl al-ibahah). In non-Muslim countries, caution advised (IslamQA #114129).",
    scholarlyReference:
      "IslamWeb #387325, IslamQA #97541, #114129, ECFR, IIFA Resolution 198",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/387325",
    fatwaSourceName: "IslamWeb #387325, IslamQA #97541",
    category: "emulsifier",
  },
  {
    compoundPattern: "diglycerides",
    matchType: "word_boundary",
    priority: 15,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "Diglycérides : voir mono-glycérides (E471). Source végétale ou animale indéterminée.",
    explanationEn:
      "Diglycerides: see mono-glycerides (E471). Plant or animal source undetermined.",
    scholarlyReference: "IslamWeb #387325, IslamQA #97541",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/387325",
    fatwaSourceName: "IslamWeb #387325",
    category: "emulsifier",
  },
  {
    compoundPattern: "monoglycérides",
    matchType: "word_boundary",
    priority: 15,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "Monoglycérides : voir mono-glycérides (E471). Douteux si source non précisée.",
    explanationEn:
      "Monoglycerides: see mono-glycerides (E471). Doubtful if source unspecified.",
    scholarlyReference: "IslamWeb #387325",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/387325",
    fatwaSourceName: "IslamWeb #387325",
    category: "emulsifier",
  },
  {
    compoundPattern: "e471",
    matchType: "word_boundary",
    priority: 18,
    rulingDefault: "doubtful",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "halal",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "E471 (mono- et diglycérides d'acides gras) : peut être végétal ou animal. En l'absence de précision sur la source, statut douteux. IslamWeb (#387325) : licite par défaut. IslamQA (#114129) : prudence en pays non-musulman.",
    explanationEn:
      "E471 (mono- and diglycerides of fatty acids): can be plant or animal. Without source specification, doubtful. IslamWeb (#387325): permissible by default. IslamQA (#114129): caution in non-Muslim countries.",
    scholarlyReference: "IslamWeb #387325, IslamQA #97541, #114129",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/387325",
    fatwaSourceName: "IslamWeb #387325, IslamQA #97541",
    category: "emulsifier",
  },

  // ═══════════════════════════════════════════════════════════════
  // KEYWORDS — ADDITIONAL PORK-DERIVED (priority 30-35)
  // ═══════════════════════════════════════════════════════════════

  {
    compoundPattern: "e441",
    matchType: "word_boundary",
    priority: 22,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.6,
    explanationFr:
      "E441 (gélatine) : voir « gélatine ». Douteux si source non précisée.",
    explanationEn:
      "E441 (gelatin): see 'gelatin'. Doubtful if source unspecified.",
    scholarlyReference: "IslamQA #219137",
    fatwaSourceUrl: "https://islamqa.info/en/answers/219137",
    fatwaSourceName: "IslamQA #219137",
    category: "gelatin",
  },
  {
    compoundPattern: "e542",
    matchType: "word_boundary",
    priority: 20,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "E542 (phosphate d'os) : peut être d'origine animale (porc ou bovin). Douteux si source non précisée.",
    explanationEn:
      "E542 (bone phosphite): may be animal-derived (pork or bovine). Doubtful if source unspecified.",
    scholarlyReference: "Analogie avec E471, IslamQA #114129",
    fatwaSourceUrl: "https://islamqa.info/en/answers/114129",
    fatwaSourceName: "IslamQA #114129",
    category: "emulsifier",
  },
  {
    compoundPattern: "l-cystéine",
    matchType: "contains",
    priority: 20,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "L-Cystéine (E920) : acide aminé pouvant être extrait de poils de porc, de plumes de canard, ou synthétisé. Douteux si source non précisée.",
    explanationEn:
      "L-Cysteine (E920): amino acid that can be extracted from pig hair, duck feathers, or synthesized. Doubtful if source unspecified.",
    scholarlyReference: "IslamQA #114129",
    fatwaSourceUrl: "https://islamqa.info/en/answers/114129",
    fatwaSourceName: "IslamQA #114129",
    category: "amino_acid",
  },
  {
    compoundPattern: "l-cysteine",
    matchType: "contains",
    priority: 20,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "L-Cystéine (E920) : voir l-cystéine. Source potentiellement porcine.",
    explanationEn:
      "L-Cysteine (E920): see l-cystéine. Potentially pork-derived.",
    scholarlyReference: "IslamQA #114129",
    fatwaSourceUrl: "https://islamqa.info/en/answers/114129",
    fatwaSourceName: "IslamQA #114129",
    category: "amino_acid",
  },
  {
    compoundPattern: "e920",
    matchType: "word_boundary",
    priority: 20,
    rulingDefault: "doubtful",
    rulingHanafi: "doubtful",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "doubtful",
    confidence: 0.55,
    explanationFr:
      "E920 (L-Cystéine) : potentiellement d'origine porcine. Douteux.",
    explanationEn:
      "E920 (L-Cysteine): potentially pork-derived. Doubtful.",
    scholarlyReference: "IslamQA #114129",
    fatwaSourceUrl: "https://islamqa.info/en/answers/114129",
    fatwaSourceName: "IslamQA #114129",
    category: "amino_acid",
  },
];
