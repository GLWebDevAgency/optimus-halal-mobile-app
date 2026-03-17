import { z } from "zod";
import { mythBusterSchema } from "../compositions/MythBuster";

type MythBusterData = z.infer<typeof mythBusterSchema>;

/**
 * 10 MythBuster episodes — all sourced from Naqiy seed data.
 * Principle: "L'incertitude est valide" — nuanced, never clickbait.
 */
export const MYTHBUSTERS: MythBusterData[] = [
  {
    statement: "Le vinaigre d'alcool est toujours haram",
    verdict: "faux",
    explanation:
      "La transformation (istihala) du vin en vinaigre est considérée comme complète par les Hanafites et Hanbalites. Le Prophète ﷺ a dit : « Quel bon condiment que le vinaigre. »",
    madhabs:
      "Hanafi : halal · Hanbali : halal · Shafi'i : douteux · Maliki : douteux",
    sourceText: "Sahih Muslim 2051 · Al-Kasani, Bada'i al-Sana'i 5/113",
    mode: "dark",
  },
  {
    statement: "La gélatine de poisson est halal pour tous",
    verdict: "vrai",
    explanation:
      "Le poisson est halal par consensus des 4 écoles. Sa gélatine n'a pas besoin d'abattage rituel. « Deux animaux morts nous sont licites : le poisson et la sauterelle. »",
    sourceText: "Coran 5:96 · Ahmad 5690 · Ibn Majah 3218",
    mode: "dark",
  },
  {
    statement: "Le E471 dans le pain vient du végétal",
    verdict: "faux",
    explanation:
      "En Europe, ~95% des mono- et diglycérides d'acides gras (E471) sont d'origine porcine. Sans mention « végétal » sur l'étiquette, la prudence s'impose.",
    sourceText: "IslamQA #114129 · ECFR · Données industrielles européennes",
    mode: "dark",
  },
  {
    statement: "Le carmin (E120) est halal chez les Malikites",
    verdict: "vrai",
    explanation:
      "L'école Malikite considère que le Coran ne liste que 4 interdictions explicites (6:145). Les insectes n'en font pas partie. Les 3 autres écoles les classent comme khabaith (répugnant).",
    madhabs:
      "Maliki : halal · Hanafi : haram · Shafi'i : haram · Hanbali : haram",
    sourceText: "Coran 6:145, 7:157 · Al-Qurtubi, Jami' li-Ahkam al-Qur'an",
    mode: "dark",
  },
  {
    statement: "La présure animale est haram dans les 4 écoles",
    verdict: "faux",
    explanation:
      "Les Hanafites et certains Hanbalites considèrent la présure comme un contenu stomacal, pas un tissu vivant. Ibn Taymiyyah rapporte que les compagnons mangeaient le fromage des Mages.",
    madhabs:
      "Hanafi : halal · Hanbali : divergence · Shafi'i : haram si non-dhabiha · Maliki : haram si non-dhabiha",
    sourceText: "Ibn Taymiyyah, Majmu' al-Fataawa 21/102 · IslamQA #2841",
    mode: "dark",
  },
  {
    statement: "L'alcool en traces (<0.5%) est haram",
    verdict: "faux",
    explanation:
      "L'Académie Internationale du Fiqh a statué : les traces d'alcool issues de fermentation naturelle (<0.5%) ne sont pas considérées comme khamr et ne provoquent pas d'ivresse.",
    sourceText: "IIFA Résolution 225 · Ibn Uthaymeen · Dar al-Ifta Egypte",
    mode: "dark",
  },
  {
    statement: "La gélatine de porc est halal si transformée chimiquement",
    verdict: "faux",
    explanation:
      "Malgré le principe d'istihala (transformation), l'IIFA a jugé que le processus industriel de la gélatine porcine est insuffisant pour changer sa nature impure.",
    sourceText: "IIFA Résolution 210 · Décision 23 (3/10)",
    mode: "dark",
  },
  {
    statement: "Le E171 (dioxyde de titane) est interdit en Europe",
    verdict: "vrai",
    explanation:
      "Banni dans l'UE depuis 2022 suite aux études de l'EFSA. Nanoparticules avec risque génotoxique. Encore présent dans certains produits importés et médicaments.",
    sourceText: "EFSA 2021 · Règlement UE 2022/63",
    mode: "dark",
  },
  {
    statement: "Toute certification halal se vaut",
    verdict: "faux",
    explanation:
      "Le Trust Score Naqiy révèle des écarts de 0 à 100 entre certificateurs. Certains emploient des contrôleurs salariés présents à chaque production, d'autres acceptent l'abattage mécanique sans surveillance.",
    sourceText: "Trust Score Naqiy · 18 certificateurs analysés · 6 indicateurs",
    mode: "dark",
  },
  {
    statement: "Les insectes sont haram dans les 4 écoles",
    verdict: "faux",
    explanation:
      "L'école Malikite autorise la consommation d'insectes car le Coran ne les mentionne pas dans les interdictions. Les sauterelles sont halal par consensus (hadith explicite).",
    madhabs:
      "Maliki : halal (tous insectes) · Hanafi/Shafi'i/Hanbali : haram (sauf sauterelles)",
    sourceText: "Coran 6:145 · Sahih Muslim 1952 · Al-Qurtubi",
    mode: "dark",
  },
];
