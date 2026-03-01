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
    compoundPattern: "vinaigre d'alcool",
    matchType: "contains",
    priority: 115,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "halal",
    confidence: 0.8,
    explanationFr:
      "Le vinaigre d'alcool (vinaigre blanc) est produit par fermentation acétique d'éthanol de betterave ou de céréales. La question fiqhique n'est pas « le vinaigre est-il halal ? » (oui, par consensus — Muslim 2051), mais « le takhllil délibéré (transformer volontairement l'alcool en vinaigre) rend-il le produit impur ? »\n\n" +
      "— Hanafites : HALAL. L'istihala (استحالة) est acceptée largement : quand une substance change de nature, le nouveau produit prend son propre statut. Le vinaigre n'est plus du khamr, qu'il se soit formé naturellement ou par intervention humaine. Le hadith de Muslim 1983 est interprété comme une recommandation de ne pas conserver du vin (pour éviter la tentation), non comme une interdiction du vinaigre résultant. (Al-Kasani, Bada'i al-Sana'i 5/113 ; Ibn Abidin, Radd al-Muhtar 1/316)\n\n" +
      "— Hanbalites : HALAL (position prédominante). Ibn Uthaymeen : halal si le vinaigre est produit par des non-musulmans ou si la transformation est complète (Ash-Sharh al-Mumti' 1/415). Ibn Taymiyya : l'istihala purifie, même délibérée (Majmoo' al-Fataawa 21/483-502). Position minoritaire classique : takhllil makrouh. Le vinaigre d'alcool industriel : halal car produit dans un contexte non-musulman avec transformation complète.\n\n" +
      "— Chafiites : DOUTEUX (position classique). Le vinaigre naturel est halal, mais le takhllil délibéré rend le vinaigre najis (impur). Fondement : Muslim 1983 — le Prophète ﷺ a dit « Non » quand Abu Talha lui a demandé de transformer le vin en vinaigre. (An-Nawawi, Al-Majmoo' 1/225 et 9/232 ; Ar-Ramli, Nihayat al-Muhtaj 1/242). Cependant, des savants Chafiites contemporains (Dar al-Ifta al-Misriyyah) acceptent le vinaigre industriel car l'éthanol de betterave n'est pas du khamr au sens classique.\n\n" +
      "— Malikites : DOUTEUX (position classique). L'istihala du khamr par takhllil est interdite, le vinaigre résultant reste najis. (Ibn Rushd, Bidayat al-Mujtahid 1/79 ; Khalil, Mukhtasar — chapitre de la purification). Cependant, la position malikite concerne le khamr (vin de raisin). L'éthanol industriel de betterave/céréales n'est pas du khamr au sens strict. Des savants malikites contemporains (ECFR) considèrent le vinaigre d'alcool comme halal.\n\n" +
      "Tableau — Takhllil délibéré :\n" +
      "• Hanafi : Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali : Halal (majorité) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i : Najis classique / Halal contemporain — Nawawi, Majmoo' 9/232\n" +
      "• Maliki : Najis classique / Halal contemporain — Bidayat al-Mujtahid 1/79",
    explanationEn:
      "Spirit vinegar (white vinegar) is produced by acetic fermentation of ethanol from sugar beet or grain. The fiqh question is not 'Is vinegar halal?' (yes, by consensus — Muslim 2051), but 'Does deliberate takhllil (intentionally turning alcohol into vinegar) render the product impure?'\n\n" +
      "— Hanafi: HALAL. Istihala (استحالة) is broadly accepted: when a substance changes its essential nature, the new product takes its own ruling. Vinegar is no longer khamr, whether it formed naturally or through human intervention. The hadith (Muslim 1983) is interpreted as discouraging keeping wine (to avoid temptation), not as prohibiting the resulting vinegar. (Al-Kasani, Bada'i al-Sana'i 5/113; Ibn Abidin, Radd al-Muhtar 1/316)\n\n" +
      "— Hanbali: HALAL (predominant view). Ibn Uthaymeen: halal if vinegar is produced by non-Muslims or if the transformation is complete (Ash-Sharh al-Mumti' 1/415). Ibn Taymiyya: istihala purifies even when deliberate (Majmoo' al-Fataawa 21/483-502). Minority classical position: takhllil is makrooh. Industrial spirit vinegar: halal as produced in a non-Muslim context with complete transformation.\n\n" +
      "— Shafi'i: DOUBTFUL (classical position). Natural vinegar is halal, but deliberate takhllil renders vinegar najis (impure). Basis: Muslim 1983 — the Prophet ﷺ said 'No' when Abu Talha asked to turn wine into vinegar. (An-Nawawi, Al-Majmoo' 1/225 & 9/232; Ar-Ramli, Nihayat al-Muhtaj 1/242). However, contemporary Shafi'i scholars (Dar al-Ifta al-Misriyyah) accept industrial vinegar since beet ethanol is not khamr in the classical sense.\n\n" +
      "— Maliki: DOUBTFUL (classical position). Istihala of khamr through takhllil is forbidden; the resulting vinegar remains najis. (Ibn Rushd, Bidayat al-Mujtahid 1/79; Khalil, Mukhtasar — purification chapter). However, the Maliki position concerns khamr (grape wine). Industrial ethanol from beet/grain is not khamr in the strict sense. Contemporary Maliki scholars (ECFR) consider spirit vinegar halal.\n\n" +
      "Summary — Deliberate takhllil:\n" +
      "• Hanafi: Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali: Halal (majority) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i: Najis classical / Halal contemporary — Nawawi, Majmoo' 9/232\n" +
      "• Maliki: Najis classical / Halal contemporary — Bidayat al-Mujtahid 1/79",
    explanationAr:
      "خل الكحول (الخل الأبيض) يُنتج بالتخمّر الخلّي للإيثانول المستخرج من البنجر أو الحبوب. السؤال الفقهي ليس « هل الخل حلال؟ » (نعم بالإجماع — مسلم 2051)، بل « هل التخليل المتعمّد (تحويل الكحول إلى خل عمداً) يجعل المنتج نجساً؟ »\n\n" +
      "— الحنفية: حلال. الاستحالة مقبولة على نطاق واسع: إذا تغيّرت طبيعة المادة، يأخذ المنتج الجديد حكمه الخاص. الخل لم يعد خمراً سواء تكوّن طبيعياً أو بتدخّل بشري. حديث مسلم 1983 يُفسَّر على أنه نهي عن الاحتفاظ بالخمر (لدرء الفتنة) لا نهي عن الخل الناتج. (الكاساني، بدائع الصنائع 5/113؛ ابن عابدين، ردّ المحتار 1/316)\n\n" +
      "— الحنابلة: حلال (الرأي الراجح). ابن عثيمين: حلال إذا صنعه غير المسلمين أو إذا تمّت الاستحالة بالكامل (الشرح الممتع 1/415). ابن تيمية: الاستحالة تطهّر حتى لو كانت متعمّدة (مجموع الفتاوى 21/483-502). رأي أقلية كلاسيكي: التخليل مكروه. خل الكحول الصناعي: حلال لأنه يُنتج في سياق غير إسلامي مع استحالة كاملة.\n\n" +
      "— الشافعية: مشكوك فيه (الرأي الكلاسيكي). الخل الطبيعي حلال، لكن التخليل المتعمّد يجعل الخل نجساً. الأساس: مسلم 1983 — قال النبي ﷺ « لا » عندما سأله أبو طلحة عن تحويل الخمر إلى خل. (النووي، المجموع 1/225 و9/232؛ الرملي، نهاية المحتاج 1/242). ومع ذلك، يقبل العلماء الشافعيون المعاصرون (دار الإفتاء المصرية) الخل الصناعي لأن إيثانول البنجر ليس خمراً بالمعنى الكلاسيكي.\n\n" +
      "— المالكية: مشكوك فيه (الرأي الكلاسيكي). استحالة الخمر بالتخليل محرّمة، والخل الناتج يبقى نجساً. (ابن رشد، بداية المجتهد 1/79؛ خليل، المختصر — باب الطهارة). لكن الموقف المالكي يخصّ الخمر (نبيذ العنب). الإيثانول الصناعي من البنجر/الحبوب ليس خمراً بالمعنى الدقيق. العلماء المالكيون المعاصرون (المجلس الأوروبي للإفتاء) يعتبرون خل الكحول حلالاً.\n\n" +
      "ملخّص — التخليل المتعمّد:\n" +
      "• حنفي: حلال — بدائع الصنائع 5/113\n" +
      "• حنبلي: حلال (الأغلبية) — ابن تيمية، المجموع 21/483\n" +
      "• شافعي: نجس كلاسيكياً / حلال معاصراً — النووي، المجموع 9/232\n" +
      "• مالكي: نجس كلاسيكياً / حلال معاصراً — بداية المجتهد 1/79",
    scholarlyReference: "Muslim 2051, Muslim 1983, Abu Dawud 3675, Al-Kasani Bada'i al-Sana'i 5/113, Ibn Abidin Radd al-Muhtar 1/316, Ibn Taymiyya Majmoo' 21/483-502, Ibn Uthaymeen Ash-Sharh al-Mumti' 1/415, Nawawi Al-Majmoo' 9/232, Ar-Ramli Nihayat al-Muhtaj 1/242, Ibn Rushd Bidayat al-Mujtahid 1/79",
    fatwaSourceUrl: "https://islamqa.info/en/answers/2283",
    fatwaSourceName: "IslamQA #2283, ECFR, Dar al-Ifta al-Misriyyah",
    overridesKeyword: "alcool",
    category: "vinegar",
  },
  {
    compoundPattern: "spirit vinegar",
    matchType: "contains",
    priority: 115,
    rulingDefault: "halal",
    rulingHanafi: "halal",
    rulingShafii: "doubtful",
    rulingMaliki: "doubtful",
    rulingHanbali: "halal",
    confidence: 0.8,
    explanationFr:
      "Le vinaigre d'alcool (spirit vinegar) est produit par fermentation acétique d'éthanol de betterave ou de céréales. La question fiqhique n'est pas « le vinaigre est-il halal ? » (oui, par consensus — Muslim 2051), mais « le takhllil délibéré (transformer volontairement l'alcool en vinaigre) rend-il le produit impur ? »\n\n" +
      "— Hanafites : HALAL. L'istihala (استحالة) est acceptée largement : quand une substance change de nature, le nouveau produit prend son propre statut. Le vinaigre n'est plus du khamr, qu'il se soit formé naturellement ou par intervention humaine. (Al-Kasani, Bada'i al-Sana'i 5/113 ; Ibn Abidin, Radd al-Muhtar 1/316)\n\n" +
      "— Hanbalites : HALAL (position prédominante). Ibn Uthaymeen : halal si le vinaigre est produit par des non-musulmans ou si la transformation est complète (Ash-Sharh al-Mumti' 1/415). Ibn Taymiyya : l'istihala purifie, même délibérée (Majmoo' al-Fataawa 21/483-502).\n\n" +
      "— Chafiites : DOUTEUX (position classique). Le takhllil délibéré rend le vinaigre najis. Fondement : Muslim 1983 — le Prophète ﷺ a dit « Non » quand Abu Talha lui a demandé de transformer le vin en vinaigre. (Nawawi, Al-Majmoo' 9/232). Des contemporains (Dar al-Ifta) acceptent le vinaigre industriel.\n\n" +
      "— Malikites : DOUTEUX (position classique). L'istihala du khamr par takhllil est interdite. (Ibn Rushd, Bidayat al-Mujtahid 1/79). Cependant, l'éthanol industriel n'est pas du khamr au sens strict. Des contemporains (ECFR) le considèrent halal.\n\n" +
      "Tableau — Takhllil délibéré :\n" +
      "• Hanafi : Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali : Halal (majorité) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i : Najis classique / Halal contemporain — Nawawi, Majmoo' 9/232\n" +
      "• Maliki : Najis classique / Halal contemporain — Bidayat al-Mujtahid 1/79",
    explanationEn:
      "Spirit vinegar is produced by acetic fermentation of ethanol from sugar beet or grain. The fiqh question is not 'Is vinegar halal?' (yes, by consensus — Muslim 2051), but 'Does deliberate takhllil (intentionally turning alcohol into vinegar) render the product impure?'\n\n" +
      "— Hanafi: HALAL. Istihala (استحالة) is broadly accepted: when a substance changes its essential nature, the new product takes its own ruling. Vinegar is no longer khamr. (Al-Kasani, Bada'i al-Sana'i 5/113; Ibn Abidin, Radd al-Muhtar 1/316)\n\n" +
      "— Hanbali: HALAL (predominant view). Ibn Uthaymeen: halal if produced by non-Muslims or if transformation is complete (Ash-Sharh al-Mumti' 1/415). Ibn Taymiyya: istihala purifies even when deliberate (Majmoo' 21/483-502).\n\n" +
      "— Shafi'i: DOUBTFUL (classical position). Deliberate takhllil renders vinegar najis. Basis: Muslim 1983 — the Prophet ﷺ said 'No' when asked to turn wine into vinegar. (Nawawi, Al-Majmoo' 9/232). Contemporary scholars (Dar al-Ifta) accept industrial vinegar.\n\n" +
      "— Maliki: DOUBTFUL (classical position). Istihala of khamr through takhllil is forbidden. (Ibn Rushd, Bidayat al-Mujtahid 1/79). However, industrial ethanol is not khamr in the strict sense. Contemporary scholars (ECFR) consider it halal.\n\n" +
      "Summary — Deliberate takhllil:\n" +
      "• Hanafi: Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali: Halal (majority) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i: Najis classical / Halal contemporary — Nawawi, Majmoo' 9/232\n" +
      "• Maliki: Najis classical / Halal contemporary — Bidayat al-Mujtahid 1/79",
    explanationAr:
      "خل الكحول يُنتج بالتخمّر الخلّي للإيثانول من البنجر أو الحبوب. السؤال الفقهي ليس « هل الخل حلال؟ » (نعم بالإجماع — مسلم 2051)، بل « هل التخليل المتعمّد يجعل المنتج نجساً؟ »\n\n" +
      "— الحنفية: حلال. الاستحالة مقبولة: إذا تغيّرت طبيعة المادة يأخذ المنتج الجديد حكمه الخاص. (الكاساني، بدائع الصنائع 5/113؛ ابن عابدين، ردّ المحتار 1/316)\n\n" +
      "— الحنابلة: حلال (الراجح). ابن عثيمين: حلال إذا صنعه غير المسلمين أو تمّت الاستحالة (الشرح الممتع 1/415). ابن تيمية: الاستحالة تطهّر حتى لو كانت متعمّدة (المجموع 21/483-502).\n\n" +
      "— الشافعية: مشكوك فيه (كلاسيكياً). التخليل المتعمّد يجعل الخل نجساً. مسلم 1983 — قال النبي ﷺ « لا » لأبي طلحة. (النووي، المجموع 9/232). المعاصرون (دار الإفتاء) يقبلون الخل الصناعي.\n\n" +
      "— المالكية: مشكوك فيه (كلاسيكياً). استحالة الخمر بالتخليل محرّمة. (ابن رشد، بداية المجتهد 1/79). لكن الإيثانول الصناعي ليس خمراً. المعاصرون (المجلس الأوروبي للإفتاء) يعتبرونه حلالاً.\n\n" +
      "ملخّص — التخليل المتعمّد:\n" +
      "• حنفي: حلال — بدائع الصنائع 5/113\n" +
      "• حنبلي: حلال (الأغلبية) — ابن تيمية، المجموع 21/483\n" +
      "• شافعي: نجس كلاسيكياً / حلال معاصراً — النووي، المجموع 9/232\n" +
      "• مالكي: نجس كلاسيكياً / حلال معاصراً — بداية المجتهد 1/79",
    scholarlyReference: "Muslim 2051, Muslim 1983, Abu Dawud 3675, Al-Kasani Bada'i al-Sana'i 5/113, Ibn Abidin Radd al-Muhtar 1/316, Ibn Taymiyya Majmoo' 21/483-502, Ibn Uthaymeen Ash-Sharh al-Mumti' 1/415, Nawawi Al-Majmoo' 9/232, Ar-Ramli Nihayat al-Muhtaj 1/242, Ibn Rushd Bidayat al-Mujtahid 1/79",
    fatwaSourceUrl: "https://islamqa.info/en/answers/2283",
    fatwaSourceName: "IslamQA #2283, ECFR, Dar al-Ifta al-Misriyyah",
    overridesKeyword: "alcohol",
    category: "vinegar",
  },
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
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.95,
    explanationFr:
      "Gélatine dérivée du porc. Haram par consensus contemporain des 4 écoles. Bien que le principe théorique de l'istihala existe chez les Hanafites et Malikites, la quasi-totalité des autorités contemporaines (Deoband, Mufti Taqi Usmani, Comité permanent saoudien, IIFA) ont statué que la transformation industrielle de la gélatine n'est PAS une istihala complète au sens du fiqh classique.",
    explanationEn:
      "Pork-derived gelatin. Haram by contemporary consensus of all 4 schools. Although the theoretical principle of istihala exists in Hanafi and Maliki fiqh, virtually all contemporary authorities (Deoband, Mufti Taqi Usmani, Saudi Permanent Committee, IIFA) have ruled that industrial gelatin processing is NOT a complete istihala.",
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
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.95,
    explanationFr:
      "Gélatine porcine : haram par consensus contemporain des 4 écoles (Deoband, Mufti Taqi Usmani, IIFA). L'istihala industrielle est jugée insuffisante.",
    explanationEn:
      "Pork gelatin: haram by contemporary consensus of all 4 schools (Deoband, Mufti Taqi Usmani, IIFA). Industrial istihala deemed insufficient.",
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
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "haram",
    rulingHanbali: "haram",
    confidence: 0.95,
    explanationFr:
      "Gélatine de porc : haram par consensus contemporain des 4 écoles (Deoband, Mufti Taqi Usmani, IIFA). L'istihala industrielle est jugée insuffisante.",
    explanationEn:
      "Pork gelatin: haram by contemporary consensus of all 4 schools (Deoband, Mufti Taqi Usmani, IIFA). Industrial istihala deemed insufficient.",
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
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "halal",
    rulingHanbali: "haram",
    confidence: 0.8,
    explanationFr:
      "Carmin (E120) : colorant extrait de la cochenille (insecte). Haram selon 3 écoles (Hanafites/Chafiites/Hanbalites) : les insectes sont des « khabaith » (Coran 7:157). Halal selon les Malikites : Coran 6:145 ne mentionne que 4 interdictions explicites, les insectes n'en font pas partie (Al-Qurtubi, Al-Jami' li-Ahkam al-Qur'an).",
    explanationEn:
      "Carmine (E120): dye from cochineal insects. Haram per 3 schools (Hanafi/Shafi'i/Hanbali): insects are 'khabaith' (Quran 7:157). Halal per Maliki school: Quran 6:145 lists only 4 explicit prohibitions, insects are not among them (Al-Qurtubi, Al-Jami' li-Ahkam al-Qur'an).",
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
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "halal",
    rulingHanbali: "haram",
    confidence: 0.8,
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
    rulingDefault: "haram",
    rulingHanafi: "haram",
    rulingShafii: "haram",
    rulingMaliki: "halal",
    rulingHanbali: "haram",
    confidence: 0.8,
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
    rulingMaliki: "haram",
    rulingHanbali: "halal",
    confidence: 0.75,
    explanationFr:
      "Présure animale (source non précisée) : divergence majeure. Hanafites : halal (Abu Hanifa — la présure n'est pas un organe vivant). Hanbalites : halal (Ibn Taymiyyah, Majmu' al-Fatawa 21/102 — les Sahabas mangeaient le fromage des Zoroastriens). Chafiites : haram si non-zabiha (position mu'tamad). Malikites : haram — l'usul malékite exige la dhabiha pour toute partie de l'animal, la présure fait partie de la mayta.",
    explanationEn:
      "Animal rennet (unspecified source): major disagreement. Hanafi: halal (Abu Hanifa — rennet is not living tissue). Hanbali: halal (Ibn Taymiyyah, Majmu' al-Fatawa 21/102 — Companions ate Zoroastrian cheese). Shafi'i: haram if not zabiha (mu'tamad position). Maliki: haram — Maliki usul requires dhabiha for any animal part, rennet is part of the mayta.",
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
    rulingMaliki: "haram",
    rulingHanbali: "halal",
    confidence: 0.75,
    explanationFr:
      "Présure (source non précisée) : Hanafites/Hanbalites (Ibn Taymiyyah) : halal. Chafiites/Malikites : haram si animal non-zabiha.",
    explanationEn:
      "Rennet (unspecified): Hanafi/Hanbali (Ibn Taymiyyah): halal. Shafi'i/Maliki: haram if not zabiha.",
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
    rulingHanbali: "halal",
    confidence: 0.6,
    explanationFr:
      "Petit-lait issu de la fabrication du fromage. Le point clé : la présure utilisée. Présure végétale ou microbienne → halal. Présure animale → dépend de votre école. Hanafites/Hanbalites considèrent la présure pure. Chafiites/Malikites recommandent la prudence. Sans mention « présure microbienne » sur l'emballage, le doute subsiste.",
    explanationEn:
      "By-product of cheese making. The key factor: the rennet used. Vegetable or microbial rennet → halal. Animal rennet → depends on your school. Hanafi/Hanbali consider rennet pure. Shafi'i/Maliki advise caution. Without \"microbial rennet\" on the label, doubt remains.",
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
    rulingHanbali: "halal",
    confidence: 0.6,
    explanationFr:
      "Petit-lait issu de la fabrication du fromage. Le point clé : la présure utilisée. Présure végétale ou microbienne → halal. Présure animale → dépend de votre école. Hanafites/Hanbalites considèrent la présure pure. Chafiites/Malikites recommandent la prudence. Sans mention « présure microbienne » sur l'emballage, le doute subsiste.",
    explanationEn:
      "By-product of cheese making. The key factor: the rennet used. Vegetable or microbial rennet → halal. Animal rennet → depends on your school. Hanafi/Hanbali consider rennet pure. Shafi'i/Maliki advise caution. Without \"microbial rennet\" on the label, doubt remains.",
    scholarlyReference: "IslamWeb #198295, #321622, IslamQA #115306, Ibn Taymiyyah",
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
    rulingHanafi: null,
    rulingShafii: null,
    rulingMaliki: null,
    rulingHanbali: null,
    confidence: 0.9,
    explanationFr:
      "Mono-glycérides (E471) : émulsifiant d'origine végétale (soja, palme) ou animale (dont porc). ⚠️ En Europe, ~95 % des E471 sans mention d'origine sont dérivés de graisses animales (principalement porc). IslamQA (#114129) recommande explicitement la prudence en pays non-musulman. Seule la mention « origine végétale » sur l'emballage garantit une source licite.",
    explanationEn:
      "Mono-glycerides (E471): plant (soy, palm) or animal (including pork) derived emulsifier. ⚠️ In Europe, ~95% of E471 without a stated origin is derived from animal fats (mainly pork). IslamQA (#114129) explicitly recommends caution in non-Muslim countries. Only an explicit 'plant origin' label on the packaging guarantees a permissible source.",
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
    rulingHanafi: null,
    rulingShafii: null,
    rulingMaliki: null,
    rulingHanbali: null,
    confidence: 0.9,
    explanationFr:
      "Diglycérides : voir mono-glycérides (E471). ⚠️ ~95 % d'origine animale (porc) en Europe si non précisé. Prudence recommandée (IslamQA #114129).",
    explanationEn:
      "Diglycerides: see mono-glycerides (E471). ⚠️ ~95% animal-derived (pork) in Europe if unspecified. Caution advised (IslamQA #114129).",
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
    rulingHanafi: null,
    rulingShafii: null,
    rulingMaliki: null,
    rulingHanbali: null,
    confidence: 0.9,
    explanationFr:
      "Monoglycérides : voir mono-glycérides (E471). ⚠️ ~95 % d'origine animale (porc) en Europe si non précisé. Prudence recommandée (IslamQA #114129).",
    explanationEn:
      "Monoglycerides: see mono-glycerides (E471). ⚠️ ~95% animal-derived (pork) in Europe if unspecified. Caution advised (IslamQA #114129).",
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
    rulingHanafi: null,
    rulingShafii: null,
    rulingMaliki: null,
    rulingHanbali: null,
    confidence: 0.9,
    explanationFr:
      "E471 (Mono/diglycérides d'acides gras) : ⚠️ En Europe, ~95 % des E471 sans mention d'origine sont dérivés de graisses animales (principalement porc). IslamQA (#114129) recommande la prudence en pays non-musulman. Si « origine végétale » est indiqué sur l'emballage : halal.",
    explanationEn:
      "E471 (mono- and diglycerides of fatty acids): ⚠️ In Europe, ~95% of E471 without a stated origin is derived from animal fats (mainly pork). IslamQA (#114129) advises caution in non-Muslim countries. If 'plant origin' is stated on the packaging: halal.",
    scholarlyReference: "IslamWeb #387325, IslamQA #97541, #114129",
    fatwaSourceUrl: "https://www.islamweb.net/en/fatwa/387325",
    fatwaSourceName: "IslamWeb #387325, IslamQA #97541",
    category: "emulsifier",
    overridesKeyword: "mono-",
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
