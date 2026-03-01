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
    confidence: 0.7,
    explanationFr:
      "Le vinaigre de vin est produit par fermentation acétique du vin (khamr). Contrairement au vinaigre d'alcool (éthanol industriel), la matière première est ici du vin de raisin — le khamr au sens coranique strict. La question est plus sensible que pour le vinaigre d'alcool.\n\n" +
      "— Hanafites : HALAL. L'istihala (استحالة) transforme la substance : le vinaigre n'est plus du vin. L'interdiction porte sur le khamr en tant que substance enivrante — une fois l'éthanol transformé en acide acétique, la 'illa (cause juridique) disparaît. (Al-Kasani, Bada'i al-Sana'i 5/113 ; Ibn Abidin, Radd al-Muhtar 1/316)\n\n" +
      "— Hanbalites : HALAL (position prédominante). Ibn Taymiyya considère l'istihala comme purificatrice même si délibérée (Majmoo' 21/483-502). Ibn Uthaymeen : halal si produit par des non-musulmans, car ils ne sont pas soumis aux règles du takhllil (Ash-Sharh al-Mumti' 1/415). Le vinaigre de vin commercial européen entre dans ce cadre.\n\n" +
      "— Chafiites : DOUTEUX. Le takhllil délibéré du khamr (vin de raisin) est explicitement interdit. Muslim 1983 : le Prophète ﷺ a refusé à Abu Talha de transformer du vin en vinaigre. Le vinaigre résultant du takhllil reste najis. (An-Nawawi, Al-Majmoo' 1/225 et 9/232 ; Ar-Ramli, Nihayat al-Muhtaj 1/242). Position plus stricte que pour le vinaigre d'alcool car il s'agit de khamr littéral.\n\n" +
      "— Malikites : DOUTEUX. L'istihala du khamr par takhllil est interdite, le vinaigre résultant reste najis. (Ibn Rushd, Bidayat al-Mujtahid 1/79 ; Khalil, Mukhtasar). Ici, la matière première est du vin de raisin — cas le plus clair d'interdiction malikite.\n\n" +
      "Tableau — Vinaigre de vin (takhllil du khamr) :\n" +
      "• Hanafi : Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali : Halal (majorité) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i : Douteux — Nawawi, Majmoo' 9/232 (Muslim 1983)\n" +
      "• Maliki : Douteux — Ibn Rushd, Bidayat al-Mujtahid 1/79",
    explanationEn:
      "Wine vinegar is produced by acetic fermentation of wine (khamr). Unlike spirit vinegar (industrial ethanol), the raw material here is grape wine — khamr in the strictest Quranic sense. This makes the issue more sensitive.\n\n" +
      "— Hanafi: HALAL. Istihala (استحالة) transforms the substance: vinegar is no longer wine. The prohibition targets khamr as an intoxicating substance — once ethanol is converted to acetic acid, the 'illa (legal cause) ceases. (Al-Kasani, Bada'i al-Sana'i 5/113; Ibn Abidin, Radd al-Muhtar 1/316)\n\n" +
      "— Hanbali: HALAL (predominant view). Ibn Taymiyya considers istihala purifying even when deliberate (Majmoo' 21/483-502). Ibn Uthaymeen: halal if produced by non-Muslims, as they are not bound by takhllil rules (Ash-Sharh al-Mumti' 1/415). European commercial wine vinegar falls within this scope.\n\n" +
      "— Shafi'i: DOUBTFUL. Deliberate takhllil of khamr (grape wine) is explicitly forbidden. Muslim 1983: the Prophet ﷺ refused Abu Talha's request to turn wine into vinegar. The resulting vinegar remains najis. (An-Nawawi, Al-Majmoo' 1/225 & 9/232; Ar-Ramli, Nihayat al-Muhtaj 1/242). Stricter than for spirit vinegar since this is literal khamr.\n\n" +
      "— Maliki: DOUBTFUL. Istihala of khamr through takhllil is forbidden; the resulting vinegar remains najis. (Ibn Rushd, Bidayat al-Mujtahid 1/79; Khalil, Mukhtasar). Here, the raw material is grape wine — the clearest case for the Maliki prohibition.\n\n" +
      "Summary — Wine vinegar (takhllil of khamr):\n" +
      "• Hanafi: Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali: Halal (majority) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i: Doubtful — Nawawi, Majmoo' 9/232 (Muslim 1983)\n" +
      "• Maliki: Doubtful — Ibn Rushd, Bidayat al-Mujtahid 1/79",
    explanationAr:
      "خل الخمر يُنتج بالتخمّر الخلّي للنبيذ (الخمر). على عكس خل الكحول (إيثانول صناعي)، المادة الأولية هنا هي نبيذ العنب — الخمر بالمعنى القرآني الصريح. هذا يجعل المسألة أكثر حساسية.\n\n" +
      "— الحنفية: حلال. الاستحالة تحوّل المادة: الخل لم يعد خمراً. التحريم يستهدف الخمر كمادة مُسكرة — بمجرد تحوّل الإيثانول إلى حمض الخليك تزول العلّة. (الكاساني، بدائع الصنائع 5/113؛ ابن عابدين، ردّ المحتار 1/316)\n\n" +
      "— الحنابلة: حلال (الراجح). ابن تيمية يعتبر الاستحالة مطهّرة حتى لو متعمّدة (المجموع 21/483-502). ابن عثيمين: حلال إذا صنعه غير المسلمين لأنهم غير مخاطبين بأحكام التخليل (الشرح الممتع 1/415).\n\n" +
      "— الشافعية: مشكوك فيه. التخليل المتعمّد للخمر (نبيذ العنب) ممنوع صراحةً. مسلم 1983: رفض النبي ﷺ طلب أبي طلحة تحويل الخمر إلى خل. الخل الناتج يبقى نجساً. (النووي، المجموع 1/225 و9/232؛ الرملي، نهاية المحتاج 1/242). أشدّ من خل الكحول لأنه خمر حرفياً.\n\n" +
      "— المالكية: مشكوك فيه. استحالة الخمر بالتخليل محرّمة، والخل يبقى نجساً. (ابن رشد، بداية المجتهد 1/79؛ خليل، المختصر). المادة الأولية هنا نبيذ عنب — أوضح حالة للتحريم المالكي.\n\n" +
      "ملخّص — خل الخمر (تخليل الخمر):\n" +
      "• حنفي: حلال — بدائع الصنائع 5/113\n" +
      "• حنبلي: حلال (الأغلبية) — ابن تيمية، المجموع 21/483\n" +
      "• شافعي: مشكوك فيه — النووي، المجموع 9/232 (مسلم 1983)\n" +
      "• مالكي: مشكوك فيه — ابن رشد، بداية المجتهد 1/79",
    scholarlyReference:
      "Muslim 2051, Muslim 1983, Abu Dawud 3675, Al-Kasani Bada'i al-Sana'i 5/113, Ibn Abidin Radd al-Muhtar 1/316, Ibn Taymiyya Majmoo' 21/483-502, Ibn Uthaymeen Ash-Sharh al-Mumti' 1/415, Nawawi Al-Majmoo' 9/232, Ar-Ramli Nihayat al-Muhtaj 1/242, Ibn Rushd Bidayat al-Mujtahid 1/79",
    fatwaSourceUrl: "https://islamqa.info/en/answers/276185",
    fatwaSourceName: "IslamQA #276185, #191176, ECFR",
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
      "Le vinaigre (sans précision de type) est halal par consensus unanime des quatre écoles. Le Prophète ﷺ a dit : « Quel bon condiment que le vinaigre ! » (Muslim 2051). Jabir ibn Abdillah rapporte que le Prophète ﷺ en consommait régulièrement (Muslim 2052). La transformation naturelle du vin en vinaigre (istihala) est acceptée par toutes les écoles sans exception.",
    explanationEn:
      "Vinegar (unspecified type) is halal by unanimous consensus of all four schools. The Prophet ﷺ said: 'What a good condiment vinegar is!' (Muslim 2051). Jabir ibn Abdillah reports the Prophet ﷺ consumed it regularly (Muslim 2052). Natural transformation from wine to vinegar (istihala) is accepted by all schools without exception.",
    explanationAr:
      "الخل (بدون تحديد النوع) حلال بالإجماع المطلق للمذاهب الأربعة. قال النبي ﷺ: « نِعْمَ الأُدُمُ الخَلّ » (مسلم 2051). وروى جابر بن عبد الله أن النبي ﷺ كان يأكله بانتظام (مسلم 2052). الاستحالة الطبيعية للخمر إلى خل مقبولة عند جميع المذاهب بلا استثناء.",
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
      "Le vinaigre est halal par consensus unanime des quatre écoles. Hadith : « Quel bon condiment que le vinaigre ! » (Muslim 2051, 2052).",
    explanationEn:
      "Vinegar is halal by unanimous consensus of all four schools. Hadith: 'What a good condiment vinegar is!' (Muslim 2051, 2052).",
    explanationAr:
      "الخل حلال بالإجماع المطلق للمذاهب الأربعة. الحديث: « نِعْمَ الأُدُمُ الخَلّ » (مسلم 2051، 2052).",
    scholarlyReference: "Sahih Muslim 2051, 2052",
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
    confidence: 0.7,
    explanationFr:
      "Vinaigre de vin : produit par fermentation acétique du vin de raisin (khamr). Plus sensible que le vinaigre d'alcool car la matière première est du khamr au sens coranique strict.\n\n" +
      "— Hanafites : HALAL (istihala — Bada'i al-Sana'i 5/113).\n" +
      "— Hanbalites : HALAL (Ibn Taymiyya, Majmoo' 21/483 ; Ibn Uthaymeen).\n" +
      "— Chafiites : DOUTEUX (takhllil du khamr interdit — Nawawi, Majmoo' 9/232).\n" +
      "— Malikites : DOUTEUX (istihala du khamr interdite — Ibn Rushd, Bidayat 1/79).\n\n" +
      "Tableau :\n" +
      "• Hanafi : Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali : Halal (majorité) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i : Douteux — Nawawi, Majmoo' 9/232\n" +
      "• Maliki : Douteux — Ibn Rushd, Bidayat al-Mujtahid 1/79",
    explanationEn:
      "Wine vinegar: produced by acetic fermentation of grape wine (khamr). More sensitive than spirit vinegar as the raw material is khamr in the strictest Quranic sense.\n\n" +
      "— Hanafi: HALAL (istihala — Bada'i al-Sana'i 5/113).\n" +
      "— Hanbali: HALAL (Ibn Taymiyya, Majmoo' 21/483; Ibn Uthaymeen).\n" +
      "— Shafi'i: DOUBTFUL (takhllil of khamr forbidden — Nawawi, Majmoo' 9/232).\n" +
      "— Maliki: DOUBTFUL (istihala of khamr forbidden — Ibn Rushd, Bidayat 1/79).\n\n" +
      "Summary:\n" +
      "• Hanafi: Halal — Bada'i al-Sana'i 5/113\n" +
      "• Hanbali: Halal (majority) — Ibn Taymiyya, Majmoo' 21/483\n" +
      "• Shafi'i: Doubtful — Nawawi, Majmoo' 9/232\n" +
      "• Maliki: Doubtful — Ibn Rushd, Bidayat al-Mujtahid 1/79",
    explanationAr:
      "خل الخمر: يُنتج بالتخمّر الخلّي لنبيذ العنب (الخمر). أكثر حساسية من خل الكحول لأن المادة الأولية خمر بالمعنى القرآني الصريح.\n\n" +
      "— الحنفية: حلال (استحالة — بدائع الصنائع 5/113).\n" +
      "— الحنابلة: حلال (ابن تيمية، المجموع 21/483؛ ابن عثيمين).\n" +
      "— الشافعية: مشكوك فيه (تخليل الخمر محرّم — النووي، المجموع 9/232).\n" +
      "— المالكية: مشكوك فيه (استحالة الخمر محرّمة — ابن رشد، البداية 1/79).\n\n" +
      "ملخّص:\n" +
      "• حنفي: حلال — بدائع الصنائع 5/113\n" +
      "• حنبلي: حلال (الأغلبية) — ابن تيمية، المجموع 21/483\n" +
      "• شافعي: مشكوك فيه — النووي، المجموع 9/232\n" +
      "• مالكي: مشكوك فيه — ابن رشد، بداية المجتهد 1/79",
    scholarlyReference:
      "Muslim 2051, Muslim 1983, Abu Dawud 3675, Al-Kasani Bada'i al-Sana'i 5/113, Ibn Taymiyya Majmoo' 21/483-502, Ibn Uthaymeen Ash-Sharh al-Mumti' 1/415, Nawawi Al-Majmoo' 9/232, Ibn Rushd Bidayat al-Mujtahid 1/79",
    fatwaSourceUrl: "https://islamqa.info/en/answers/276185",
    fatwaSourceName: "IslamQA #276185, #191176, ECFR",
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
      "Gélatine bovine certifiée halal (abattage rituel dhabiha) : halal par consensus unanime des quatre écoles. L'animal est halal, l'abattage est conforme — aucune divergence.",
    explanationEn:
      "Halal-certified bovine gelatin (dhabiha ritual slaughter): halal by unanimous consensus of all four schools. The animal is halal, slaughter is compliant — no disagreement.",
    explanationAr:
      "جيلاتين بقري مُعتمد حلال (ذبح شرعي): حلال بالإجماع المطلق للمذاهب الأربعة. الحيوان حلال والذبح وفق الشريعة — لا خلاف.",
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
      "Gélatine de poisson : halal par consensus unanime. Les poissons n'exigent pas d'abattage rituel. « La chasse en mer vous est permise, ainsi que la nourriture qui en provient » (Coran 5:96). « Deux morts nous sont licites : le poisson et la sauterelle » (Ahmad, Ibn Majah — classé sahih).",
    explanationEn:
      "Fish gelatin: halal by unanimous consensus. Fish do not require ritual slaughter. 'Lawful for you is the game of the sea and its food' (Quran 5:96). 'Two dead things are lawful for us: fish and locusts' (Ahmad, Ibn Majah — graded sahih).",
    explanationAr:
      "جيلاتين السمك: حلال بالإجماع المطلق. الأسماك لا تحتاج ذبحاً شرعياً. « أُحِلَّ لَكُمْ صَيْدُ الْبَحْرِ وَطَعَامُهُ » (المائدة 5:96). « أُحِلَّت لنا مَيْتَتَان: الحُوتُ والجَرَاد » (أحمد، ابن ماجه — صحيح).",
    scholarlyReference: "Coran 5:96, Ahmad, Ibn Majah, IslamQA #219137",
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
      "Gélatine de poisson : halal par consensus unanime. Coran 5:96 et hadith « Deux morts licites : le poisson et la sauterelle ».",
    explanationEn:
      "Fish gelatin: halal by unanimous consensus. Quran 5:96 and hadith 'Two dead things lawful: fish and locusts'.",
    explanationAr:
      "جيلاتين السمك: حلال بالإجماع. المائدة 5:96 وحديث « أُحِلَّت لنا مَيْتَتَان: الحُوتُ والجَرَاد ».",
    scholarlyReference: "Quran 5:96, Ahmad, Ibn Majah",
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
      "Gélatine certifiée halal : halal par consensus. La certification garantit une source licite (bovine dhabiha ou poisson).",
    explanationEn:
      "Halal-certified gelatin: halal by consensus. Certification guarantees a permissible source (dhabiha bovine or fish).",
    explanationAr:
      "جيلاتين مُعتمد حلال: حلال بالإجماع. الشهادة تضمن مصدراً حلالاً (بقري مذبوح شرعياً أو سمك).",
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
      "Présure microbienne (produite par fermentation fongique/bactérienne) : halal par consensus. Source 100% non-animale — aucune divergence entre les écoles. Alternative recommandée par la majorité des autorités halal.",
    explanationEn:
      "Microbial rennet (produced by fungal/bacterial fermentation): halal by consensus. 100% non-animal source — no disagreement between schools. Recommended alternative by most halal authorities.",
    explanationAr:
      "المنفحة الميكروبية (إنتاج بالتخمّر الفطري/البكتيري): حلال بالإجماع. مصدر غير حيواني 100% — لا خلاف بين المذاهب. البديل الموصى به من معظم هيئات الحلال.",
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
    explanationFr: "Présure microbienne : halal par consensus. Source non-animale.",
    explanationEn: "Microbial rennet: halal by consensus. Non-animal source.",
    explanationAr: "المنفحة الميكروبية: حلال بالإجماع. مصدر غير حيواني.",
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
    explanationFr: "Présure végétale : halal par consensus. Source 100% végétale.",
    explanationEn: "Vegetable rennet: halal by consensus. 100% plant-based source.",
    explanationAr: "المنفحة النباتية: حلال بالإجماع. مصدر نباتي 100%.",
    scholarlyReference: "Consensus savant, IIFA Resolution 210",
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
      "Le canard est un animal halal par consensus, mais la graisse commerciale provient généralement d'un abattage non-rituel en Europe. Sans certification halal, l'animal est considéré mayta (non-abattu rituellement). Le statut dépend donc de la méthode d'abattage, pas de l'animal lui-même.",
    explanationEn:
      "Duck is a halal animal by consensus, but commercial duck fat typically comes from non-ritual slaughter in Europe. Without halal certification, the animal is considered mayta (not ritually slaughtered). Status depends on slaughter method, not the animal itself.",
    explanationAr:
      "البط حيوان حلال بالإجماع، لكن الشحم التجاري يأتي عادة من ذبح غير شرعي في أوروبا. بدون شهادة حلال، يُعتبر الحيوان ميتة. الحكم يعتمد على طريقة الذبح لا على الحيوان نفسه.",
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
      "L'oie est un animal halal par consensus, mais la graisse commerciale provient généralement d'un abattage non-rituel. Douteux sauf certification halal. Même principe que la graisse de canard.",
    explanationEn:
      "Goose is a halal animal by consensus, but commercial goose fat typically comes from non-ritual slaughter. Doubtful unless halal-certified. Same principle as duck fat.",
    explanationAr:
      "الإوز حيوان حلال بالإجماع، لكن الشحم التجاري يأتي عادة من ذبح غير شرعي. مشكوك فيه إلا بشهادة حلال. نفس مبدأ شحم البط.",
    scholarlyReference: "IslamQA #169813",
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
      "Gélatine dérivée du porc. Haram par consensus contemporain des 4 écoles. Bien que le principe théorique de l'istihala existe chez les Hanafites et Malikites, la quasi-totalité des autorités contemporaines (Deoband, Mufti Taqi Usmani, Comité permanent saoudien, IIFA Résolution 210) ont statué que la transformation industrielle de la gélatine n'est PAS une istihala complète au sens du fiqh classique. Le processus industriel (hydrolyse acide/alcaline du collagène) ne change pas la nature fondamentale de la substance porcine.",
    explanationEn:
      "Pork-derived gelatin. Haram by contemporary consensus of all 4 schools. Although the theoretical principle of istihala exists in Hanafi and Maliki fiqh, virtually all contemporary authorities (Deoband, Mufti Taqi Usmani, Saudi Permanent Committee, IIFA Resolution 210) have ruled that industrial gelatin processing is NOT a complete istihala. The industrial process (acid/alkaline hydrolysis of collagen) does not change the fundamental nature of the pork substance.",
    explanationAr:
      "جيلاتين مشتق من الخنزير. حرام بالإجماع المعاصر للمذاهب الأربعة. رغم وجود مبدأ الاستحالة النظري عند الحنفية والمالكية، إلا أن غالبية الهيئات المعاصرة (ديوبند، المفتي تقي عثماني، اللجنة الدائمة السعودية، قرار مجمع الفقه 210) قرّرت أن التصنيع الصناعي للجيلاتين ليس استحالة كاملة بالمعنى الفقهي. العملية الصناعية (تحلّل حمضي/قلوي للكولاجين) لا تغيّر الطبيعة الأساسية للمادة الخنزيرية.",
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
      "Gélatine porcine : haram par consensus contemporain des 4 écoles (Deoband, Mufti Taqi Usmani, IIFA Résolution 210). L'istihala industrielle est jugée insuffisante.",
    explanationEn:
      "Pork gelatin: haram by contemporary consensus of all 4 schools (Deoband, Mufti Taqi Usmani, IIFA Resolution 210). Industrial istihala deemed insufficient.",
    explanationAr:
      "جيلاتين الخنزير: حرام بالإجماع المعاصر للمذاهب الأربعة (ديوبند، المفتي تقي عثماني، قرار مجمع الفقه 210). الاستحالة الصناعية غير كافية.",
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
      "Gélatine de porc : haram par consensus contemporain des 4 écoles (Deoband, Mufti Taqi Usmani, IIFA Résolution 210). L'istihala industrielle est jugée insuffisante.",
    explanationEn:
      "Pork gelatin: haram by contemporary consensus of all 4 schools (Deoband, Mufti Taqi Usmani, IIFA Resolution 210). Industrial istihala deemed insufficient.",
    explanationAr:
      "جيلاتين الخنزير: حرام بالإجماع المعاصر للمذاهب الأربعة. العملية الصناعية لا تحقّق استحالة كاملة (قرار مجمع الفقه 210).",
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
      "Graisse de porc : haram par consensus unanime (ijma'). « لحم الخنزير » dans le Coran (6:145) couvre toutes les parties du porc, y compris la graisse, la peau et les os. Al-Qurtubi rapporte le consensus de la Oumma. Ibn Hazm confirme dans al-Muhalla l'interdiction de toute partie du porc sans exception.",
    explanationEn:
      "Pork fat: haram by unanimous consensus (ijma'). 'Lahm al-khinzir' in the Quran (6:145) covers all parts of the pig including fat, skin, and bones. Al-Qurtubi reports community consensus. Ibn Hazm confirms in al-Muhalla the prohibition of all pork parts without exception.",
    explanationAr:
      "شحم الخنزير: حرام بالإجماع المطلق. « لَحْمَ الْخِنزِيرِ » في القرآن (الأنعام 6:145) يشمل جميع أجزاء الخنزير بما في ذلك الشحم والجلد والعظام. نقل القرطبي إجماع الأمة. أكّد ابن حزم في المحلّى تحريم كل جزء من الخنزير بلا استثناء.",
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
      "Le porc est interdit par le Coran en 4 versets (2:173, 5:3, 6:145, 16:115). Le terme « rijs » (souillure) en 6:145 vise l'animal entier. Ijma' absolu sur l'interdiction de toutes les parties : viande, graisse, os, peau, moelle. Ibn Hazm (al-Muhalla) le confirme explicitement. Aucune divergence entre les écoles.",
    explanationEn:
      "Pork is prohibited by the Quran in 4 verses (2:173, 5:3, 6:145, 16:115). The term 'rijs' (abomination) in 6:145 refers to the entire animal. Absolute ijma' on prohibition of all parts: meat, fat, bone, skin, marrow. Ibn Hazm (al-Muhalla) confirms explicitly. No disagreement between schools.",
    explanationAr:
      "الخنزير محرّم بالقرآن في 4 آيات (البقرة 2:173، المائدة 5:3، الأنعام 6:145، النحل 16:115). لفظ « رِجْسٌ » في الأنعام 6:145 يشمل الحيوان بأكمله. إجماع مطلق على تحريم جميع أجزائه: اللحم، الشحم، العظم، الجلد، النخاع. أكّد ابن حزم (المحلّى) ذلك صراحةً. لا خلاف بين المذاهب.",
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
      "Porc : haram par le Coran (4 versets : 2:173, 5:3, 6:145, 16:115) et consensus unanime des savants.",
    explanationEn:
      "Pork: haram by the Quran (4 verses: 2:173, 5:3, 6:145, 16:115) and unanimous scholarly consensus.",
    explanationAr:
      "الخنزير: حرام بالقرآن (4 آيات: 2:173، 5:3، 6:145، 16:115) وإجماع العلماء المطلق.",
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
      "Le lard (saindoux) est la graisse fondue de porc. Haram par consensus unanime. Al-Qurtubi rapporte l'ijma' sur l'interdiction de la graisse de porc. « لَحْمَ الْخِنزِيرِ » (Coran 6:145) inclut la graisse selon tous les exégètes.",
    explanationEn:
      "Lard is rendered pork fat. Haram by unanimous consensus. Al-Qurtubi reports ijma' on prohibition of pork fat. 'Lahm al-khinzir' (Quran 6:145) includes fat according to all exegetes.",
    explanationAr:
      "شحم الخنزير المذاب. حرام بالإجماع المطلق. نقل القرطبي الإجماع على تحريم شحم الخنزير. « لَحْمَ الْخِنزِيرِ » (الأنعام 6:145) يشمل الشحم عند جميع المفسّرين.",
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
    explanationAr:
      "السمن الخنزيري = شحم الخنزير المذاب. حرام بالإجماع المطلق للمذاهب الأربعة.",
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
      "Gélatine (source non précisée) : douteux. Peut être d'origine porcine (haram), bovine non-dhabiha (douteux), bovine halal ou de poisson (halal). En Europe, la majorité de la gélatine industrielle est porcine. Sans mention de source, le statut reste douteux. Vérifier la certification halal ou la source sur l'emballage.",
    explanationEn:
      "Gelatin (source unspecified): doubtful. May be pork-derived (haram), non-dhabiha bovine (doubtful), halal bovine, or fish (halal). In Europe, most industrial gelatin is pork-derived. Without source specification, status remains doubtful. Check halal certification or source on packaging.",
    explanationAr:
      "الجيلاتين (مصدر غير محدد): مشكوك فيه. قد يكون من الخنزير (حرام)، أو بقري غير مذبوح شرعياً (مشكوك فيه)، أو بقري حلال أو سمك (حلال). في أوروبا، غالبية الجيلاتين الصناعي من الخنزير. بدون تحديد المصدر، يبقى الحكم مشكوكاً فيه. تحقّق من شهادة الحلال أو المصدر على العبوة.",
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
      "Gélatine (source non précisée) : douteux. L'origine (porc, bovin, poisson) détermine le statut halal. En Europe, la majorité est d'origine porcine. Vérifier la source ou la certification.",
    explanationEn:
      "Gelatin (unspecified source): doubtful. The origin (pork, bovine, fish) determines halal status. In Europe, most is pork-derived. Check source or certification.",
    explanationAr:
      "الجيلاتين (مصدر غير محدد): مشكوك فيه. المصدر (خنزير، بقر، سمك) يحدّد حكم الحلال. في أوروبا، الغالبية من الخنزير. تحقّق من المصدر أو الشهادة.",
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
      "Le vin (khamr) est interdit par le Coran (5:90-91) : « Le vin, le jeu de hasard, les pierres dressées et les flèches divinatoires sont une abomination, une œuvre du Diable. Écartez-vous-en ! » Consensus unanime de tous les savants depuis 14 siècles. Aucune divergence entre les écoles.",
    explanationEn:
      "Wine (khamr) is prohibited by the Quran (5:90-91): 'Intoxicants, gambling, stone altars and divining arrows are an abomination from the work of Satan. So avoid them.' Unanimous consensus of all scholars for 14 centuries. No disagreement between schools.",
    explanationAr:
      "الخمر محرّم بالقرآن (المائدة 5:90-91): « إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ فَاجْتَنِبُوهُ ». إجماع مطلق لجميع العلماء منذ 14 قرناً. لا خلاف بين المذاهب.",
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
    explanationAr:
      "الخمر: حرام بالقرآن (المائدة 5:90-91) وإجماع العلماء المطلق.",
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
      "L'alcool (éthanol) comme ingrédient est haram. Le Prophète ﷺ a dit : « Tout enivrant est khamr et tout khamr est haram » (Muslim 2003a). « Ce qui enivre en grande quantité est haram en petite quantité » (Abu Dawud 3681). Consensus unanime des quatre écoles.",
    explanationEn:
      "Alcohol (ethanol) as an ingredient is haram. The Prophet ﷺ said: 'Every intoxicant is khamr and every khamr is haram' (Muslim 2003a). 'What intoxicates in large quantities is haram in small quantities' (Abu Dawud 3681). Unanimous consensus of all four schools.",
    explanationAr:
      "الكحول (الإيثانول) كمكوّن غذائي حرام. قال النبي ﷺ: « كُلُّ مُسْكِرٍ خَمْرٌ وَكُلُّ خَمْرٍ حَرَامٌ » (مسلم 2003أ). « مَا أَسْكَرَ كَثِيرُهُ فَقَلِيلُهُ حَرَامٌ » (أبو داود 3681). إجماع المذاهب الأربعة.",
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
    explanationAr:
      "الكحول: حرام. « كُلُّ مُسْكِرٍ خَمْرٌ » (مسلم 2003أ).",
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
    explanationAr:
      "الإيثانول: المادة الفعّالة في الكحول. حرام كمكوّن غذائي. ملاحظة: الآثار الطبيعية للإيثانول في الخبز والفواكه الناضجة (أقل من 0.5%) الناتجة عن التخمّر الطبيعي حلال وفق قرار مجمع الفقه (225).",
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
    explanationAr:
      "الإيثانول: حرام كمكوّن. آثار التخمّر الطبيعي (أقل من 0.5%): حلال (قرار مجمع الفقه 225).",
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
      "La bière est haram par consensus des quatre écoles. La position de fatwa hanafite suit l'Imam Muhammad al-Shaybani (pas Abu Hanifa) : toute boisson enivrante est khamr, même issue de céréales. « كُلُّ مُسْكِرٍ خَمْرٌ » (Muslim 2003a).",
    explanationEn:
      "Beer is haram by consensus of all four schools. The Hanafi fatwa position follows Imam Muhammad al-Shaybani (not Abu Hanifa): every intoxicating drink is khamr, even from grains. 'Every intoxicant is khamr' (Muslim 2003a).",
    explanationAr:
      "البيرة حرام بإجماع المذاهب الأربعة. موقف الفتوى الحنفي يتبع الإمام محمد الشيباني (لا أبا حنيفة): كل مشروب مُسكر خمر حتى لو من الحبوب. « كُلُّ مُسْكِرٍ خَمْرٌ » (مسلم 2003أ).",
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
    explanationAr: "البيرة: حرام بالإجماع (الموقف المعتمد الحنفي).",
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
    explanationAr: "الرم: مشروب روحي مقطّر، حرام بالإجماع المطلق.",
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
    explanationAr: "الرم: حرام بالإجماع.",
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
    explanationAr: "الويسكي: مشروب روحي مقطّر، حرام بالإجماع المطلق.",
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
    explanationAr: "الفودكا: مشروب روحي مقطّر، حرام بالإجماع المطلق.",
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
    explanationAr:
      "البراندي: مشروب روحي مقطّر من الخمر، حرام بالإجماع المطلق.",
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
      "Carmin (E120) : colorant extrait de la cochenille (insecte Dactylopius coccus). Divergence notable entre les écoles.\n\n" +
      "— Hanafites : HARAM. Les insectes sont des « khabaith » (substances répugnantes, Coran 7:157). L'istihala dans l'extraction du colorant est jugée insuffisante.\n\n" +
      "— Chafiites : HARAM. Même raisonnement que les Hanafites sur les khabaith.\n\n" +
      "— Hanbalites : HARAM. Les insectes terrestres sont impurs (sauf la sauterelle, hadith Ibn Majah).\n\n" +
      "— Malikites : HALAL. Le Coran 6:145 ne mentionne que 4 interdictions explicites (la mayta, le sang versé, la viande de porc, ce sur quoi un autre nom qu'Allah a été invoqué). Les insectes n'en font pas partie. Al-Qurtubi confirme dans Al-Jami' li-Ahkam al-Qur'an.\n\n" +
      "Tableau :\n" +
      "• Hanafi : Haram — khabaith (Coran 7:157)\n" +
      "• Shafi'i : Haram — khabaith\n" +
      "• Hanbali : Haram — insectes terrestres impurs\n" +
      "• Maliki : Halal — Coran 6:145 (4 interdictions limitatives)",
    explanationEn:
      "Carmine (E120): dye extracted from cochineal insect (Dactylopius coccus). Notable disagreement between schools.\n\n" +
      "— Hanafi: HARAM. Insects are 'khabaith' (repugnant substances, Quran 7:157). Istihala in dye extraction deemed insufficient.\n\n" +
      "— Shafi'i: HARAM. Same reasoning as Hanafis on khabaith.\n\n" +
      "— Hanbali: HARAM. Land insects are impure (except locusts, hadith Ibn Majah).\n\n" +
      "— Maliki: HALAL. Quran 6:145 lists only 4 explicit prohibitions (carrion, flowing blood, pork, and what is dedicated to other than Allah). Insects are not among them. Al-Qurtubi confirms in Al-Jami' li-Ahkam al-Qur'an.\n\n" +
      "Summary:\n" +
      "• Hanafi: Haram — khabaith (Quran 7:157)\n" +
      "• Shafi'i: Haram — khabaith\n" +
      "• Hanbali: Haram — land insects impure\n" +
      "• Maliki: Halal — Quran 6:145 (4 restrictive prohibitions)",
    explanationAr:
      "الكارمين (E120): صبغة مستخرجة من حشرة القرمز. خلاف ملحوظ بين المذاهب.\n\n" +
      "— الحنفية: حرام. الحشرات من « الخبائث » (الأعراف 7:157). الاستحالة في استخراج الصبغة غير كافية.\n\n" +
      "— الشافعية: حرام. نفس تعليل الحنفية بالخبائث.\n\n" +
      "— الحنابلة: حرام. الحشرات البرية نجسة (إلا الجراد — حديث ابن ماجه).\n\n" +
      "— المالكية: حلال. الأنعام 6:145 تذكر 4 محرّمات فقط (الميتة، الدم المسفوح، لحم الخنزير، ما أُهِلّ لغير الله به). الحشرات ليست منها. أكّد القرطبي في الجامع لأحكام القرآن.\n\n" +
      "ملخّص:\n" +
      "• حنفي: حرام — خبائث (الأعراف 7:157)\n" +
      "• شافعي: حرام — خبائث\n" +
      "• حنبلي: حرام — الحشرات البرية نجسة\n" +
      "• مالكي: حلال — الأنعام 6:145 (4 محرّمات حصرية)",
    scholarlyReference:
      "Coran 6:145, 7:157, Ibn Majah (sauterelles hadith), IIFA Resolutions 198/210, IslamQA #382570, #162658, Al-Qurtubi Al-Jami' li-Ahkam al-Qur'an",
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
      "Cochenille (E120) : voir carmin. Hanafites/Chafiites/Hanbalites : haram (khabaith). Malikites : halal (Coran 6:145 limitatif).",
    explanationEn:
      "Cochineal (E120): see carmine. Hanafi/Shafi'i/Hanbali: haram (khabaith). Maliki: halal (Quran 6:145 restrictive).",
    explanationAr:
      "القرمز (E120): انظر الكارمين. الحنفية/الشافعية/الحنابلة: حرام (خبائث). المالكية: حلال (الأنعام 6:145 حصرية).",
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
      "E120 (carmin/cochenille) : colorant d'insecte. 3 écoles : haram (khabaith). Malikites : halal (Coran 6:145 limitatif).",
    explanationEn:
      "E120 (carmine/cochineal): insect-derived dye. 3 schools: haram (khabaith). Maliki: halal (Quran 6:145 restrictive).",
    explanationAr:
      "E120 (كارمين/قرمز): صبغة من حشرة. 3 مذاهب: حرام (خبائث). المالكية: حلال (الأنعام 6:145 حصرية).",
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
      "Présure animale (source non précisée) : divergence majeure entre les écoles.\n\n" +
      "— Hanafites : HALAL. Abu Hanifa : la présure n'est pas un organe vivant, c'est un contenu stomacal. Le lait caillé dans l'estomac d'un animal mort reste pur. (Al-Kasani, Bada'i al-Sana'i)\n\n" +
      "— Hanbalites : HALAL. Ibn Taymiyyah (Majmu' al-Fatawa 21/102) : les Compagnons mangeaient le fromage des Zoroastriens sans questionner la source de la présure. L'athar des Sahabas fait autorité.\n\n" +
      "— Chafiites : HARAM si non-zabiha. Position mu'tamad : la présure fait partie de la mayta (animal non-abattu). Nawawi classe la présure comme najis si l'animal n'est pas abattu rituellement.\n\n" +
      "— Malikites : HARAM. L'usul malékite exige la dhabiha pour toute partie de l'animal. La présure est considérée comme faisant partie de la mayta.\n\n" +
      "Tableau :\n" +
      "• Hanafi : Halal — Bada'i al-Sana'i\n" +
      "• Hanbali : Halal — Ibn Taymiyyah, Majmu' 21/102\n" +
      "• Shafi'i : Haram (si non-zabiha) — Nawawi\n" +
      "• Maliki : Haram (si non-zabiha) — Khalil, Mukhtasar",
    explanationEn:
      "Animal rennet (unspecified source): major disagreement between schools.\n\n" +
      "— Hanafi: HALAL. Abu Hanifa: rennet is not living tissue, it's stomach content. Curdled milk in a dead animal's stomach remains pure. (Al-Kasani, Bada'i al-Sana'i)\n\n" +
      "— Hanbali: HALAL. Ibn Taymiyyah (Majmu' al-Fatawa 21/102): Companions ate Zoroastrian cheese without questioning the rennet source. The athar of the Sahabah is authoritative.\n\n" +
      "— Shafi'i: HARAM if not zabiha. Mu'tamad position: rennet is part of the mayta (unslaughtered animal). Nawawi classifies rennet as najis if the animal wasn't ritually slaughtered.\n\n" +
      "— Maliki: HARAM. Maliki usul requires dhabiha for any animal part. Rennet is considered part of the mayta.\n\n" +
      "Summary:\n" +
      "• Hanafi: Halal — Bada'i al-Sana'i\n" +
      "• Hanbali: Halal — Ibn Taymiyyah, Majmu' 21/102\n" +
      "• Shafi'i: Haram (if not zabiha) — Nawawi\n" +
      "• Maliki: Haram (if not zabiha) — Khalil, Mukhtasar",
    explanationAr:
      "المنفحة الحيوانية (مصدر غير محدد): خلاف كبير بين المذاهب.\n\n" +
      "— الحنفية: حلال. أبو حنيفة: المنفحة ليست عضواً حياً، بل محتوى معدي. اللبن المتخثّر في معدة الحيوان الميت يبقى طاهراً. (الكاساني، بدائع الصنائع)\n\n" +
      "— الحنابلة: حلال. ابن تيمية (مجموع الفتاوى 21/102): الصحابة أكلوا جبن المجوس دون السؤال عن مصدر المنفحة. أثر الصحابة حجّة.\n\n" +
      "— الشافعية: حرام إن لم يُذبح شرعياً. المعتمد: المنفحة جزء من الميتة. النووي يصنّف المنفحة نجسة إن لم يُذبح الحيوان شرعياً.\n\n" +
      "— المالكية: حرام. الأصول المالكية تشترط الذبح الشرعي لأي جزء من الحيوان. المنفحة تُعتبر من الميتة.\n\n" +
      "ملخّص:\n" +
      "• حنفي: حلال — بدائع الصنائع\n" +
      "• حنبلي: حلال — ابن تيمية، المجموع 21/102\n" +
      "• شافعي: حرام (إن لم يُذبح شرعياً) — النووي\n" +
      "• مالكي: حرام (إن لم يُذبح شرعياً) — خليل، المختصر",
    scholarlyReference:
      "IslamQA #2841, #115306, #262339, IslamWeb #347143, Mishkat 4227, Ibn Taymiyyah Majmu' al-Fatawa 21/102, Permanent Committee fatwa, Dar al-Ifta #9411",
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
      "Présure (source non précisée) : Hanafites/Hanbalites (Ibn Taymiyyah, Majmu' 21/102) : halal (la présure n'est pas un organe vivant, les Sahabas mangeaient le fromage des Mages). Chafiites/Malikites : haram si animal non-zabiha (fait partie de la mayta).",
    explanationEn:
      "Rennet (unspecified): Hanafi/Hanbali (Ibn Taymiyyah, Majmu' 21/102): halal (rennet is not living tissue, Companions ate Magian cheese). Shafi'i/Maliki: haram if not zabiha (part of mayta).",
    explanationAr:
      "المنفحة (مصدر غير محدد): الحنفية/الحنابلة (ابن تيمية، المجموع 21/102): حلال (المنفحة ليست عضواً حياً، الصحابة أكلوا جبن المجوس). الشافعية/المالكية: حرام إن لم يُذبح شرعياً (جزء من الميتة).",
    scholarlyReference: "IslamQA #115306, #2841, Ibn Taymiyyah Majmu' 21/102",
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
      "Petit-lait issu de la fabrication du fromage. Le point clé : la présure utilisée. Présure végétale ou microbienne → halal par consensus. Présure animale → dépend de votre école. Hanafites/Hanbalites considèrent la présure pure (Ibn Taymiyyah). Chafiites/Malikites recommandent la prudence (la présure fait partie de la mayta). Sans mention « présure microbienne » sur l'emballage, le doute subsiste.",
    explanationEn:
      "Whey, by-product of cheese making. The key factor: the rennet used. Vegetable or microbial rennet → halal by consensus. Animal rennet → depends on your school. Hanafi/Hanbali consider rennet pure (Ibn Taymiyyah). Shafi'i/Maliki advise caution (rennet is part of mayta). Without 'microbial rennet' on the label, doubt remains.",
    explanationAr:
      "مصل اللبن، منتج ثانوي لصناعة الجبن. النقطة الحاسمة: نوع المنفحة المستخدمة. منفحة نباتية أو ميكروبية ← حلال بالإجماع. منفحة حيوانية ← يعتمد على مذهبك. الحنفية/الحنابلة يعتبرون المنفحة طاهرة (ابن تيمية). الشافعية/المالكية ينصحون بالحذر (المنفحة جزء من الميتة). بدون ذكر « منفحة ميكروبية » على العبوة، يبقى الشك.",
    scholarlyReference:
      "IslamWeb #198295, #321622, IslamQA #115306, Ibn Taymiyyah Majmu' 21/102",
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
      "Lactosérum (petit-lait) : même règle que le whey. Le statut dépend de la présure utilisée dans la fabrication du fromage. Présure microbienne/végétale = halal. Présure animale = dépend du madhab.",
    explanationEn:
      "Whey (lactosérum): same rule as whey. Status depends on the rennet used in cheese making. Microbial/vegetable rennet = halal. Animal rennet = depends on madhab.",
    explanationAr:
      "مصل اللبن (لاكتوسيروم): نفس حكم الشرش. الحكم يعتمد على نوع المنفحة المستخدمة في صناعة الجبن. منفحة ميكروبية/نباتية = حلال. منفحة حيوانية = يعتمد على المذهب.",
    scholarlyReference: "IslamWeb #198295, #321622, IslamQA #115306, Ibn Taymiyyah Majmu' 21/102",
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
    explanationAr:
      "أحادي الجليسريد (E471): مستحلب من مصدر نباتي (صويا، نخيل) أو حيواني (بما في ذلك الخنزير). ⚠️ في أوروبا، ~95% من E471 بدون ذكر المصدر مشتقة من شحوم حيوانية (خنزير غالباً). إسلام سؤال وجواب (#114129) ينصح صراحةً بالحذر في البلدان غير الإسلامية. فقط ذكر « مصدر نباتي » على العبوة يضمن مصدراً حلالاً.",
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
    explanationAr:
      "ثنائي الجليسريد: انظر أحادي الجليسريد (E471). ⚠️ ~95% من مصدر حيواني (خنزير) في أوروبا إن لم يُحدّد. الحذر منصوح به (إسلام سؤال وجواب #114129).",
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
    explanationAr:
      "أحادي الجليسريد: انظر E471. ⚠️ ~95% من مصدر حيواني (خنزير) في أوروبا إن لم يُحدّد. الحذر منصوح به (إسلام سؤال وجواب #114129).",
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
    explanationAr:
      "E471 (أحادي/ثنائي جليسريد الأحماض الدهنية): ⚠️ في أوروبا، ~95% من E471 بدون ذكر المصدر مشتقة من شحوم حيوانية (خنزير غالباً). إسلام سؤال وجواب (#114129) ينصح بالحذر في البلدان غير الإسلامية. إذا ذُكر « مصدر نباتي » على العبوة: حلال.",
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
      "E441 (gélatine) : voir « gélatine ». En Europe, majoritairement d'origine porcine. Douteux si source non précisée.",
    explanationEn:
      "E441 (gelatin): see 'gelatin'. In Europe, predominantly pork-derived. Doubtful if source unspecified.",
    explanationAr:
      "E441 (جيلاتين): انظر « جيلاتين ». في أوروبا، غالباً من الخنزير. مشكوك فيه إن لم يُحدّد المصدر.",
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
      "E542 (phosphate d'os) : peut être d'origine animale (porc ou bovin non-dhabiha). Douteux si source non précisée. Même principe que pour les dérivés animaux sans certification.",
    explanationEn:
      "E542 (bone phosphate): may be animal-derived (pork or non-dhabiha bovine). Doubtful if source unspecified. Same principle as for animal derivatives without certification.",
    explanationAr:
      "E542 (فوسفات العظام): قد يكون من مصدر حيواني (خنزير أو بقري غير مذبوح شرعياً). مشكوك فيه إن لم يُحدّد المصدر. نفس مبدأ المشتقات الحيوانية بدون شهادة.",
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
      "L-Cystéine (E920) : acide aminé pouvant être extrait de poils de porc, de plumes de canard, ou synthétisé chimiquement. Douteux si source non précisée. La majorité de la production mondiale est issue de poils de porc (Chine).",
    explanationEn:
      "L-Cysteine (E920): amino acid that can be extracted from pig hair, duck feathers, or chemically synthesized. Doubtful if source unspecified. Most global production uses pig hair (China).",
    explanationAr:
      "L-سيستئين (E920): حمض أميني يُستخرج من شعر الخنزير أو ريش البط أو يُصنّع كيميائياً. مشكوك فيه إن لم يُحدّد المصدر. غالبية الإنتاج العالمي من شعر الخنزير (الصين).",
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
      "L-Cystéine (E920) : voir l-cystéine. Source potentiellement porcine (poils de porc).",
    explanationEn:
      "L-Cysteine (E920): see l-cystéine. Potentially pork-derived (pig hair).",
    explanationAr:
      "L-سيستئين (E920): انظر l-cystéine. مصدر محتمل من الخنزير (شعر الخنزير).",
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
      "E920 (L-Cystéine) : potentiellement d'origine porcine (poils de porc). Douteux si non précisé.",
    explanationEn:
      "E920 (L-Cysteine): potentially pork-derived (pig hair). Doubtful if unspecified.",
    explanationAr:
      "E920 (L-سيستئين): مصدر محتمل من الخنزير (شعر الخنزير). مشكوك فيه إن لم يُحدّد.",
    scholarlyReference: "IslamQA #114129",
    fatwaSourceUrl: "https://islamqa.info/en/answers/114129",
    fatwaSourceName: "IslamQA #114129",
    category: "amino_acid",
  },
];
