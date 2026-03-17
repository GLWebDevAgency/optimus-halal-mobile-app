import { z } from "zod";
import { ayahWisdomSchema } from "../compositions/AyahWisdom";

type AyahData = z.infer<typeof ayahWisdomSchema>;

/**
 * 6 Quranic verses on food & consumption — all verified references.
 * Principle: "Servir, pas juger" — pure reminder, no opinion.
 */
export const AYAHS: AyahData[] = [
  {
    arabicText:
      "يَا أَيُّهَا النَّاسُ كُلُوا مِمَّا فِي الْأَرْضِ حَلَالًا طَيِّبًا",
    translationFr:
      "Ô hommes ! Mangez de ce qui est licite et bon sur la terre.",
    reference: "Sourate Al-Baqara · 2:168",
    mode: "dark",
  },
  {
    arabicText:
      "وَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا وَاتَّقُوا اللَّهَ",
    translationFr:
      "Mangez de ce qu'Allah vous a attribué de licite et de bon, et craignez Allah.",
    reference: "Sourate Al-Ma'ida · 5:88",
    mode: "dark",
  },
  {
    arabicText:
      "إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ",
    translationFr:
      "Il vous a seulement interdit la bête morte, le sang, la viande de porc.",
    reference: "Sourate Al-Baqara · 2:173",
    mode: "dark",
  },
  {
    arabicText:
      "كُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا إِنَّهُ لَا يُحِبُّ الْمُسْرِفِينَ",
    translationFr:
      "Mangez et buvez sans excès. Il n'aime pas ceux qui commettent des excès.",
    reference: "Sourate Al-A'raf · 7:31",
    mode: "dark",
  },
  {
    arabicText:
      "أُحِلَّ لَكُمْ صَيْدُ الْبَحْرِ وَطَعَامُهُ مَتَاعًا لَّكُمْ وَلِلسَّيَّارَةِ",
    translationFr:
      "La chasse en mer vous est permise, ainsi que la consommation qui en provient.",
    reference: "Sourate Al-Ma'ida · 5:96",
    mode: "dark",
  },
  {
    arabicText:
      "فَكُلُوا مِمَّا رَزَقَكُمُ اللَّهُ حَلَالًا طَيِّبًا وَاشْكُرُوا نِعْمَتَ اللَّهِ",
    translationFr:
      "Mangez de ce qu'Allah vous a accordé de licite et de bon, et soyez reconnaissants.",
    reference: "Sourate An-Nahl · 16:114",
    mode: "dark",
  },
];
