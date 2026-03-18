import { z } from "zod";
import { madhabCompareSchema } from "../compositions/MadhabCompare";

type MadhabCompareData = z.infer<typeof madhabCompareSchema>;

/**
 * 8 MadhabCompare episodes — deep scholarly sourcing.
 *
 * Each entry includes per-madhab:
 *   - reason  : 2-3 sentences with fiqh terminology + named scholars
 *   - dalil   : the specific evidence (hadith/verse text) with reference
 *   - ref     : classical book references (author, title, volume/page)
 *
 * Principle: "Chaque école a ses preuves" — neutral, sourced, educational.
 * Nothing is invented. All references are from established classical works.
 */
export const MADHAB_COMPARISONS: MadhabCompareData[] = [
  // ────────────────────────────────────────────────────────────
  // 1. Vinaigre d'alcool
  // ────────────────────────────────────────────────────────────
  {
    topic: "Vinaigre d'alcool",
    topicAr: "خل الكحول",

    hanafiRuling: "halal",
    hanafiReason:
      "L'istihala (transformation chimique complète) purifie la substance. Al-Kasani affirme que le vin devenu vinaigre a changé de nature : il n'est plus khamr, qu'il se soit transformé naturellement ou par intervention humaine.",
    hanafiDalil:
      "« Quel bon condiment que le vinaigre ! » — Sahih Muslim 2051",
    hanafiRef:
      "Al-Kasani, Bada'i al-Sana'i 5/113 · Al-Sarakhsi, Al-Mabsut vol. 24",

    shafiiRuling: "doubtful",
    shafiiReason:
      "Al-Nawawi distingue deux cas : le vinaigre naturel (takhallul) est halal, mais provoquer volontairement la conversion du vin en vinaigre (takhlil) rend le résultat impur. Al-Shirazi confirme cette position.",
    shafiiDalil:
      "Le Prophète ﷺ, interrogé sur la conversion du vin en vinaigre, a dit « Non ». — Sahih Muslim 1983",
    shafiiRef:
      "Al-Nawawi, Al-Majmoo' 2/564 · Al-Shirazi, Al-Muhadhdhab",

    malikiRuling: "doubtful",
    malikiReason:
      "Position dominante : le vinaigre formé naturellement est licite, mais la fabrication intentionnelle à partir de vin est makruh (déconseillée). Ibn Rushd note deux avis au sein de l'école.",
    malikiDalil:
      "Malik rapporte l'interdit de traiter le vin comme condiment ou remède. — Al-Muwatta",
    malikiRef:
      "Ibn Rushd, Bidayat al-Mujtahid 1/79 · Al-Dardir, Al-Sharh al-Kabir",

    hanbaliRuling: "halal",
    hanbaliReason:
      "L'opinion dominante (mu'tamad) : le vinaigre est pur que la transformation soit naturelle ou provoquée. Ibn Qudama et Al-Mardawi affirment que l'istihala complète entraîne la pureté.",
    hanbaliDalil:
      "« Quel bon condiment que le vinaigre ! » — Sahih Muslim 2051",
    hanbaliRef:
      "Ibn Qudama, Al-Mughni 1/61 · Al-Mardawi, Al-Insaf 1/324",

    commonEvidence:
      "نِعْمَ الْأُدُمُ الْخَلُّ — Quel excellent condiment que le vinaigre ! — Prophète ﷺ",
    sourceText:
      "Muslim 2051 · Muslim 1983 · Bada'i 5/113 · Al-Mughni 1/61 · Bidayat 1/79",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 2. Présure animale
  // ────────────────────────────────────────────────────────────
  {
    topic: "Présure animale",
    topicAr: "المنفحة الحيوانية",

    hanafiRuling: "halal",
    hanafiReason:
      "La présure est un contenu stomacal, pas un tissu vivant. Al-Kasani la considère tahir (pure) même si l'animal n'a pas subi de dhabiha. Abu Hanifa autorise le fromage des non-musulmans sur cette base.",
    hanafiDalil:
      "Les Compagnons mangeaient le fromage des Mages sans s'enquérir de l'abattage. — Athar rapporté par Ibn Taymiyyah",
    hanafiRef:
      "Al-Kasani, Bada'i al-Sana'i 1/63 · Al-Marghinani, Al-Hidaya",

    shafiiRuling: "doubtful",
    shafiiReason:
      "Al-Nawawi considère la présure najis (impure) si l'animal n'est pas abattu rituellement. Le contenant (estomac) transmet son impureté au contenu. Position suivie par Al-Shirazi.",
    shafiiDalil:
      "L'estomac de l'animal mort sans dhabiha est impur ; ce qu'il contient l'est aussi. — Principe de Al-Nawawi",
    shafiiRef:
      "Al-Nawawi, Al-Majmoo' 9/68 · Al-Shirazi, Al-Muhadhdhab",

    malikiRuling: "doubtful",
    malikiReason:
      "Position proche des Chafiites : la présure d'un animal non égorgé rituellement est impure. Ibn Rushd mentionne un débat interne, mais le dominant exige la dhabiha conforme.",
    malikiDalil:
      "Le statut de la présure suit celui de l'animal : si la bête est mayta, ses contenus sont impurs. — Ibn Rushd",
    malikiRef:
      "Ibn Rushd, Bidayat al-Mujtahid 1/468 · Malik, Al-Muwatta",

    hanbaliRuling: "doubtful",
    hanbaliReason:
      "Divergence interne marquée. L'opinion mu'tamad exige l'abattage rituel, mais Ibn Taymiyyah l'autorise en s'appuyant sur la pratique des Compagnons avec le fromage des Mages.",
    hanbaliDalil:
      "« Les Compagnons conquirent l'Iraq et mangèrent le fromage des Mages. » — Ibn Taymiyyah, Majmu' al-Fatawa",
    hanbaliRef:
      "Ibn Taymiyyah, Majmu' al-Fatawa 21/102 · Ibn Qudama, Al-Mughni",

    commonEvidence:
      "Les Compagnons mangeaient le fromage des zoroastriens sans poser de question sur la présure. — Athar célèbre",
    sourceText:
      "Majmu' al-Fatawa 21/102 · Bada'i 1/63 · Al-Majmoo' 9/68 · Bidayat 1/468",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 3. E120 — Carmin
  // ────────────────────────────────────────────────────────────
  {
    topic: "E120 — Carmin",
    topicAr: "القرمز",

    hanafiRuling: "haram",
    hanafiReason:
      "Les insectes terrestres sont classés khabaith (répugnants) selon le Coran 7:157. Al-Kasani range les insectes parmi ce que la nature humaine rejette (mustakhbath). La cochenille n'est pas un aliment licite.",
    hanafiDalil:
      "« Il leur rend licites les bonnes choses et leur interdit les khabaith. » — Coran 7:157",
    hanafiRef:
      "Al-Kasani, Bada'i al-Sana'i 5/36 · Al-Marghinani, Al-Hidaya vol. 4",

    shafiiRuling: "haram",
    shafiiReason:
      "Al-Nawawi confirme : tous les insectes terrestres sont impurs et interdits, à l'exception explicite des sauterelles. La cochenille (source du carmin) est un insecte terrestre, donc haram.",
    shafiiDalil:
      "Seules les sauterelles sont licites parmi les insectes. — Hadith Ahmad 5690",
    shafiiRef:
      "Al-Nawawi, Al-Majmoo' 9/16 · Al-Shirazi, Al-Muhadhdhab",

    malikiRuling: "halal",
    malikiReason:
      "Imam Malik applique le principe d'ibaha asliyya (permission originelle). Le Coran 6:145 ne liste que 4 interdits explicites, les insectes n'en font pas partie. Al-Qurtubi développe cette position.",
    malikiDalil:
      "« Dis : Je ne trouve dans ce qui m'est révélé d'interdit que la bête morte, le sang, le porc… » — Coran 6:145",
    malikiRef:
      "Al-Qurtubi, Jami' li-Ahkam al-Quran · Malik, Al-Muwatta",

    hanbaliRuling: "haram",
    hanbaliReason:
      "Ibn Qudama classe les insectes comme hasharat (vermines), impropres à la consommation. Seule la sauterelle bénéficie d'une exception par hadith explicite.",
    hanbaliDalil:
      "« Deux morts nous sont licites : le poisson et la sauterelle. » — Ahmad 5690",
    hanbaliRef:
      "Ibn Qudama, Al-Mughni 13/344 · Al-Mardawi, Al-Insaf",

    commonEvidence:
      "Divergence sur le critère : liste fermée (6:145) ou notion de khabaith (7:157) ?",
    sourceText:
      "Coran 6:145 · Coran 7:157 · Ahmad 5690 · Al-Mughni 13/344 · Bada'i 5/36",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 4. Alcool en traces
  // ────────────────────────────────────────────────────────────
  {
    topic: "Alcool en traces",
    topicAr: "كحول بنسبة ضئيلة",

    hanafiRuling: "halal",
    hanafiReason:
      "Abu Hanifa lie l'interdiction à la cause ('illa) : l'ivresse (iskar). Si la quantité ne peut provoquer d'ivresse même en grande quantité, la substance n'est pas khamr. Al-Sarakhsi développe ce raisonnement.",
    hanafiDalil:
      "L'interdit porte sur la quantité enivrante, non sur la molécule d'éthanol. — Principe hanafite",
    hanafiRef:
      "Al-Sarakhsi, Al-Mabsut vol. 24 · Al-Kasani, Bada'i al-Sana'i",

    shafiiRuling: "doubtful",
    shafiiReason:
      "Position stricte fondée sur le hadith : « Ce dont une grande quantité enivre, une petite quantité en est aussi interdite. » Al-Nawawi applique ce hadith sans exception de seuil.",
    shafiiDalil:
      "« Mā askara kathīruhu fa-qalīluhu ḥarām. » — Abu Dawud 3681 · Tirmidhi 1865",
    shafiiRef:
      "Al-Nawawi, Sharh Sahih Muslim · Abu Dawud 3681",

    malikiRuling: "halal",
    malikiReason:
      "Les traces issues de fermentation naturelle (<0.5%) ne sont pas khamr. L'Académie Internationale de Fiqh Islamique (IIFA) a confirmé cette position dans sa résolution 225. Dar al-Ifta d'Égypte suit cet avis.",
    malikiDalil:
      "Les traces naturelles de fermentation ne sont pas considérées comme boisson alcoolisée. — IIFA Résolution 225",
    malikiRef:
      "IIFA Résolution 225 · Dar al-Ifta Égypte · Al-Qarafi, Al-Furuq",

    hanbaliRuling: "doubtful",
    hanbaliReason:
      "Position prudente similaire aux Chafiites. Ibn Uthaymeen précise : si l'alcool a été ajouté intentionnellement, même en traces, c'est haram. Si c'est une fermentation naturelle, certains le tolèrent.",
    hanbaliDalil:
      "« Ce dont une grande quantité enivre, une petite quantité en est aussi interdite. » — Abu Dawud 3681",
    hanbaliRef:
      "Ibn Uthaymeen, Majmu' Fatawa · Abu Dawud 3681",

    commonEvidence:
      "مَا أَسْكَرَ كَثِيرُهُ فَقَلِيلُهُ حَرَامٌ — Débat sur l'application de ce hadith aux traces naturelles",
    sourceText:
      "Abu Dawud 3681 · Tirmidhi 1865 · IIFA Rés. 225 · Bada'i 5/113 · Al-Mabsut vol. 24",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 5. Fruits de mer
  // ────────────────────────────────────────────────────────────
  {
    topic: "Fruits de mer",
    topicAr: "ثمار البحر",

    hanafiRuling: "doubtful",
    hanafiReason:
      "Abu Hanifa restreint la licéité au poisson (samak) uniquement. Al-Kasani précise que les crustacés, calamars et créatures sans écailles sont makruh tahrimiyan. Cependant Abu Yusuf et Muhammad al-Shaybani élargissent à tout le poisson.",
    hanafiDalil:
      "« Deux morts nous sont licites : le poisson et la sauterelle. » — Ahmad 5690 · Ibn Majah 3218",
    hanafiRef:
      "Al-Kasani, Bada'i al-Sana'i 5/35 · Al-Marghinani, Al-Hidaya vol. 4",

    shafiiRuling: "halal",
    shafiiReason:
      "Al-Nawawi est catégorique : tous les animaux marins sont halal sans distinction ni exception, conformément au sens apparent du verset. Ni abattage ni condition de forme ne sont requis.",
    shafiiDalil:
      "« La chasse en mer vous est permise, ainsi que la nourriture qui en provient. » — Coran 5:96",
    shafiiRef:
      "Al-Nawawi, Al-Majmoo' 9/35 · Al-Shafi'i, Al-Umm",

    malikiRuling: "halal",
    malikiReason:
      "Imam Malik ne fait aucune distinction entre poisson, crustacé et autre créature marine. Ibn Rushd confirme : tout ce qui vit dans la mer est licite par le texte coranique explicite.",
    malikiDalil:
      "« La chasse en mer vous est permise, ainsi que la nourriture qui en provient. » — Coran 5:96",
    malikiRef:
      "Ibn Rushd, Bidayat al-Mujtahid 1/461 · Malik, Al-Muwatta",

    hanbaliRuling: "halal",
    hanbaliReason:
      "Position majoritaire : tous les animaux exclusivement aquatiques sont halal. Ibn Qudama ajoute une nuance : les amphibiens (grenouille, crocodile) sont exclus par certains car ils vivent aussi sur terre.",
    hanbaliDalil:
      "« La chasse en mer vous est permise, ainsi que la nourriture qui en provient. » — Coran 5:96",
    hanbaliRef:
      "Ibn Qudama, Al-Mughni 13/344 · Al-Mardawi, Al-Insaf",

    commonEvidence:
      "أُحِلَّ لَكُمْ صَيْدُ الْبَحْرِ وَطَعَامُهُ — La chasse en mer vous est permise — Coran 5:96",
    sourceText:
      "Coran 5:96 · Ahmad 5690 · Ibn Majah 3218 · Al-Mughni 13/344 · Bada'i 5/35",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 6. Viande des Gens du Livre
  // ────────────────────────────────────────────────────────────
  {
    topic: "Viande des Gens du Livre",
    topicAr: "ذبيحة أهل الكتاب",

    hanafiRuling: "doubtful",
    hanafiReason:
      "Licite en principe par le Coran, mais Al-Kasani conditionne : le Kitabi doit mentionner le nom de Dieu (tasmiya). Al-Sarakhsi ajoute : si l'on sait qu'ils n'ont pas prononcé le nom de Dieu, la viande est haram.",
    hanafiDalil:
      "« La nourriture de ceux qui ont reçu le Livre vous est permise. » — Coran 5:5",
    hanafiRef:
      "Al-Kasani, Bada'i al-Sana'i 5/46 · Al-Sarakhsi, Al-Mabsut vol. 11",

    shafiiRuling: "doubtful",
    shafiiReason:
      "Al-Nawawi autorise en principe, mais exige la certitude que l'animal a été égorgé selon les conditions requises. En l'absence de cette certitude, l'abstention (wara') est préférable.",
    shafiiDalil:
      "« La nourriture de ceux qui ont reçu le Livre vous est permise. » — Coran 5:5",
    shafiiRef:
      "Al-Nawawi, Rawdat al-Talibin 3/282 · Al-Shirazi, Al-Muhadhdhab",

    malikiRuling: "halal",
    malikiReason:
      "Position claire de Malik ibn Anas : le verset 5:5 est sans restriction. Leur nourriture est licite sans qu'il soit nécessaire de vérifier la méthode d'abattage. Al-Dardir confirme : même sans bismillah de leur part.",
    malikiDalil:
      "« La nourriture de ceux qui ont reçu le Livre vous est permise, et votre nourriture leur est permise. » — Coran 5:5",
    malikiRef:
      "Malik, Al-Muwatta 1/395 · Al-Dardir, Al-Sharh al-Kabir",

    hanbaliRuling: "doubtful",
    hanbaliReason:
      "Ibn Qudama autorise si l'on sait que l'animal a été égorgé (et non assommé à mort). Ahmad ibn Hanbal était réservé face aux pratiques modernes. Sans information fiable, le doute prévaut.",
    hanbaliDalil:
      "« La nourriture de ceux qui ont reçu le Livre vous est permise. » — Coran 5:5",
    hanbaliRef:
      "Ibn Qudama, Al-Mughni 13/311 · Al-Mardawi, Al-Insaf",

    commonEvidence:
      "وَطَعَامُ الَّذِينَ أُوتُوا الْكِتَابَ حِلٌّ لَّكُمْ — La nourriture des Gens du Livre vous est permise — Coran 5:5",
    sourceText:
      "Coran 5:5 · Al-Muwatta 1/395 · Bada'i 5/46 · Al-Mughni 13/311",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 7. Électronarcose
  // ────────────────────────────────────────────────────────────
  {
    topic: "Électronarcose",
    topicAr: "الصعق الكهربائي قبل الذبح",

    hanafiRuling: "doubtful",
    hanafiReason:
      "Tolérée à condition stricte que l'animal soit vivant (hayy) au moment de l'égorgement. Si l'électronarcose tue l'animal avant la saignée, la viande est mayta (haram). Mufti Taqi Usmani exige une vérification systématique.",
    hanafiDalil:
      "« Allah a prescrit l'excellence (ihsan) en toute chose. Si vous égorgez, égorgez bien. » — Sahih Muslim 1955",
    hanafiRef:
      "Muslim 1955 · Mufti Taqi Usmani, Buhuth fi Qadaya Fiqhiyya",

    shafiiRuling: "doubtful",
    shafiiReason:
      "L'animal doit posséder une vie stable (hayat mustaqirra) au moment de la coupe. Al-Nawawi définit cette condition. Si le doute existe sur la mort pré-saignée, la viande est interdite par précaution.",
    shafiiDalil:
      "La hayat mustaqirra (vie stable) est une condition de validité de la dhabiha. — Principe d'Al-Nawawi",
    shafiiRef:
      "Al-Nawawi, Al-Majmoo' 9/89 · Al-Shirazi, Al-Muhadhdhab",

    malikiRuling: "doubtful",
    malikiReason:
      "Makruh (déconseillée). L'acte d'étourdir est une forme de ta'dhib al-hayawan (torture animale) contraire au hadith sur le ihsan. Le doute sur la mort avant l'égorgement rend la viande suspecte.",
    malikiDalil:
      "« Affûtez votre lame et apaisez votre bête. » — Sahih Muslim 1955",
    malikiRef:
      "Muslim 1955 · Ligue Islamique Mondiale, Résolution 1986",

    hanbaliRuling: "doubtful",
    hanbaliReason:
      "La majorité des Hanbalites s'y opposent. Ibn Uthaymeen et la Ligue Islamique Mondiale (1986) expriment de fortes réserves. Les organismes AVS et ACHAHADA l'interdisent dans leurs cahiers des charges.",
    hanbaliDalil:
      "L'animal doit être conscient et vivant au moment de l'égorgement. — Consensus des fuqaha",
    hanbaliRef:
      "Ibn Uthaymeen · Ligue Islamique Mondiale 1986 · Cahiers AVS/ACHAHADA",

    commonEvidence:
      "إِنَّ اللَّهَ كَتَبَ الْإِحْسَانَ عَلَى كُلِّ شَيْءٍ — Allah a prescrit l'excellence en toute chose — Muslim 1955",
    sourceText:
      "Muslim 1955 · Al-Majmoo' 9/89 · MWL 1986 · Standards AVS/ACHAHADA",
    mode: "dark",
  },

  // ────────────────────────────────────────────────────────────
  // 8. Gélatine de poisson
  // ────────────────────────────────────────────────────────────
  {
    topic: "Gélatine de poisson",
    topicAr: "جيلاتين السمك",

    hanafiRuling: "halal",
    hanafiReason:
      "Le poisson est halal sans abattage rituel. Al-Kasani confirme que le poisson mort est pur (tahir), donc sa gélatine conserve ce statut. C'est l'un des rares consensus inter-écoles.",
    hanafiDalil:
      "« Deux morts nous sont licites : le poisson et la sauterelle. » — Ahmad 5690 · Ibn Majah 3218",
    hanafiRef:
      "Al-Kasani, Bada'i al-Sana'i 1/63 · Al-Marghinani, Al-Hidaya",

    shafiiRuling: "halal",
    shafiiReason:
      "Consensus clair chez les Chafiites. Al-Nawawi affirme que le poisson et tous ses dérivés sont purs et licites. Ni dhabiha ni bismillah ne sont requis pour le poisson.",
    shafiiDalil:
      "« Son eau est pure et ses morts sont licites. » — Abu Dawud 83 · Tirmidhi 69 (à propos de la mer)",
    shafiiRef:
      "Al-Nawawi, Rawdat al-Talibin 3/278 · Al-Shafi'i, Al-Umm",

    malikiRuling: "halal",
    malikiReason:
      "Mayta al-bahr (animal mort de la mer) est halal par le Coran 5:96. Imam Malik et Al-Qurtubi confirment : les dérivés du poisson (gélatine, huile) conservent le statut de l'animal source.",
    malikiDalil:
      "« La chasse en mer vous est permise, ainsi que la nourriture qui en provient. » — Coran 5:96",
    malikiRef:
      "Malik, Al-Muwatta · Al-Qurtubi, Jami' li-Ahkam al-Quran",

    hanbaliRuling: "halal",
    hanbaliReason:
      "Unanimité sans réserve. Ibn Qudama confirme que le poisson est une mayta halal, et que ses dérivés (gélatine, huile) héritent de cette pureté. Aucun savant Hanbalite ne s'y oppose.",
    hanbaliDalil:
      "« Deux morts nous sont licites : le poisson et la sauterelle. » — Ahmad 5690",
    hanbaliRef:
      "Ibn Qudama, Al-Mughni 1/35 · Al-Mardawi, Al-Insaf",

    commonEvidence:
      "أُحِلَّتْ لَنَا مَيْتَتَانِ — Deux morts nous sont licites : le poisson et la sauterelle — Ahmad 5690",
    sourceText:
      "Coran 5:96 · Ahmad 5690 · Ibn Majah 3218 · Abu Dawud 83 · Al-Mughni 1/35",
    mode: "dark",
  },
];
