/**
 * Scholarly References Seeder
 *
 * Seeds both scholarly_sources (master catalog) and scholarly_citations
 * (contextual links from trust score weights to specific passages).
 *
 * Called by run-all.ts on every deploy (idempotent — upsert on PK/unique).
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { scholarlySources, scholarlyCitations } from "../schema/scholarly.js";
import type { NewScholarlySource, NewScholarlyCitation } from "../schema/scholarly.js";

// ================================================================
// SCHOLARLY SOURCES — Master catalog of referenced works
// ================================================================

const SOURCES: NewScholarlySource[] = [
  // ── Classical Fiqh Manuals ──────────────────────────────

  {
    id: "radd-al-muhtar",
    titleAr: "ردّ المحتار على الدرّ المختار",
    titleFr: "Radd al-Muhtār 'alā al-Durr al-Mukhtār",
    titleEn: "The Response of the Perplexed to The Chosen Pearl",
    authorAr: "ابن عابدين، محمد أمين",
    authorFr: "Ibn Abidin, Muhammad Amin",
    sourceType: "fiqh_manual",
    primaryMadhab: "hanafi",
    centuryHijri: 13,
    descriptionFr: "Commentaire magistral du Durr al-Mukhtar d'al-Haskafi. Référence ultime du fiqh hanafite tardif, 6 volumes. Couvre l'ensemble des chapitres de la jurisprudence, y compris al-dhaba'ih (l'abattage rituel).",
    descriptionAr: "حاشية ابن عابدين على الدرّ المختار للحصكفي، المرجع الأساسي في الفقه الحنفي المتأخر",
    externalUrl: "https://shamela.ws/book/7629",
  },
  {
    id: "durr-al-mukhtar",
    titleAr: "الدرّ المختار شرح تنوير الأبصار",
    titleFr: "Al-Durr al-Mukhtār (Le Joyau choisi)",
    titleEn: "The Chosen Pearl — Commentary on Tanwir al-Absar",
    authorAr: "الحصكفي، علاء الدين",
    authorFr: "Al-Haskafi, Alaa al-Din",
    sourceType: "fiqh_manual",
    primaryMadhab: "hanafi",
    centuryHijri: 11,
    descriptionFr: "Texte de référence hanafite commenté par Ibn Abidin dans le Radd al-Muhtar. Contient les règles détaillées de l'abattage rituel.",
    externalUrl: "https://shamela.ws/book/7629",
  },
  {
    id: "badai-al-sanai",
    titleAr: "بدائع الصنائع في ترتيب الشرائع",
    titleFr: "Badā'i' al-Sanā'i' fī Tartīb al-Sharā'i'",
    titleEn: "Marvels of Craftsmanship in Ordering the Laws",
    authorAr: "الكاساني، علاء الدين",
    authorFr: "Al-Kasani, Alaa al-Din",
    sourceType: "fiqh_manual",
    primaryMadhab: "hanafi",
    centuryHijri: 6,
    descriptionFr: "Encyclopédie hanafite majeure, 7 volumes. Référence pour le principe de Tayyib et la classification des viandes en halal/haram/khabaith.",
    descriptionAr: "موسوعة فقهية حنفية كبرى في سبعة مجلدات",
    externalUrl: "https://shamela.ws/book/6115",
  },
  {
    id: "al-majmu",
    titleAr: "المجموع شرح المهذّب",
    titleFr: "Al-Majmū' Sharh al-Muhadhdhab",
    titleEn: "The Compendium — Commentary on Al-Muhadhdhab",
    authorAr: "النووي، يحيى بن شرف",
    authorFr: "Al-Nawawi, Yahya ibn Sharaf",
    sourceType: "fiqh_manual",
    primaryMadhab: "shafii",
    centuryHijri: 7,
    descriptionFr: "Commentaire encyclopédique de l'imam al-Nawawi sur al-Muhadhdhab d'al-Shirazi. ~20 volumes. Référence majeure chafiite pour les conditions de validité de la dhakāh et la hayāh mustaqqirrah.",
    descriptionAr: "شرح الإمام النووي الموسوعي على المهذّب للشيرازي، المرجع الشافعي الأول",
    externalUrl: "https://shamela.ws/book/919",
  },
  {
    id: "al-muhadhdhab",
    titleAr: "المهذّب في فقه الإمام الشافعي",
    titleFr: "Al-Muhadhdhab fī Fiqh al-Imām al-Shāfi'ī",
    titleEn: "The Refined in Shafi'i Jurisprudence",
    authorAr: "الشيرازي، إبراهيم بن علي",
    authorFr: "Al-Shirazi, Ibrahim ibn Ali",
    sourceType: "fiqh_manual",
    primaryMadhab: "shafii",
    centuryHijri: 5,
    descriptionFr: "Texte de base commenté par al-Nawawi dans al-Majmu'. Fondement du fiqh chafiite.",
    externalUrl: "https://shamela.ws/book/5765",
  },
  {
    id: "al-sharh-al-kabir",
    titleAr: "الشرح الكبير على مختصر خليل",
    titleFr: "Al-Sharh al-Kabīr 'alā Mukhtasar Khalīl",
    titleEn: "The Great Commentary on Khalil's Abridgement",
    authorAr: "الدردير، أحمد بن محمد",
    authorFr: "Al-Dardir, Ahmad ibn Muhammad",
    sourceType: "fiqh_manual",
    primaryMadhab: "maliki",
    centuryHijri: 12,
    descriptionFr: "Commentaire majeur malikite sur le Mukhtasar de Khalil ibn Ishaq. 4 volumes. Référence pour les conditions de l'abattage et la tolérance post-saignée.",
    descriptionAr: "شرح الدردير على مختصر خليل، المرجع المالكي المعتمد",
    externalUrl: "https://shamela.ws/book/4341",
  },
  {
    id: "mukhtasar-khalil",
    titleAr: "مختصر خليل",
    titleFr: "Mukhtasar Khalīl",
    titleEn: "The Abridgement of Khalil",
    authorAr: "خليل بن إسحاق الجندي",
    authorFr: "Khalil ibn Ishaq al-Jundi",
    sourceType: "fiqh_manual",
    primaryMadhab: "maliki",
    centuryHijri: 8,
    descriptionFr: "Abrégé de fiqh malikite, le texte le plus commenté dans l'école. Base du Sharh al-Kabir d'al-Dardir.",
    externalUrl: "https://shamela.ws/book/5765",
  },
  {
    id: "al-mughni",
    titleAr: "المغني",
    titleFr: "Al-Mughnī",
    titleEn: "The Enricher",
    authorAr: "ابن قدامة المقدسي، موفق الدين",
    authorFr: "Ibn Qudama al-Maqdisi, Muwaffaq al-Din",
    sourceType: "fiqh_manual",
    primaryMadhab: "hanbali",
    centuryHijri: 7,
    descriptionFr: "Encyclopédie hanbalite majeure, ~15 volumes. Référence pour le principe de précaution (ihtiyat) et sadd al-dhara'i. Traite en détail les conditions de la dhakāh et les cas de doute (shubuhāt).",
    descriptionAr: "موسوعة الفقه الحنبلي لابن قدامة، المرجع الأول في المذهب",
    externalUrl: "https://shamela.ws/book/6148",
  },

  // ── Hadith Collections ──────────────────────────────────

  {
    id: "sahih-bukhari",
    titleAr: "صحيح البخاري",
    titleFr: "Sahīh al-Bukhārī",
    titleEn: "The Authentic Collection of al-Bukhari",
    authorAr: "البخاري، محمد بن إسماعيل",
    authorFr: "Al-Bukhari, Muhammad ibn Ismail",
    sourceType: "hadith_collection",
    primaryMadhab: "cross_school",
    centuryHijri: 3,
    descriptionFr: "Collection de hadiths la plus authentique, référence pour les conditions de la dhakāh (tasmiya, outil tranchant, etc.).",
    externalUrl: "https://sunnah.com/bukhari",
  },
  {
    id: "jami-tirmidhi",
    titleAr: "جامع الترمذي",
    titleFr: "Jāmi' al-Tirmidhī",
    titleEn: "The Collection of al-Tirmidhi",
    authorAr: "الترمذي، محمد بن عيسى",
    authorFr: "Al-Tirmidhi, Muhammad ibn Isa",
    sourceType: "hadith_collection",
    primaryMadhab: "cross_school",
    centuryHijri: 3,
    descriptionFr: "L'un des six recueils canoniques (al-kutub al-sitta). Contient les hadiths sur le doute (shubuhāt) et la précaution.",
    externalUrl: "https://sunnah.com/tirmidhi",
  },

  // ── Quranic Reference ──────────────────────────────────

  {
    id: "quran",
    titleAr: "القرآن الكريم",
    titleFr: "Le Saint Coran",
    titleEn: "The Holy Quran",
    authorAr: "كلام الله",
    authorFr: "Parole divine",
    sourceType: "quran",
    primaryMadhab: "cross_school",
    descriptionFr: "Source première de la législation islamique. Versets de référence : 5:3 (al-maytah), 7:157 (al-tayyibāt), 2:173 (exceptions).",
  },

  // ── Modern Fatwas & Institutional ──────────────────────

  {
    id: "mwl-1987",
    titleAr: "قرار المجمع الفقهي لرابطة العالم الإسلامي ١٩٨٧",
    titleFr: "Résolution du Conseil de la Ligue Islamique Mondiale (1987)",
    titleEn: "Muslim World League Fiqh Council Resolution (1987)",
    authorFr: "Conseil du Fiqh — Ligue Islamique Mondiale",
    sourceType: "modern_fatwa",
    primaryMadhab: "cross_school",
    yearPublished: 1987,
    descriptionFr: "Résolution de la 10ème session (1987) sur les conditions de l'abattage mécanique et l'étourdissement. Position de référence pour de nombreuses autorités halal.",
  },
  {
    id: "egypt-fatwa-1978",
    titleAr: "فتوى دار الإفتاء المصرية ١٩٧٨",
    titleFr: "Fatwa du Comité des Fatwas d'Égypte (1978)",
    titleEn: "Egyptian Fatwa Committee Ruling (1978)",
    authorFr: "Dar al-Ifta al-Misriyya",
    sourceType: "modern_fatwa",
    primaryMadhab: "cross_school",
    yearPublished: 1978,
    descriptionFr: "Fatwa historique autorisant l'électronarcose sous conditions strictes (réversibilité prouvée). Utilisée comme référence par les organismes tolérant l'étourdissement.",
  },
  {
    id: "hfsaa",
    titleAr: "هيئة المعايير الحلال الغذائية والتجميلية",
    titleFr: "HFSAA — Halal Food Standards Alliance of America",
    titleEn: "HFSAA — Halal Food Standards Alliance of America",
    authorFr: "HFSAA",
    sourceType: "institutional",
    primaryMadhab: "cross_school",
    yearPublished: 2009,
    descriptionFr: "Alliance américaine regroupant des muftis et des experts en normes halal. Analyses détaillées sur l'abattage mécanique, la tasmiya individuelle et l'istikhfaf.",
    externalUrl: "https://hfsaa.org",
  },
  {
    id: "darul-ifta-karachi",
    titleAr: "دار الإفتاء، جامعة دار العلوم كراتشي",
    titleFr: "Darul Ifta — Jamia Darul Uloom Karachi",
    titleEn: "Darul Ifta — Jamia Darul Uloom Karachi",
    authorFr: "Darul Ifta, Jamia Darul Uloom Karachi (sous Mufti Taqi Usmani)",
    sourceType: "modern_fatwa",
    primaryMadhab: "hanafi",
    yearPublished: 1995,
    descriptionFr: "Centre de fatwas de la plus grande université hanafite du Pakistan. Fatwas de référence sur l'électronarcose et l'abattage mécanique, sous la direction du Mufti Taqi Usmani.",
  },

  // ── Additional Hadith Collections ──────────────────────

  {
    id: "sahih-muslim",
    titleAr: "صحيح مسلم",
    titleFr: "Sahīh Muslim",
    titleEn: "The Authentic Collection of Muslim",
    authorAr: "مسلم بن الحجاج النيسابوري",
    authorFr: "Muslim ibn al-Hajjaj al-Naysaburi",
    sourceType: "hadith_collection",
    primaryMadhab: "cross_school",
    centuryHijri: 3,
    descriptionFr: "Deuxième collection de hadiths la plus authentique après al-Bukhari. Contient le hadith de Shaddad ibn Aws sur l'ihsān dans l'abattage (« إذا ذبحتم فأحسنوا الذبح »), fondement du bien-être animal en Islam.",
    externalUrl: "https://sunnah.com/muslim",
  },
  {
    id: "sunan-al-nasai",
    titleAr: "سنن النسائي",
    titleFr: "Sunan al-Nasā'ī",
    titleEn: "The Sunan of al-Nasa'i",
    authorAr: "النسائي، أحمد بن شعيب",
    authorFr: "Al-Nasa'i, Ahmad ibn Shu'ayb",
    sourceType: "hadith_collection",
    primaryMadhab: "cross_school",
    centuryHijri: 3,
    descriptionFr: "L'un des six recueils canoniques. Contient des hadiths sur les conditions de la dhakāh et la chaîne de narration du hadith « Laisse ce qui te fait douter ».",
    externalUrl: "https://sunnah.com/nasai",
  },

  // ── Additional Fiqh Manuals ────────────────────────────

  {
    id: "majmu-al-fatawa",
    titleAr: "مجموع الفتاوى",
    titleFr: "Majmū' al-Fatāwā",
    titleEn: "The Compilation of Fatwas",
    authorAr: "ابن تيمية، تقي الدين أحمد",
    authorFr: "Ibn Taymiyya, Taqi al-Din Ahmad",
    sourceType: "fiqh_manual",
    primaryMadhab: "hanbali",
    centuryHijri: 8,
    descriptionFr: "Compilation encyclopédique des fatwas d'Ibn Taymiyya, 37 volumes. Référence pour les principes de sadd al-dharā'i' (fermeture des voies menant à l'interdit) et l'ijtihad dans les questions alimentaires contemporaines.",
    descriptionAr: "مجموع فتاوى شيخ الإسلام ابن تيمية في سبعة وثلاثين مجلدًا",
    externalUrl: "https://shamela.ws/book/7289",
  },
  {
    id: "al-umm",
    titleAr: "الأمّ",
    titleFr: "Al-Umm (La Mère)",
    titleEn: "The Mother — Al-Shafi'i's Magnum Opus",
    authorAr: "الشافعي، محمد بن إدريس",
    authorFr: "Al-Shafi'i, Muhammad ibn Idris",
    sourceType: "fiqh_manual",
    primaryMadhab: "shafii",
    centuryHijri: 2,
    descriptionFr: "Œuvre fondatrice de l'imam al-Shafi'i. 8 volumes. Établit les principes d'usul al-fiqh qui fondent l'école chafiite, y compris les conditions de validité de la dhakāh.",
    descriptionAr: "كتاب الأمّ للإمام الشافعي، الكتاب المؤسِّس للمذهب الشافعي",
    externalUrl: "https://shamela.ws/book/1655",
  },
  {
    id: "al-muwatta",
    titleAr: "الموطّأ",
    titleFr: "Al-Muwatta' (Le Chemin aplani)",
    titleEn: "The Well-Trodden Path",
    authorAr: "مالك بن أنس",
    authorFr: "Malik ibn Anas",
    sourceType: "fiqh_manual",
    primaryMadhab: "maliki",
    centuryHijri: 2,
    descriptionFr: "Premier recueil de hadith-fiqh de l'histoire, par l'imam Malik. Fondement de l'école malikite. Contient les chapitres sur la dhakāh et les conditions de licéité.",
    descriptionAr: "الموطّأ للإمام مالك، أوّل مصنّف جامع بين الحديث والفقه",
    externalUrl: "https://shamela.ws/book/6943",
  },

  // ── Modern Institutional Sources ───────────────────────

  {
    id: "efsa-2004",
    titleAr: "تقرير الهيئة الأوروبية لسلامة الأغذية ٢٠٠٤",
    titleFr: "EFSA — Rapport sur le bien-être animal à l'abattage (2004)",
    titleEn: "EFSA Scientific Report on Welfare Aspects of Stunning and Killing Methods (2004)",
    authorFr: "European Food Safety Authority (EFSA)",
    sourceType: "institutional",
    primaryMadhab: "cross_school",
    yearPublished: 2004,
    descriptionFr: "Rapport scientifique de l'EFSA documentant les taux de mortalité pré-saignée selon les méthodes d'étourdissement. Données utilisées pour évaluer le risque réel d'invalidation de la dhakāh par stunning/électronarcose.",
    externalUrl: "https://www.efsa.europa.eu/en/efsajournal/pub/45",
  },
  {
    id: "codex-cac-gl-24",
    titleAr: "هيئة الدستور الغذائي — المبادئ التوجيهية العامة لاستخدام مصطلح حلال",
    titleFr: "Codex Alimentarius CAC/GL 24-1997 — Directives générales pour l'utilisation du terme halal",
    titleEn: "Codex Alimentarius General Guidelines for Use of the Term Halal (CAC/GL 24-1997)",
    authorFr: "Commission du Codex Alimentarius (FAO/OMS)",
    sourceType: "institutional",
    primaryMadhab: "cross_school",
    yearPublished: 1997,
    descriptionFr: "Norme internationale de référence pour l'utilisation du terme halal dans l'alimentation. Définit les conditions minimales d'abattage rituel reconnues par les autorités sanitaires mondiales.",
    externalUrl: "https://www.fao.org/fao-who-codexalimentarius/codex-texts/guidelines/en/",
  },
  {
    id: "oic-smiic-1",
    titleAr: "معيار المنظمة الإسلامية — OIC/SMIIC 1:2011",
    titleFr: "OIC/SMIIC 1:2011 — Exigences générales pour les aliments halal",
    titleEn: "OIC/SMIIC 1:2011 — General Requirements for Halal Food",
    authorFr: "SMIIC — Standards and Metrology Institute for Islamic Countries (OIC)",
    sourceType: "institutional",
    primaryMadhab: "cross_school",
    yearPublished: 2011,
    descriptionFr: "Norme de l'OCI (57 pays membres) définissant les exigences halal. Référence pour la distinction entre étourdissement létal et non-létal, la tasmiya, et les conditions de la dhakāh au niveau international.",
  },
];

// ================================================================
// SCHOLARLY CITATIONS — Trust Score Weight Justifications
// ================================================================
// Convention: contextKey = "weight.{madhab|universal}.{indicator}"
// Each citation links a specific weight value to its scholarly justification.

const CITATIONS: NewScholarlyCitation[] = [
  // ════════════════════════════════════════════════════════
  // HANAFI WEIGHTS
  // ════════════════════════════════════════════════════════

  // ── Stunning (-25) ──
  {
    sourceId: "radd-al-muhtar",
    domain: "trust_score",
    contextKey: "weight.hanafi.stunning",
    madhab: "hanafi",
    volume: "6",
    page: "296",
    passageAr: "ولو ضرب شاة فأسقطها ثم ذبحها وتحرّكت لم تؤكل إلا إذا كانت الحياة مستقرّة",
    passageFr: "Si l'on frappe un ovin au point de le faire tomber, puis qu'on l'égorge et qu'il bouge, on ne le mange pas sauf si la vie était encore stable (hayāh mustaqqirrah).",
    relevanceFr: "Justifie le poids maximal (-25) : tout doute sur la conscience de l'animal au moment de la saignée invalide la dhakāh dans le fiqh hanafite. L'étourdissement crée systématiquement ce doute.",
    displayOrder: 0,
  },
  {
    sourceId: "darul-ifta-karachi",
    domain: "trust_score",
    contextKey: "weight.hanafi.stunning",
    madhab: "hanafi",
    passageFr: "Fatwa du Mufti Taqi Usmani : l'étourdissement pré-abattage (stunning) est interdit car il crée un doute sur le fait que l'animal soit encore vivant d'une vie stable au moment de la saignée. La règle de base est que la certitude ne disparaît pas par le doute (al-yaqīn lā yazūl bil-shakk), mais ici le doute porte sur la licéité même de la viande.",
    relevanceFr: "Confirmation contemporaine de la position hanafite stricte. Le Mufti Taqi Usmani est la référence mondiale du fiqh hanafite appliqué à l'industrie alimentaire.",
    displayOrder: 1,
  },

  // ── Electronarcosis (-20) ──
  {
    sourceId: "radd-al-muhtar",
    domain: "trust_score",
    contextKey: "weight.hanafi.electronarcosis",
    madhab: "hanafi",
    volume: "6",
    page: "296",
    passageFr: "Même passage que pour le stunning — l'électronarcose avant saignée crée le même risque de mort pré-dhakāh. La position hanafite ne distingue pas le moyen (mécanique, électrique, chimique) : tout ce qui compromet la hayāh mustaqqirrah invalide.",
    relevanceFr: "Justifie -20 : l'électronarcose spécifiquement (choc électrique avant saignée) est légèrement distincte du stunning mécanique mais le principe hanafite est le même — risque de mort avant la saignée.",
    displayOrder: 0,
  },
  {
    sourceId: "darul-ifta-karachi",
    domain: "trust_score",
    contextKey: "weight.hanafi.electronarcosis",
    madhab: "hanafi",
    passageFr: "Fatwa Darul Ifta, Jamia Darul Uloom Karachi : l'électronarcose (passage d'un courant électrique dans le cerveau de l'animal avant l'abattage) est interdite car le risque de mort par arrêt cardiaque avant la saignée est documenté par les études vétérinaires. L'animal doit être pleinement conscient.",
    relevanceFr: "Source contemporaine confirmant le refus hanafite de l'électronarcose. Base du poids -20.",
    displayOrder: 1,
  },

  // ── Post-slaughter electrocution (-3) ──
  {
    sourceId: "radd-al-muhtar",
    domain: "trust_score",
    contextKey: "weight.hanafi.post_slaughter_electrocution",
    madhab: "hanafi",
    volume: "6",
    page: "296",
    passageFr: "La dhakāh est déjà accomplie (tasmiya + coupe). Un choc électrique post-saignée ne peut pas invalider un acte déjà validé. La pénalité reste minime : précaution théorique si le choc provoquait la mort avant exsanguination suffisante.",
    relevanceFr: "Justifie le poids marginal (-3) : pénalité de précaution uniquement. La position hanafite majoritaire reconnaît que la dhakāh est déjà accomplie au moment du choc post-saignée.",
    displayOrder: 0,
  },

  // ── Mechanical slaughter (-20) ──
  {
    sourceId: "durr-al-mukhtar",
    domain: "trust_score",
    contextKey: "weight.hanafi.mechanical_slaughter",
    madhab: "hanafi",
    passageFr: "La tasmiya (invocation du nom d'Allah) est wājib (obligatoire) sur chaque animal individuellement dans le rite hanafite. Une machine ne peut pas prononcer le nom d'Allah — l'abattage mécanique sans tasmiya individuelle est invalide.",
    relevanceFr: "Justifie -20 : la tasmiya individuelle est une condition de validité de la dhakāh en fiqh hanafite. L'abattage mécanique ne peut pas satisfaire cette condition.",
    displayOrder: 0,
  },
  {
    sourceId: "hfsaa",
    domain: "trust_score",
    contextKey: "weight.hanafi.mechanical_slaughter",
    madhab: "hanafi",
    passageFr: "Analyse HFSAA : l'abattage mécanique de volailles est incompatible avec la tasmiya individuelle requise par le fiqh hanafite. Même avec un enregistrement audio de la basmala, cela ne constitue pas une intention (niyyah) valide de la part d'un être humain.",
    relevanceFr: "Confirmation institutionnelle moderne du refus hanafite de l'abattage mécanique.",
    displayOrder: 1,
  },

  // ── VSM (-10) ──
  {
    sourceId: "badai-al-sanai",
    domain: "trust_score",
    contextKey: "weight.hanafi.vsm",
    madhab: "hanafi",
    volume: "5",
    page: "41",
    passageFr: "Le principe de Tayyib (pureté/qualité) est intégral au halal dans le fiqh hanafite. La viande séparée mécaniquement (VSM) est classée parmi les khabā'ith (choses répugnantes) — Coran 7:157 : « Il leur rend licites les bonnes choses et leur interdit les mauvaises ».",
    relevanceFr: "Justifie -10 : la VSM est considérée comme khabīth (répugnant) dans la classification hanafite. Le Tayyib n'est pas une simple recommandation mais une condition de licéité.",
    displayOrder: 0,
  },

  // ── Salaried slaughterers (+15) ──
  {
    sourceId: "badai-al-sanai",
    domain: "trust_score",
    contextKey: "weight.hanafi.salaried_slaughterers",
    madhab: "hanafi",
    volume: "5",
    page: "41",
    passageFr: "L'indépendance du dhābih (sacrificateur) par rapport à l'entreprise de production est valorisée : un sacrificateur salarié par l'organisme de certification (et non par l'abattoir) a moins de conflits d'intérêts et peut refuser de procéder si les conditions ne sont pas réunies.",
    relevanceFr: "Justifie +15 (le maximum dans l'école hanafite) : l'indépendance du sacrificateur est cruciale pour garantir le respect effectif de la tasmiya et des conditions de la dhakāh.",
    displayOrder: 0,
  },

  // ════════════════════════════════════════════════════════
  // SHAFI'I WEIGHTS
  // ════════════════════════════════════════════════════════

  // ── Stunning (-15) ──
  {
    sourceId: "al-majmu",
    domain: "trust_score",
    contextKey: "weight.shafii.stunning",
    madhab: "shafii",
    volume: "9",
    page: "75",
    passageAr: "إذا ذبح الحيوان وفيه حياة مستقرّة حلّ أكله",
    passageFr: "Si l'animal est égorgé alors qu'il possède encore une vie stable (hayāh mustaqqirrah), sa consommation est licite.",
    relevanceFr: "Justifie -15 (modéré) : la position chafiite distingue le stunning létal (haram) du non-létal (makruh). Si la hayāh mustaqqirrah est confirmée, l'étourdissement ne invalide pas mais reste blâmable (makruh).",
    displayOrder: 0,
  },

  // ── Electronarcosis (-15) ──
  {
    sourceId: "al-muhadhdhab",
    domain: "trust_score",
    contextKey: "weight.shafii.electronarcosis",
    madhab: "shafii",
    passageFr: "Même principe que le stunning dans l'école chafiite : l'électronarcose est évaluée selon son effet sur la hayāh mustaqqirrah. Si elle est réversible et que l'animal est encore vivant d'une vie stable, la dhakāh reste valide mais l'acte est makruh.",
    relevanceFr: "Justifie -15 : poids identique au stunning — le fiqh chafiite traite toutes les formes d'étourdissement sous le même critère de hayāh mustaqqirrah.",
    displayOrder: 0,
  },

  // ── Post-slaughter electrocution (-2) ──
  {
    sourceId: "al-majmu",
    domain: "trust_score",
    contextKey: "weight.shafii.post_slaughter_electrocution",
    madhab: "shafii",
    volume: "9",
    page: "89",
    passageFr: "Les interventions post-saignée ne sont pas critiques si la hayāh mustaqqirrah était confirmée au moment de la coupe. Le choc électrique après l'acte de dhakāh ne remet pas en cause la validité de l'abattage.",
    relevanceFr: "Justifie le poids minimal (-2) : quasi-absence de préoccupation fiqhique. La dhakāh est validée au moment de la coupe, pas après.",
    displayOrder: 0,
  },

  // ── Mechanical slaughter (-18) ──
  {
    sourceId: "al-majmu",
    domain: "trust_score",
    contextKey: "weight.shafii.mechanical_slaughter",
    madhab: "shafii",
    volume: "9",
    page: "75-80",
    passageFr: "L'istikhfāf (négligence) dans l'acte de dhakāh invalide l'abattage. L'abattage mécanique est considéré comme une forme d'istikhfāf car il ne respecte pas la dignité de l'acte rituel.",
    relevanceFr: "Justifie -18 : l'istikhfāf est un concept clé dans le fiqh chafiite qui s'applique directement à l'abattage mécanique industriel.",
    displayOrder: 0,
  },
  {
    sourceId: "hfsaa",
    domain: "trust_score",
    contextKey: "weight.shafii.mechanical_slaughter",
    madhab: "shafii",
    passageFr: "Analyse HFSAA basée sur le fiqh de l'imam al-Shafi'i : la mécanisation de l'abattage déshumanise l'acte rituel et constitue un istikhfāf (mépris/négligence) envers la dhakāh.",
    relevanceFr: "Confirmation institutionnelle de la lecture chafiite de l'abattage mécanique.",
    displayOrder: 1,
  },

  // ── VSM (-8) ──
  {
    sourceId: "al-majmu",
    domain: "trust_score",
    contextKey: "weight.shafii.vsm",
    madhab: "shafii",
    passageFr: "Le Tayyib est important mais moins formellement contraignant que l'acte de l'abattage lui-même. La VSM est une préoccupation de qualité (Tayyib) mais ne relève pas directement de la validité de la dhakāh.",
    relevanceFr: "Justifie -8 (modéré) : poids inférieur au hanafite car le chafiite sépare plus nettement les conditions de validité (shart) des recommandations (adab).",
    displayOrder: 0,
  },

  // ── Salaried slaughterers (+10) ──
  {
    sourceId: "al-majmu",
    domain: "trust_score",
    contextKey: "weight.shafii.salaried_slaughterers",
    madhab: "shafii",
    passageFr: "L'indépendance du sacrificateur est valorisée mais pas autant que dans le fiqh hanafite. Le chafiite met davantage l'accent sur les conditions techniques de la dhakāh que sur le statut professionnel du dhābih.",
    relevanceFr: "Justifie +10 (inférieur au hanafite +15) : l'école chafiite accorde moins d'importance au statut professionnel du sacrificateur qu'aux conditions techniques de l'acte.",
    displayOrder: 0,
  },

  // ════════════════════════════════════════════════════════
  // MALIKI WEIGHTS
  // ════════════════════════════════════════════════════════

  // ── Stunning (-10) ──
  {
    sourceId: "al-sharh-al-kabir",
    domain: "trust_score",
    contextKey: "weight.maliki.stunning",
    madhab: "maliki",
    volume: "2",
    page: "108",
    passageFr: "L'école malikite est la plus tolérante vis-à-vis de l'étourdissement. Le principe al-asl al-ibāhah (la règle de base est la permissibilité) s'applique : tant que l'animal est encore vivant au moment de la saignée, les moyens utilisés pour le maîtriser sont acceptés.",
    relevanceFr: "Justifie -10 (le plus bas des 4 écoles) : la tolérance malikite est basée sur le principe de permissibilité originelle et l'accent mis sur la saignée elle-même plutôt que sur les actes préparatoires.",
    displayOrder: 0,
  },
  {
    sourceId: "mukhtasar-khalil",
    domain: "trust_score",
    contextKey: "weight.maliki.stunning",
    madhab: "maliki",
    passageFr: "Khalil ibn Ishaq dans son Mukhtasar : les conditions de la dhakāh malikite se concentrent sur la saignée (nahr ou dhabh) avec intention et tasmiya. Les actes préparatoires ne sont pas des conditions de validité.",
    relevanceFr: "Complète la référence d'al-Dardir : le texte de base malikite confirme l'accent sur la saignée elle-même.",
    displayOrder: 1,
  },

  // ── Electronarcosis (-8) ──
  {
    sourceId: "egypt-fatwa-1978",
    domain: "trust_score",
    contextKey: "weight.maliki.electronarcosis",
    madhab: "maliki",
    passageFr: "Fatwa du Comité des Fatwas d'Égypte (1978) : l'électronarcose est autorisée à condition que la réversibilité soit prouvée et que l'animal soit vivant au moment de la saignée. Position suivie par de nombreuses autorités d'influence malikite.",
    relevanceFr: "Justifie -8 (tolérant) : la fatwa égyptienne de 1978 est la référence pour la tolérance conditionnelle de l'électronarcose dans les pays d'influence malikite.",
    displayOrder: 0,
  },
  {
    sourceId: "mwl-1987",
    domain: "trust_score",
    contextKey: "weight.maliki.electronarcosis",
    madhab: "maliki",
    passageFr: "Résolution de la Ligue Islamique Mondiale (1987) : accepte l'étourdissement sous réserve qu'il soit non létal et réversible. Position de compromis influencée par les approches malikite et chafiite.",
    relevanceFr: "Complète la fatwa égyptienne avec une perspective multi-école confirmant la tolérance conditionnelle.",
    displayOrder: 1,
  },

  // ── Post-slaughter electrocution (-1) ──
  {
    sourceId: "al-sharh-al-kabir",
    domain: "trust_score",
    contextKey: "weight.maliki.post_slaughter_electrocution",
    madhab: "maliki",
    volume: "2",
    page: "108",
    passageFr: "Les procédures post-saignée sont pleinement acceptées dans l'école malikite si la dhakāh était valide. Le choc électrique post-saignée n'a aucune incidence sur la validité. La pénalité est purement symbolique.",
    relevanceFr: "Justifie le poids symbolique (-1) : l'école malikite est la plus claire sur l'acceptation des interventions post-dhakāh.",
    displayOrder: 0,
  },

  // ── Mechanical slaughter (-8) ──
  {
    sourceId: "al-sharh-al-kabir",
    domain: "trust_score",
    contextKey: "weight.maliki.mechanical_slaughter",
    madhab: "maliki",
    volume: "2",
    page: "108",
    passageFr: "La position malikite sur l'abattage mécanique est plus nuancée que les autres écoles. La pénalité est modérée car le malikisme met moins l'accent sur la niyyah individuelle du sacrificateur et davantage sur la validité technique de la saignée.",
    relevanceFr: "Justifie -8 (le plus bas des 4 écoles) : la moindre insistance malikite sur la niyyah individuelle réduit la gravité de l'abattage mécanique.",
    displayOrder: 0,
  },

  // ── VSM (-5) ──
  {
    sourceId: "al-sharh-al-kabir",
    domain: "trust_score",
    contextKey: "weight.maliki.vsm",
    madhab: "maliki",
    passageFr: "Le focus Tayyib malikite est plus étroit, centré sur l'acte de l'abattage lui-même. La VSM est une préoccupation de qualité, pas strictement un enjeu de fiqh.",
    relevanceFr: "Justifie -5 (le plus bas des 4 écoles) : pour les malikites, la VSM relève de la qualité alimentaire, pas de la validité halal.",
    displayOrder: 0,
  },

  // ── Salaried slaughterers (+5) ──
  {
    sourceId: "al-sharh-al-kabir",
    domain: "trust_score",
    contextKey: "weight.maliki.salaried_slaughterers",
    madhab: "maliki",
    passageFr: "Dans l'école malikite, le statut professionnel du sacrificateur est moins déterminant. L'accent est mis sur les conditions techniques de la saignée. Un sacrificateur salarié par l'organisme est un plus mais pas un critère aussi central que dans le fiqh hanafite.",
    relevanceFr: "Justifie +5 (le plus bas des 4 écoles) : l'école malikite accorde relativement moins d'importance au statut d'emploi du sacrificateur.",
    displayOrder: 0,
  },

  // ════════════════════════════════════════════════════════
  // HANBALI WEIGHTS
  // ════════════════════════════════════════════════════════

  // ── Stunning (-25) ──
  {
    sourceId: "al-mughni",
    domain: "trust_score",
    contextKey: "weight.hanbali.stunning",
    madhab: "hanbali",
    volume: "13",
    page: "293",
    passageAr: "ولا يحلّ أكل ما شُكّ في ذكاته",
    passageFr: "Il n'est pas licite de manger ce dont on doute de la validité de l'abattage rituel.",
    relevanceFr: "Justifie le poids maximal (-25) : le principe de précaution hanbalite (ihtiyat) interdit la consommation en cas de doute. L'étourdissement crée un doute systématique — sadd al-dharā'i' (fermeture des voies menant à l'interdit).",
    displayOrder: 0,
  },

  // ── Electronarcosis (-18) ──
  {
    sourceId: "al-mughni",
    domain: "trust_score",
    contextKey: "weight.hanbali.electronarcosis",
    madhab: "hanbali",
    volume: "13",
    page: "293",
    passageFr: "L'électronarcose est une shubha (zone de doute). Le hadith rapporté par al-Tirmidhi — « Laisse ce qui te fait douter pour ce qui ne te fait pas douter » — s'applique directement. Le hanbalisme privilégie l'évitement complet.",
    relevanceFr: "Justifie -18 : le principe hanbalite de shubuhāt (zones de doute) traite l'électronarcose comme un domaine à éviter par précaution.",
    displayOrder: 0,
  },
  {
    sourceId: "jami-tirmidhi",
    domain: "trust_score",
    contextKey: "weight.hanbali.electronarcosis",
    madhab: "hanbali",
    passageFr: "Hadith rapporté par al-Tirmidhi et al-Nasa'i : « دع ما يريبك إلى ما لا يريبك » — Laisse ce qui te fait douter pour ce qui ne te fait pas douter. Base du principe de précaution hanbalite appliqué à l'étourdissement.",
    relevanceFr: "Source hadithique directe du principe de précaution hanbalite. Fondement du refus de l'électronarcose.",
    displayOrder: 1,
  },

  // ── Post-slaughter electrocution (-3) ──
  {
    sourceId: "al-mughni",
    domain: "trust_score",
    contextKey: "weight.hanbali.post_slaughter_electrocution",
    madhab: "hanbali",
    volume: "13",
    page: "293",
    passageFr: "Le sadd al-dharā'i' (fermeture des voies menant à l'interdit) s'applique faiblement ici : la dhakāh est déjà accomplie. Pénalité de précaution marginale, pas d'invalidation.",
    relevanceFr: "Justifie le poids marginal (-3) : le principe de précaution s'applique mais faiblement, car la dhakāh est déjà validée au moment du choc.",
    displayOrder: 0,
  },

  // ── Mechanical slaughter (-18) ──
  {
    sourceId: "al-mughni",
    domain: "trust_score",
    contextKey: "weight.hanbali.mechanical_slaughter",
    madhab: "hanbali",
    volume: "13",
    page: "285",
    passageFr: "La niyyah (intention) est une condition de validité de la dhakāh. Une machine n'a pas de niyyah. Ibn Qudama insiste sur l'intentionnalité de l'acte d'abattage comme condition sine qua non.",
    relevanceFr: "Justifie -18 : l'exigence hanbalite de niyyah du sacrificateur est incompatible avec l'abattage mécanique.",
    displayOrder: 0,
  },
  {
    sourceId: "hfsaa",
    domain: "trust_score",
    contextKey: "weight.hanbali.mechanical_slaughter",
    madhab: "hanbali",
    passageFr: "Analyse HFSAA : l'abattage mécanique est incompatible avec la niyyah requise par le fiqh hanbalite. Réf. Ibn Qudama, Al-Mughni 13/285.",
    relevanceFr: "Confirmation institutionnelle moderne de la lecture hanbalite sur la niyyah et l'abattage mécanique.",
    displayOrder: 1,
  },

  // ── VSM (-10) ──
  {
    sourceId: "al-mughni",
    domain: "trust_score",
    contextKey: "weight.hanbali.vsm",
    madhab: "hanbali",
    passageFr: "Le principe hanbalite de khabā'ith (choses répugnantes) s'applique à la VSM. Prohibition de précaution — même si la viande est halal à l'origine, le processus mécanique de séparation la rend Tayyib-douteuse.",
    relevanceFr: "Justifie -10 : position hanbalite maximale — la VSM est khabīth par le principe de précaution (ihtiyat).",
    displayOrder: 0,
  },

  // ── Salaried slaughterers (+12) ──
  {
    sourceId: "al-mughni",
    domain: "trust_score",
    contextKey: "weight.hanbali.salaried_slaughterers",
    madhab: "hanbali",
    passageFr: "L'indépendance du sacrificateur est fortement valorisée dans le fiqh hanbalite, en lien avec l'exigence de niyyah. Un sacrificateur sous le contrôle direct de l'organisme de certification, plutôt que de l'industriel, garantit mieux l'intention et le respect des conditions.",
    relevanceFr: "Justifie +12 (élevé) : le lien entre indépendance du dhābih et intégrité de la niyyah est central dans l'approche hanbalite.",
    displayOrder: 0,
  },

  // ════════════════════════════════════════════════════════
  // UNIVERSAL WEIGHTS (cross-school)
  // ════════════════════════════════════════════════════════

  // ── Controllers are employees (+15) ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "weight.universal.controllers_are_employees",
    madhab: "cross_school",
    chapter: "Al-Ma'idah (5:8)",
    passageAr: "يا أيها الذين آمنوا كونوا قوّامين لله شهداء بالقسط",
    passageFr: "Ô vous qui croyez ! Soyez fermes dans votre foi en Allah, témoins de l'équité.",
    relevanceFr: "Principe organisationnel : le contrôle indépendant (contrôleurs salariés par l'organisme, non par l'industrie) est un principe de justice et d'intégrité commun à toutes les écoles. +15 identique dans tous les madhabs.",
    displayOrder: 0,
  },

  // ── Controllers present each production (+15) ──
  {
    sourceId: "sahih-bukhari",
    domain: "trust_score",
    contextKey: "weight.universal.controllers_present",
    madhab: "cross_school",
    passageFr: "Le Prophète ﷺ a ordonné un bon traitement de l'animal à chaque étape. La présence de contrôleurs à chaque production (pas uniquement des audits ponctuels) garantit le respect continu des conditions de la dhakāh. Principe de murāqabah (surveillance).",
    relevanceFr: "Justifie +15 : la surveillance continue est un principe prophétique et organisationnel fondamental, reconnu par toutes les écoles.",
    displayOrder: 0,
  },

  // ── Transparency bonus (+3 × 3) — overview ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "weight.universal.transparency",
    madhab: "cross_school",
    chapter: "Al-Baqarah (2:283)",
    passageAr: "ولا تكتموا الشهادة ومن يكتمها فإنه آثم قلبه",
    passageFr: "Ne dissimulez pas le témoignage. Celui qui le cache, son cœur est pécheur.",
    relevanceFr: "Le bonus de transparence (+3 par indicateur, max +9) est basé sur le principe coranique de non-dissimulation. Un organisme qui publie sa charte, ses rapports d'audit et la liste de ses entreprises certifiées respecte ce principe. Indicateur organisationnel, identique pour toutes les écoles.",
    displayOrder: 0,
  },

  // ── Transparency: Public Charter (+3) ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "weight.universal.transparency_public_charter",
    madhab: "cross_school",
    chapter: "Al-Isra (17:34)",
    passageAr: "وأوفوا بالعهد إنّ العهد كان مسؤولا",
    passageFr: "Honorez vos engagements, car de l'engagement il sera demandé compte.",
    relevanceFr: "La publication d'un cahier des charges (charte publique) constitue un engagement contractuel ('ahd) vis-à-vis des consommateurs musulmans. Un organisme qui rend public son référentiel permet la vérification et l'accountability. +3 : récompense l'acte de s'engager publiquement.",
    displayOrder: 0,
  },

  // ── Transparency: Audit Reports (+3) ──
  {
    sourceId: "sahih-muslim",
    domain: "trust_score",
    contextKey: "weight.universal.transparency_audit_reports",
    madhab: "cross_school",
    passageAr: "إنّ الله كتب الإحسان على كلّ شيء، فإذا ذبحتم فأحسنوا الذبح",
    passageFr: "Allah a prescrit l'excellence (ihsān) en toute chose. Quand vous abattez, faites-le avec excellence.",
    relevanceFr: "La publication de rapports d'audit ou de résumés de contrôles démontre l'ihsān (excellence) dans le processus de certification. L'ihsān ne peut être vérifié que par la transparence des résultats. +3 : récompense la preuve documentée de l'excellence opérationnelle.",
    displayOrder: 0,
  },

  // ── Transparency: Company List (+3) ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "weight.universal.transparency_company_list",
    madhab: "cross_school",
    chapter: "Al-Hujurat (49:6)",
    passageAr: "يا أيها الذين آمنوا إن جاءكم فاسق بنبإ فتبيّنوا",
    passageFr: "Ô vous qui croyez ! Si un pervers vous apporte une nouvelle, vérifiez-la.",
    relevanceFr: "La publication de la liste des entreprises certifiées permet aux consommateurs de vérifier (tabayyun) les affirmations de certification. Sans cette liste, le consommateur dépend de la déclaration unilatérale du producteur. +3 : récompense la vérifiabilité directe.",
    displayOrder: 0,
  },

  // ── Universal Stunning (-20) ──
  {
    sourceId: "mwl-1987",
    domain: "trust_score",
    contextKey: "weight.universal.stunning",
    madhab: "cross_school",
    passageFr: "Position de consensus inter-écoles de la Ligue Islamique Mondiale (1987) : l'étourdissement est interdit si létal, toléré sous conditions si réversible. La pénalité universelle de -20 est la moyenne pondérée des positions des 4 écoles (-25/-15/-10/-25), reflétant une majorité stricte (3 écoles sur 4 sont ≥ -15).",
    relevanceFr: "Justifie -20 comme poids universel : la résolution MWL sert de référence multi-école. Le choix de -20 (et non la moyenne arithmétique -18.75) s'explique par le poids supplémentaire accordé à la gravité du risque d'invalidation (mort pré-dhakāh documentée par l'EFSA à 0.1-5% selon la méthode).",
    displayOrder: 0,
  },
  {
    sourceId: "efsa-2004",
    domain: "trust_score",
    contextKey: "weight.universal.stunning",
    madhab: "cross_school",
    passageFr: "Le rapport EFSA 2004 documente les taux de mortalité pré-saignée par méthode d'étourdissement : 0.1% pour le captive bolt (bovins), 1-3% pour l'électronarcose tête-seulement (ovins), jusqu'à 5% pour les bains d'eau (volailles). Ces données scientifiques justifient la gravité de la pénalité : le risque de maytah est réel, pas théorique.",
    relevanceFr: "Source scientifique objectivant le risque d'invalidation de la dhakāh par stunning. Les taux de mortalité documentés justifient une pénalité significative (-20), pas symbolique.",
    displayOrder: 1,
  },

  // ── Universal Electronarcosis (-15) ──
  {
    sourceId: "egypt-fatwa-1978",
    domain: "trust_score",
    contextKey: "weight.universal.electronarcosis",
    madhab: "cross_school",
    passageFr: "La fatwa égyptienne de 1978 est la première autorité à distinguer l'électronarcose des autres formes d'étourdissement, en admettant sa licéité sous condition de réversibilité prouvée. La pénalité universelle de -15 (vs -20 pour le stunning général) reflète cette distinction : l'électronarcose est spécifiquement identifiable et ses paramètres contrôlables, contrairement au stunning mécanique.",
    relevanceFr: "Justifie -15 comme poids universel : distingue l'électronarcose (réversible si bien paramétré) du stunning mécanique. La fatwa égyptienne fonde cette distinction reprise ensuite par la MWL.",
    displayOrder: 0,
  },
  {
    sourceId: "oic-smiic-1",
    domain: "trust_score",
    contextKey: "weight.universal.electronarcosis",
    madhab: "cross_school",
    passageFr: "La norme OIC/SMIIC 1:2011 (57 pays membres de l'OCI) définit les conditions d'acceptation de l'étourdissement électrique : réversibilité prouvée, paramètres documentés (voltage, ampérage, durée), absence de lésions létales. La pénalité de -15 reflète le fait que ces conditions sont rarement vérifiées en pratique industrielle.",
    relevanceFr: "Source institutionnelle internationale confirmant la tolérance conditionnelle. Les conditions OIC rarement satisfaites en pratique justifient de maintenir -15 et non un poids plus léger.",
    displayOrder: 1,
  },

  // ── Universal Post-slaughter electrocution (-2) ──
  {
    sourceId: "al-majmu",
    domain: "trust_score",
    contextKey: "weight.universal.post_slaughter_electrocution",
    madhab: "cross_school",
    volume: "9",
    page: "89",
    passageFr: "Position de consensus trans-école : les interventions post-dhakāh ne remettent pas en cause la validité d'un abattage déjà accompli. Al-Nawawi (al-Majmu' 9/89), al-Dardir (al-Sharh al-Kabir 2/108), Ibn Abidin (Radd al-Muhtar 6/296) : tous convergent. La pénalité universelle de -2 est un marqueur de précaution maximale, pas une pénalité d'invalidation.",
    relevanceFr: "Justifie -2 comme poids universel : le quasi-consensus des 4 écoles sur la non-invalidation post-dhakāh rend une pénalité forte injustifiable. -2 = marqueur symbolique de l'exigence maximale.",
    displayOrder: 0,
  },

  // ── Universal Mechanical slaughter (-15) ──
  {
    sourceId: "hfsaa",
    domain: "trust_score",
    contextKey: "weight.universal.mechanical_slaughter",
    madhab: "cross_school",
    passageFr: "Analyse HFSAA multi-école : l'abattage mécanique est rejeté par les 4 écoles mais pour des raisons différentes — absence de tasmiya individuelle (hanafi), istikhfāf/négligence (chafiite), absence de niyyah (hanbali), moindre dignité de l'acte (malikite). La pénalité universelle de -15 est inférieure aux hanafi/chafiite/hanbali (-20/-18/-18) mais supérieure au malikite (-8), reflétant la majorité stricte.",
    relevanceFr: "Justifie -15 comme poids universel : convergence des 4 écoles sur le rejet, avec un poids qui reflète la majorité (3/4 écoles ≥ -18) tempéré par la tolérance relative malikite.",
    displayOrder: 0,
  },
  {
    sourceId: "codex-cac-gl-24",
    domain: "trust_score",
    contextKey: "weight.universal.mechanical_slaughter",
    madhab: "cross_school",
    passageFr: "Le Codex Alimentarius CAC/GL 24-1997, §2.1 : « L'animal doit être abattu par un Musulman [...] en invoquant le nom d'Allah ». La norme internationale elle-même exige l'intervention humaine et l'invocation, ce qui exclut de facto l'abattage purement mécanique.",
    relevanceFr: "Source institutionnelle internationale (FAO/OMS) confirmant l'exigence d'un abatteur humain et de la tasmiya. L'abattage mécanique contredit la norme de référence mondiale.",
    displayOrder: 1,
  },

  // ── Universal VSM (-8) ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "weight.universal.vsm",
    madhab: "cross_school",
    chapter: "Al-A'raf (7:157)",
    passageAr: "ويحلّ لهم الطيّبات ويحرّم عليهم الخبائث",
    passageFr: "Il leur rend licites les bonnes choses (al-tayyibāt) et leur interdit les mauvaises (al-khabā'ith).",
    relevanceFr: "Justifie -8 comme poids universel : la VSM (Viande Séparée Mécaniquement) est classée comme khabīth (répugnant) par les écoles strictes et comme préoccupation de qualité par les tolérantes. Le verset coranique 7:157 est le fondement commun — toutes les écoles reconnaissent le principe de Tayyib, mais divergent sur son caractère obligatoire vs recommandé.",
    displayOrder: 0,
  },

  // ── Universal Salaried slaughterers (+10) ──
  {
    sourceId: "sahih-bukhari",
    domain: "trust_score",
    contextKey: "weight.universal.salaried_slaughterers",
    madhab: "cross_school",
    passageFr: "Principe prophétique d'indépendance et de compétence du dhābih (sacrificateur). Le Prophète ﷺ insistait sur la qualification et la sincérité du sacrificateur. Un dhābih salarié par l'organisme de certification (et non par l'industriel) possède l'indépendance nécessaire pour refuser de procéder si les conditions ne sont pas réunies. +10 = moyenne cross-school (+15/+10/+5/+12).",
    relevanceFr: "Justifie +10 comme poids universel : l'indépendance du sacrificateur est valorisée par toutes les écoles, avec des intensités variables. +10 reflète la médiane des 4 positions.",
    displayOrder: 0,
  },

  // ════════════════════════════════════════════════════════
  // ALGORITHM METHODOLOGY — How & why we compute scores
  // ════════════════════════════════════════════════════════
  // Convention: contextKey = "method.{methodology_element}"

  // ── Sigmoid normalization ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "method.sigmoid_normalization",
    madhab: "cross_school",
    chapter: "Al-Zalzalah (99:7-8)",
    passageAr: "فمن يعمل مثقال ذرّة خيرا يره ومن يعمل مثقال ذرّة شرّا يره",
    passageFr: "Quiconque fait un bien, fût-ce du poids d'un atome, le verra. Et quiconque fait un mal, fût-ce du poids d'un atome, le verra.",
    relevanceFr: "La normalisation sigmoïde (K=0.06, centrée sur raw=0) s'inspire du principe coranique de proportionnalité : chaque indicateur compte, mais les premiers pas vers la rigueur (passer de 0 à « quelques contrôles ») comptent proportionnellement plus que les derniers (passer de « très rigoureux » à « parfait »). La sigmoïde compresse les extrêmes et étire le milieu — là où se situent la majorité des organismes, là où la différenciation est la plus utile au consommateur.",
    displayOrder: 0,
  },

  // ── NULL positive penalty (-3) ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "method.null_positive_penalty",
    madhab: "cross_school",
    chapter: "Al-Baqarah (2:42)",
    passageAr: "ولا تلبسوا الحقّ بالباطل وتكتموا الحقّ وأنتم تعلمون",
    passageFr: "Ne mêlez pas le vrai au faux et ne cachez pas la vérité alors que vous la connaissez.",
    relevanceFr: "La pénalité de -3 pour les indicateurs positifs inconnus (null) est justifiée par le principe coranique de transparence : un organisme qui refuse de confirmer une pratique positive (contrôleurs salariés, présence systématique, sacrificateurs dédiés) suscite un doute légitime. null ≠ false (« nous ne le faisons pas ») — null = « nous ne voulons pas répondre », ce qui mérite une pénalité proportionnée mais distincte de false (qui vaut 0). -3 vs +15 = 20% de la valeur positive, une pénalité mesurée mais non-nulle.",
    displayOrder: 0,
  },

  // ── Controversy time decay ──
  {
    sourceId: "quran",
    domain: "trust_score",
    contextKey: "method.controversy_time_decay",
    madhab: "cross_school",
    chapter: "Al-Furqan (25:70-71)",
    passageAr: "إلا من تاب وآمن وعمل عملا صالحا فأولئك يبدّل الله سيّئاتهم حسنات",
    passageFr: "Sauf celui qui se repent, croit et accomplit de bonnes œuvres : à ceux-là, Allah changera leurs mauvaises actions en bonnes.",
    relevanceFr: "La décroissance exponentielle des controverses (demi-vie = 5 ans, λ = ln(2)/5 ≈ 0.1386) est fondée sur le principe coranique de tawbah (repentir) : les erreurs passées ne doivent pas condamner éternellement un organisme qui s'améliore. Après 5 ans, l'impact est divisé par 2 ; après 10 ans, par 4 ; après 15 ans, par 8. Les événements résolus (isActive=false) sont exclus immédiatement. Le choix de 5 ans reflète un cycle raisonnable de renouvellement organisationnel (direction, processus, personnel).",
    displayOrder: 0,
  },
  {
    sourceId: "jami-tirmidhi",
    domain: "trust_score",
    contextKey: "method.controversy_time_decay",
    madhab: "cross_school",
    passageAr: "التائب من الذنب كمن لا ذنب له",
    passageFr: "Celui qui se repent de son péché est comme celui qui n'a pas de péché. (Hadith, rapporté par Ibn Majah, classé hasan par al-Tirmidhi)",
    relevanceFr: "Fondement hadithique du principe de decay : une organisation qui corrige ses défaillances mérite progressivement de retrouver la confiance. La demi-vie de 5 ans opérationnalise ce principe — ni trop rapide (< 2 ans = impunité), ni trop lente (> 10 ans = condamnation permanente).",
    displayOrder: 1,
  },

  // ── Scoring philosophy: why these 9+3 indicators ──
  {
    sourceId: "codex-cac-gl-24",
    domain: "trust_score",
    contextKey: "method.scoring_philosophy",
    madhab: "cross_school",
    passageFr: "Les 9 indicateurs de pratique + 3 indicateurs de transparence couvrent les 3 dimensions de la confiance halal : (1) L'ACTE — conditions de la dhakāh : conscience de l'animal, tasmiya, méthode de saignée (stunning, electronarcosis, mechanical) ; (2) La QUALITÉ — Tayyib : VSM, indépendance du sacrificateur ; (3) L'ORGANISATION — transparence, contrôle, controverses. Le Codex Alimentarius CAC/GL 24-1997 établit ces 3 dimensions comme fondamentales pour l'usage du terme halal.",
    relevanceFr: "Justifie le choix des 12 indicateurs : chaque indicateur correspond à un critère vérifiable et objectif, aligné sur les normes internationales et les principes fiqhiques classiques. Aucun indicateur subjectif ou invérifiable n'est inclus.",
    displayOrder: 0,
  },
  {
    sourceId: "oic-smiic-1",
    domain: "trust_score",
    contextKey: "method.scoring_philosophy",
    madhab: "cross_school",
    passageFr: "La norme OIC/SMIIC 1:2011 (§5.1-5.4) définit les exigences halal en 4 catégories : abattage (dhakāh), transformation (processing), emballage (packaging), traçabilité (traceability). Nos 9 indicateurs de pratique couvrent la première catégorie (la plus discriminante entre organismes), et nos 3 indicateurs de transparence couvrent la traçabilité organisationnelle.",
    relevanceFr: "Alignement de notre modèle sur la norme OIC : chaque indicateur correspond à une exigence mesurable de la norme internationale.",
    displayOrder: 1,
  },

  // ── Per-madhab weight differentiation rationale ──
  {
    sourceId: "majmu-al-fatawa",
    domain: "trust_score",
    contextKey: "method.per_madhab_differentiation",
    madhab: "cross_school",
    volume: "20",
    page: "363-367",
    passageFr: "Ibn Taymiyya dans Majmu' al-Fatawa (vol. 20, p. 363-367) explique que les divergences entre écoles (ikhtilāf) sur les questions d'abattage sont légitimes car fondées sur des interprétations différentes des textes fondateurs, et non sur des erreurs. Le système de pondération per-madhab de Naqiy respecte ce principe : chaque école reçoit des poids reflétant SA lecture des textes, pas une lecture unique imposée.",
    relevanceFr: "Justifie l'architecture per-madhab : le Naqiy Trust Index n'impose pas UNE lecture mais propose 5 scores (universal + 4 madhabs). Ibn Taymiyya valide cette approche en reconnaissant la légitimité de l'ikhtilāf.",
    displayOrder: 0,
  },

  // ════════════════════════════════════════════════════════
  // GENERAL FIQH PRINCIPLES — Foundational concepts
  // ════════════════════════════════════════════════════════
  // Convention: contextKey = "principle.{concept_slug}"
  // These are not tied to specific weights but to underlying
  // concepts referenced across the entire scoring system.

  // ── Dhakāh (abattage rituel) ──
  {
    sourceId: "quran",
    domain: "general_fiqh",
    contextKey: "principle.dhakah",
    madhab: "cross_school",
    chapter: "Al-Ma'idah (5:3)",
    passageAr: "حرّمت عليكم الميتة والدم ولحم الخنزير وما أهلّ لغير الله به والمنخنقة والموقوذة والمتردّية والنطيحة وما أكل السبع إلا ما ذكّيتم",
    passageFr: "Vous sont interdits la bête morte (al-maytah), le sang, la chair de porc, ce sur quoi on a invoqué un autre nom que celui d'Allah, la bête étouffée, la bête assommée, la bête morte d'une chute, la bête morte d'un coup de corne, et celle qu'une bête féroce a dévorée — sauf ce que vous avez purifié par l'abattage rituel (dhakāh).",
    relevanceFr: "Verset fondateur de l'ensemble du système d'abattage rituel. La dhakāh est le seul acte qui rend licite un animal autrement interdit (al-munkhaniqa, al-mawqūdha, etc.). Toute la logique du Trust Index repose sur la validité de cet acte.",
    displayOrder: 0,
  },

  // ── Tasmiya (invocation du nom d'Allah) ──
  {
    sourceId: "quran",
    domain: "general_fiqh",
    contextKey: "principle.tasmiya",
    madhab: "cross_school",
    chapter: "Al-An'am (6:118-121)",
    passageAr: "فكلوا مما ذكر اسم الله عليه إن كنتم بآياته مؤمنين [...] ولا تأكلوا مما لم يذكر اسم الله عليه وإنّه لفسق",
    passageFr: "Mangez de ce sur quoi le nom d'Allah a été invoqué, si vous croyez en Ses signes. [...] Ne mangez pas de ce sur quoi le nom d'Allah n'a pas été invoqué, car ce serait une transgression (fisq).",
    relevanceFr: "Fondement coranique de l'exigence de tasmiya — l'invocation du nom d'Allah sur chaque animal est la condition la plus universellement reconnue de la dhakāh. C'est le principal argument contre l'abattage mécanique (impossibilité de tasmiya individuelle par une machine).",
    displayOrder: 0,
  },
  {
    sourceId: "sahih-bukhari",
    domain: "general_fiqh",
    contextKey: "principle.tasmiya",
    madhab: "cross_school",
    passageAr: "ما أنهر الدم وذكر اسم الله عليه فكلوا",
    passageFr: "Ce qui fait couler le sang et sur quoi le nom d'Allah a été invoqué, mangez-en. (Hadith de Rafi' ibn Khadij, Sahih al-Bukhari 5498)",
    relevanceFr: "Hadith de référence pour les deux conditions de base de la dhakāh : (1) faire couler le sang (inhār al-dam) et (2) invoquer le nom d'Allah (tasmiya). Ces deux conditions fondent la distinction halal/haram pour toutes les écoles.",
    displayOrder: 1,
  },

  // ── Hayāh mustaqqirrah (vie stable) ──
  {
    sourceId: "al-majmu",
    domain: "general_fiqh",
    contextKey: "principle.hayah_mustaqqirrah",
    madhab: "cross_school",
    volume: "9",
    page: "75-89",
    passageAr: "الحياة المستقرّة هي أن يكون الحيوان قادرا على الحركة الاختيارية",
    passageFr: "La vie stable (hayāh mustaqqirrah) est que l'animal soit capable de mouvement volontaire.",
    relevanceFr: "Concept central du débat sur le stunning : la hayāh mustaqqirrah est la condition qui détermine si un animal étourdi peut encore être validement abattu. Les 4 écoles s'accordent sur le concept mais divergent sur le seuil d'évaluation. Le poids du stunning (-10 à -25 selon l'école) est directement corrélé à la rigueur d'évaluation de la hayāh mustaqqirrah.",
    displayOrder: 0,
  },

  // ── Tayyib (pureté/qualité) ──
  {
    sourceId: "quran",
    domain: "general_fiqh",
    contextKey: "principle.tayyib",
    madhab: "cross_school",
    chapter: "Al-A'raf (7:157)",
    passageAr: "ويحلّ لهم الطيّبات ويحرّم عليهم الخبائث",
    passageFr: "Il leur rend licites les bonnes choses (al-tayyibāt) et leur interdit les mauvaises (al-khabā'ith).",
    relevanceFr: "Le principe de Tayyib est le fondement de la pénalité VSM et, plus largement, de l'exigence de qualité au-delà de la simple validité technique de la dhakāh. Les écoles divergent sur le caractère obligatoire (wājib) vs recommandé (mustahabb) du Tayyib — d'où les poids VSM variables (-5 malikite à -10 hanafite/hanbalite).",
    displayOrder: 0,
  },

  // ── Maytah (bête morte non-rituellement abattue) ──
  {
    sourceId: "quran",
    domain: "general_fiqh",
    contextKey: "principle.maytah",
    madhab: "cross_school",
    chapter: "Al-Ma'idah (5:3)",
    passageAr: "حرّمت عليكم الميتة",
    passageFr: "Vous est interdite la bête morte (al-maytah).",
    relevanceFr: "La maytah est l'animal qui meurt sans dhakāh valide. C'est le risque fondamental du stunning : si l'animal meurt du choc AVANT la saignée, il est maytah et donc haram. Toute la pénalité stunning/electronarcosis repose sur ce risque — plus le risque de maytah est élevé, plus la pénalité est forte.",
    displayOrder: 0,
  },

  // ── Khabā'ith (choses répugnantes) ──
  {
    sourceId: "quran",
    domain: "general_fiqh",
    contextKey: "principle.khabaith",
    madhab: "cross_school",
    chapter: "Al-A'raf (7:157)",
    passageAr: "ويحرّم عليهم الخبائث",
    passageFr: "Et Il leur interdit les mauvaises choses (al-khabā'ith).",
    relevanceFr: "Le concept de khabā'ith (choses répugnantes/mauvaises) est la base de la pénalité VSM. La viande séparée mécaniquement est considérée comme khabīth car le processus industriel (récupération de résidus de viande par pression mécanique sur les os) produit un résultat qualitativement inférieur et potentiellement dégradant.",
    displayOrder: 0,
  },

  // ── Sadd al-dharā'i' (fermeture des voies menant à l'interdit) ──
  {
    sourceId: "majmu-al-fatawa",
    domain: "general_fiqh",
    contextKey: "principle.sadd_al_dharai",
    madhab: "cross_school",
    volume: "23",
    page: "186-195",
    passageFr: "Ibn Taymiyya dans Majmu' al-Fatawa (vol. 23, p. 186-195) : « Sadd al-dharā'i' consiste à interdire ce qui est en soi permis si cela mène à ce qui est interdit ». Principe fondamental du fiqh hanbalite, appliqué au stunning : même si l'étourdissement ne tue pas systématiquement l'animal, le RISQUE qu'il cause la mort avant la saignée suffit à justifier son interdiction par précaution.",
    relevanceFr: "Fondement théorique de l'approche hanbalite (et partiellement hanafite) du stunning. Explique pourquoi ces deux écoles imposent les pénalités les plus fortes (-25) : le risque suffit, pas besoin de certitude.",
    displayOrder: 0,
  },

  // ── Ihtiyāt (précaution) ──
  {
    sourceId: "al-mughni",
    domain: "general_fiqh",
    contextKey: "principle.ihtiyat",
    madhab: "cross_school",
    volume: "13",
    page: "290-295",
    passageFr: "Le principe d'ihtiyāt (précaution) dans le fiqh de l'abattage selon Ibn Qudama : en cas de doute sur la validité de la dhakāh, la précaution exige de considérer la viande comme non-licite. « ولا يحلّ أكل ما شُكّ في ذكاته » — Il n'est pas licite de consommer ce dont on doute de la validité de l'abattage.",
    relevanceFr: "Principe directeur de l'ensemble du système de scoring : chaque pénalité est proportionnelle au DOUTE que la pratique crée sur la validité de la dhakāh. Plus le doute est fort (stunning = forte incertitude), plus la pénalité est élevée.",
    displayOrder: 0,
  },
  {
    sourceId: "jami-tirmidhi",
    domain: "general_fiqh",
    contextKey: "principle.ihtiyat",
    madhab: "cross_school",
    passageAr: "دع ما يريبك إلى ما لا يريبك",
    passageFr: "Laisse ce qui te fait douter pour ce qui ne te fait pas douter. (Hadith de Hasan ibn Ali, Jami' al-Tirmidhi 2518)",
    relevanceFr: "Hadith fondateur du principe de précaution (ihtiyāt). Base de la position hanbalite et source utilisée par les 4 écoles pour justifier l'évitement des zones de doute (shubuhāt) en matière alimentaire.",
    displayOrder: 1,
  },

  // ── Niyyah (intention) ──
  {
    sourceId: "sahih-bukhari",
    domain: "general_fiqh",
    contextKey: "principle.niyyah",
    madhab: "cross_school",
    passageAr: "إنما الأعمال بالنيّات وإنما لكلّ امرئ ما نوى",
    passageFr: "Les actes ne valent que par les intentions, et chacun n'obtient que ce qu'il a voulu. (Hadith de 'Umar ibn al-Khattab, Sahih al-Bukhari 1)",
    relevanceFr: "Le premier hadith du Sahih al-Bukhari fonde l'exigence de niyyah dans l'abattage. C'est l'argument principal contre l'abattage mécanique : une machine n'a pas d'intention. Le poids mécanique (-8 à -20 selon l'école) est directement lié à l'importance que chaque école accorde à la niyyah dans la dhakāh.",
    displayOrder: 0,
  },

  // ── Ihsān (excellence) ──
  {
    sourceId: "sahih-muslim",
    domain: "general_fiqh",
    contextKey: "principle.ihsan",
    madhab: "cross_school",
    passageAr: "إنّ الله كتب الإحسان على كلّ شيء، فإذا قتلتم فأحسنوا القتلة وإذا ذبحتم فأحسنوا الذبح، وليحدّ أحدكم شفرته وليرح ذبيحته",
    passageFr: "Allah a prescrit l'excellence (ihsān) en toute chose. Quand vous tuez, faites-le avec excellence. Quand vous abattez, faites-le avec excellence. Que l'un de vous aiguise sa lame et qu'il soulage sa bête. (Hadith de Shaddad ibn Aws, Sahih Muslim 1955)",
    relevanceFr: "Hadith fondateur du bien-être animal en Islam et de l'exigence d'excellence dans l'abattage. Fondement des indicateurs positifs du Trust Index : la présence de contrôleurs, l'indépendance du sacrificateur, et la transparence sont des manifestations de l'ihsān dans le processus de certification.",
    displayOrder: 0,
  },

  // ── Istikhfāf (négligence/mépris) ──
  {
    sourceId: "al-umm",
    domain: "general_fiqh",
    contextKey: "principle.istikhfaf",
    madhab: "shafii",
    passageFr: "L'imam al-Shafi'i dans al-Umm développe le concept d'istikhfāf (négligence/mépris) envers les actes rituels : toute attitude qui dénote un mépris ou une négligence envers la dignité d'un acte prescrit invalide cet acte. Appliqué à l'abattage, l'industrialisation excessive (abattage mécanique, cadences prohibitives) constitue un istikhfāf de la dhakāh.",
    relevanceFr: "Concept spécifiquement chafiite fondant le rejet de l'abattage mécanique (-18 dans l'école chafiite). L'istikhfāf est le fondement théorique le plus original de cette école sur la question.",
    displayOrder: 0,
  },

  // ── Shubuhāt (zones de doute) ──
  {
    sourceId: "sahih-bukhari",
    domain: "general_fiqh",
    contextKey: "principle.shubuhat",
    madhab: "cross_school",
    passageAr: "الحلال بيّن والحرام بيّن وبينهما أمور مشتبهات لا يعلمهنّ كثير من الناس، فمن اتّقى الشبهات فقد استبرأ لدينه وعرضه",
    passageFr: "Le licite est clair et l'illicite est clair, et entre les deux il y a des choses ambiguës (mushabbahāt) que beaucoup de gens ne connaissent pas. Celui qui se prémunit contre les ambiguïtés a préservé sa religion et son honneur. (Hadith de Nu'man ibn Bashir, Sahih al-Bukhari 52)",
    relevanceFr: "Hadith fondamental pour le concept de shubuhāt (zones de doute). L'électronarcose et le stunning se situent dans cette zone : ni clairement haram (si réversible) ni clairement halal (risque de mort pré-dhakāh). Les pénalités variables entre écoles reflètent leur positionnement différent vis-à-vis des shubuhāt.",
    displayOrder: 0,
  },

  // ── Murāqabah (surveillance/contrôle) ──
  {
    sourceId: "quran",
    domain: "general_fiqh",
    contextKey: "principle.muraqabah",
    madhab: "cross_school",
    chapter: "Al-Nisa (4:1)",
    passageAr: "إنّ الله كان عليكم رقيبا",
    passageFr: "Allah est certes un Observateur attentif (raqīb) sur vous.",
    relevanceFr: "Le concept de murāqabah (surveillance) est le fondement théologique des indicateurs organisationnels du Trust Index : si Allah observe (raqīb), les organismes de certification doivent aussi observer (contrôleurs présents à chaque production, audits réguliers). La présence de contrôleurs (+15) et la transparence (+3×3) sont des manifestations humaines de la murāqabah divine.",
    displayOrder: 0,
  },
];

// ================================================================
// SEED FUNCTION
// ================================================================

export async function seedScholarly(db: PostgresJsDatabase): Promise<number> {
  let count = 0;

  // Phase 1: Upsert sources (must be first — citations reference them)
  for (const source of SOURCES) {
    await db
      .insert(scholarlySources)
      .values(source)
      .onConflictDoUpdate({
        target: scholarlySources.id,
        set: {
          titleAr: source.titleAr,
          titleFr: source.titleFr,
          titleEn: source.titleEn,
          authorAr: source.authorAr,
          authorFr: source.authorFr,
          sourceType: source.sourceType,
          primaryMadhab: source.primaryMadhab,
          centuryHijri: source.centuryHijri,
          yearPublished: source.yearPublished,
          externalUrl: source.externalUrl,
          isbn: source.isbn,
          descriptionFr: source.descriptionFr,
          descriptionAr: source.descriptionAr,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  // Phase 2: Upsert citations (uses unique index on source+domain+contextKey+madhab)
  for (const citation of CITATIONS) {
    await db
      .insert(scholarlyCitations)
      .values(citation)
      .onConflictDoUpdate({
        target: [
          scholarlyCitations.sourceId,
          scholarlyCitations.domain,
          scholarlyCitations.contextKey,
          scholarlyCitations.madhab,
        ],
        set: {
          volume: citation.volume,
          page: citation.page,
          chapter: citation.chapter,
          passageAr: citation.passageAr,
          passageFr: citation.passageFr,
          passageEn: citation.passageEn,
          relevanceFr: citation.relevanceFr,
          relevanceAr: citation.relevanceAr,
          displayOrder: citation.displayOrder,
          updatedAt: new Date(),
        },
      });
    count++;
  }

  return count;
}
