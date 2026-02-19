/**
 * Additives Seed — 200+ E-numbers with halal status, toxicity, EFSA, and madhab rulings.
 * Idempotent via ON CONFLICT DO UPDATE / DO NOTHING.
 *
 * Standalone runner: pnpm db:seed:additives
 * Data re-exported from additives-data.ts for unified runner.
 */

import { db } from "../index.js";
import { additives, additiveMadhabRulings } from "../schema/index.js";
import type { NewAdditive, NewAdditiveMadhabRuling } from "../schema/additives.js";

export const ADDITIVES_DATA: NewAdditive[] = [
  // ── COLORANTS (E100-E199) ────────────────────────────
  { code: "E100", nameFr: "Curcumine", nameEn: "Curcumin", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant naturel extrait du curcuma", origin: "plant", toxicityLevel: "safe", adiMgPerKg: 3, riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E101", nameFr: "Riboflavine", nameEn: "Riboflavin", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Vitamine B2, synthétique ou végétale", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E102", nameFr: "Tartrazine", nameEn: "Tartrazine", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique azoïque", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: true, healthEffectsFr: "Southampton Six — peut affecter l'attention des enfants", efsaStatus: "approved" },
  { code: "E104", nameFr: "Jaune de quinoléine", nameEn: "Quinoline Yellow", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: false, healthEffectsFr: "Southampton Six — hyperactivité enfants", efsaStatus: "approved" },
  { code: "E110", nameFr: "Jaune orangé S", nameEn: "Sunset Yellow FCF", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique azoïque", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: true, healthEffectsFr: "Southampton Six — hyperactivité enfants, réactions allergiques", efsaStatus: "approved" },
  { code: "E120", nameFr: "Carmine / Cochenille", nameEn: "Carmine / Cochineal", category: "colorant", halalStatusDefault: "haram", halalExplanationFr: "Colorant extrait d'insectes (cochenille) — haram par consensus", origin: "insect", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: true, healthEffectsFr: "Réactions allergiques possibles chez certains individus", efsaStatus: "approved" },
  { code: "E122", nameFr: "Azorubine", nameEn: "Azorubine", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: false, healthEffectsFr: "Southampton Six", efsaStatus: "approved" },
  { code: "E124", nameFr: "Ponceau 4R", nameEn: "Ponceau 4R", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: false, healthEffectsFr: "Southampton Six", efsaStatus: "approved" },
  { code: "E129", nameFr: "Rouge allura AC", nameEn: "Allura Red AC", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: false, healthEffectsFr: "Southampton Six", efsaStatus: "approved" },
  { code: "E131", nameFr: "Bleu patenté V", nameEn: "Patent Blue V", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: true, efsaStatus: "approved" },
  { code: "E132", nameFr: "Indigotine", nameEn: "Indigo Carmine", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E133", nameFr: "Bleu brillant FCF", nameEn: "Brilliant Blue FCF", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E140", nameFr: "Chlorophylles", nameEn: "Chlorophylls", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Pigment végétal naturel", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E141", nameFr: "Complexes cuivre-chlorophylles", nameEn: "Copper Chlorophylls", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Dérivé végétal", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E150A", nameFr: "Caramel", nameEn: "Plain Caramel", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Sucre caramélisé", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E150B", nameFr: "Caramel de sulfite caustique", nameEn: "Caustic Sulphite Caramel", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Caramel traité", origin: "plant", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E150C", nameFr: "Caramel ammoniacal", nameEn: "Ammonia Caramel", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Caramel traité à l'ammoniac", origin: "plant", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E150D", nameFr: "Caramel de sulfite d'ammonium", nameEn: "Sulphite Ammonia Caramel", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Caramel traité", origin: "plant", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E153", nameFr: "Charbon végétal", nameEn: "Vegetable Carbon", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Charbon d'origine végétale", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E160A", nameFr: "Bêta-carotène", nameEn: "Beta-Carotene", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Pigment végétal (carottes, fruits)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E160B", nameFr: "Annatto / Rocou", nameEn: "Annatto", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Colorant végétal", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E160C", nameFr: "Extrait de paprika", nameEn: "Paprika Extract", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Extrait végétal", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E161B", nameFr: "Lutéine", nameEn: "Lutein", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Pigment végétal", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E162", nameFr: "Rouge de betterave", nameEn: "Beetroot Red", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Extrait de betterave", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E163", nameFr: "Anthocyanes", nameEn: "Anthocyanins", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Pigments végétaux (raisin, baies)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E170", nameFr: "Carbonate de calcium", nameEn: "Calcium Carbonate", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Minéral naturel", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E171", nameFr: "Dioxyde de titane", nameEn: "Titanium Dioxide", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Minéral synthétique", origin: "mineral", toxicityLevel: "high_concern", riskPregnant: true, riskChildren: true, riskAllergic: false, healthEffectsFr: "Interdit dans l'alimentation UE depuis 2022 — nanoparticules, risque génotoxique", efsaStatus: "banned", bannedCountries: ["France", "UE"] },
  { code: "E172", nameFr: "Oxydes de fer", nameEn: "Iron Oxides", category: "colorant", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },

  // ── PRESERVATIVES (E200-E299) ────────────────────────
  { code: "E200", nameFr: "Acide sorbique", nameEn: "Sorbic Acid", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E202", nameFr: "Sorbate de potassium", nameEn: "Potassium Sorbate", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E210", nameFr: "Acide benzoïque", nameEn: "Benzoic Acid", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: true, efsaStatus: "approved" },
  { code: "E211", nameFr: "Benzoate de sodium", nameEn: "Sodium Benzoate", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: true, riskAllergic: true, healthEffectsFr: "Peut former du benzène avec vitamine C — limiter chez enfants", efsaStatus: "approved" },
  { code: "E220", nameFr: "Dioxyde de soufre", nameEn: "Sulphur Dioxide", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: false, riskAllergic: true, healthEffectsFr: "Allergène déclaré — dangereux pour asthmatiques et sensibles aux sulfites", efsaStatus: "approved" },
  { code: "E221", nameFr: "Sulfite de sodium", nameEn: "Sodium Sulphite", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: false, riskAllergic: true, efsaStatus: "approved" },
  { code: "E234", nameFr: "Nisine", nameEn: "Nisin", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Antimicrobien naturel", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E249", nameFr: "Nitrite de potassium", nameEn: "Potassium Nitrite", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: true, riskChildren: false, riskAllergic: false, healthEffectsFr: "Nitrites — risque de nitrosamines cancérigènes, déconseillé grossesse", efsaStatus: "restricted" },
  { code: "E250", nameFr: "Nitrite de sodium", nameEn: "Sodium Nitrite", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: true, riskChildren: false, riskAllergic: false, healthEffectsFr: "Nitrites — risque de nitrosamines cancérigènes", efsaStatus: "restricted" },
  { code: "E251", nameFr: "Nitrate de sodium", nameEn: "Sodium Nitrate", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E252", nameFr: "Nitrate de potassium", nameEn: "Potassium Nitrate", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E260", nameFr: "Acide acétique", nameEn: "Acetic Acid", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Vinaigre", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E270", nameFr: "Acide lactique", nameEn: "Lactic Acid", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Fermentation végétale", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E280", nameFr: "Acide propionique", nameEn: "Propionic Acid", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Conservateur synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E290", nameFr: "Dioxyde de carbone", nameEn: "Carbon Dioxide", category: "preservative", halalStatusDefault: "halal", halalExplanationFr: "Gaz naturel", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E296", nameFr: "Acide malique", nameEn: "Malic Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Acide de fruit (pomme)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E297", nameFr: "Acide fumarique", nameEn: "Fumaric Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Acide organique synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },

  // ── ANTIOXIDANTS (E300-E399) ─────────────────────────
  { code: "E300", nameFr: "Acide ascorbique", nameEn: "Ascorbic Acid", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Vitamine C", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E301", nameFr: "Ascorbate de sodium", nameEn: "Sodium Ascorbate", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Sel de vitamine C", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E304", nameFr: "Palmitate d'ascorbyle", nameEn: "Ascorbyl Palmitate", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Ester de vitamine C", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E306", nameFr: "Tocophérols (Vitamine E)", nameEn: "Tocopherols", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Vitamine E naturelle", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E310", nameFr: "Gallate de propyle", nameEn: "Propyl Gallate", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Antioxydant synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: true, efsaStatus: "approved" },
  { code: "E320", nameFr: "BHA (Butylhydroxyanisole)", nameEn: "BHA", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Antioxydant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: true, riskChildren: false, riskAllergic: false, healthEffectsFr: "Perturbateur endocrinien suspecté, cancérogène possible", efsaStatus: "under_review" },
  { code: "E321", nameFr: "BHT (Butylhydroxytoluène)", nameEn: "BHT", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Antioxydant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: true, riskChildren: false, riskAllergic: false, healthEffectsFr: "Perturbateur endocrinien suspecté", efsaStatus: "under_review" },
  { code: "E322", nameFr: "Lécithine", nameEn: "Lecithin", category: "emulsifier", halalStatusDefault: "halal", halalExplanationFr: "Généralement d'origine soja ou tournesol", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E325", nameFr: "Lactate de sodium", nameEn: "Sodium Lactate", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Sel d'acide lactique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E330", nameFr: "Acide citrique", nameEn: "Citric Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Acide de fruit, fermentation", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E331", nameFr: "Citrate de sodium", nameEn: "Sodium Citrate", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Dérivé d'acide citrique", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E332", nameFr: "Citrate de potassium", nameEn: "Potassium Citrate", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Dérivé d'acide citrique", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E334", nameFr: "Acide tartrique", nameEn: "Tartaric Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Acide de fruit (raisin)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E338", nameFr: "Acide phosphorique", nameEn: "Phosphoric Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Acidifiant synthétique (sodas)", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E339", nameFr: "Phosphates de sodium", nameEn: "Sodium Phosphates", category: "stabilizer", halalStatusDefault: "halal", halalExplanationFr: "Sel synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E392", nameFr: "Extrait de romarin", nameEn: "Rosemary Extract", category: "antioxidant", halalStatusDefault: "halal", halalExplanationFr: "Extrait végétal", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },

  // ── EMULSIFIERS/STABILIZERS (E400-E499) — KEY HALAL ZONE ─
  { code: "E400", nameFr: "Acide alginique", nameEn: "Alginic Acid", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Algues marines", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E401", nameFr: "Alginate de sodium", nameEn: "Sodium Alginate", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Algues marines", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E406", nameFr: "Agar-agar", nameEn: "Agar", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Gélifiant d'algues marines", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E407", nameFr: "Carraghénane", nameEn: "Carrageenan", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Algues marines", origin: "plant", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E410", nameFr: "Gomme de caroube", nameEn: "Locust Bean Gum", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Graine de caroubier", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E412", nameFr: "Gomme guar", nameEn: "Guar Gum", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Graine de guar", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E413", nameFr: "Gomme tragacanthe", nameEn: "Tragacanth", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Résine d'arbre", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E414", nameFr: "Gomme arabique", nameEn: "Gum Arabic", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Résine d'acacia", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E415", nameFr: "Gomme xanthane", nameEn: "Xanthan Gum", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Fermentation bactérienne", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E416", nameFr: "Gomme karaya", nameEn: "Karaya Gum", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Résine d'arbre", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E417", nameFr: "Gomme tara", nameEn: "Tara Gum", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Graine de tara", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E418", nameFr: "Gomme gellane", nameEn: "Gellan Gum", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Fermentation bactérienne", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E420", nameFr: "Sorbitol", nameEn: "Sorbitol", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Polyol d'origine végétale", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E421", nameFr: "Mannitol", nameEn: "Mannitol", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Polyol d'origine végétale", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E422", nameFr: "Glycérol", nameEn: "Glycerol", category: "humectant", halalStatusDefault: "doubtful", halalExplanationFr: "Peut être d'origine animale (graisses) ou végétale — origine inconnue", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E432", nameFr: "Polysorbate 20", nameEn: "Polysorbate 20", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Peut contenir des acides gras d'origine animale", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E440", nameFr: "Pectine", nameEn: "Pectin", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Extrait de fruits (pomme, agrumes)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E441", nameFr: "Gélatine", nameEn: "Gelatin", category: "thickener", halalStatusDefault: "haram", halalExplanationFr: "Collagène animal — généralement d'origine porcine ou bovine non-zabiha", origin: "animal", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E442", nameFr: "Phosphatides d'ammonium", nameEn: "Ammonium Phosphatides", category: "emulsifier", halalStatusDefault: "halal", halalExplanationFr: "D'origine végétale (lécithine)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E450", nameFr: "Polyphosphates", nameEn: "Polyphosphates", category: "stabilizer", halalStatusDefault: "halal", halalExplanationFr: "Sels synthétiques", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E460", nameFr: "Cellulose", nameEn: "Cellulose", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Fibre végétale", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E461", nameFr: "Méthylcellulose", nameEn: "Methylcellulose", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Dérivé cellulose", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E464", nameFr: "Hydroxypropylméthylcellulose", nameEn: "HPMC", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Dérivé cellulose", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E466", nameFr: "Carboxyméthylcellulose", nameEn: "CMC", category: "thickener", halalStatusDefault: "halal", halalExplanationFr: "Dérivé cellulose", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E471", nameFr: "Mono/diglycérides d'acides gras", nameEn: "Mono- and Diglycerides", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Origine animale ou végétale non précisée — le plus contesté des additifs", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E472A", nameFr: "Esters acétiques des mono/diglycérides", nameEn: "Acetic Acid Esters", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Dérivé E471, origine incertaine", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E472B", nameFr: "Esters lactiques des mono/diglycérides", nameEn: "Lactic Acid Esters", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Dérivé E471, origine incertaine", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E472C", nameFr: "Esters citriques des mono/diglycérides", nameEn: "Citric Acid Esters", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Dérivé E471, origine incertaine", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E472E", nameFr: "Esters DATEM", nameEn: "DATEM", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Dérivé E471, origine incertaine", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E473", nameFr: "Esters de saccharose", nameEn: "Sucrose Esters", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Peut contenir acides gras animaux", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E474", nameFr: "Sucroglycérides", nameEn: "Sucroglycerides", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Peut contenir acides gras animaux", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E475", nameFr: "Esters polyglycérol", nameEn: "Polyglycerol Esters", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Peut contenir acides gras animaux", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E476", nameFr: "Polyricinoléate de polyglycérol", nameEn: "PGPR", category: "emulsifier", halalStatusDefault: "halal", halalExplanationFr: "Huile de ricin — végétal", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E481", nameFr: "Stéaroyl-2-lactylate de sodium", nameEn: "Sodium Stearoyl Lactylate", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Acide stéarique — origine animale ou végétale variable", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E482", nameFr: "Stéaroyl-2-lactylate de calcium", nameEn: "Calcium Stearoyl Lactylate", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Acide stéarique — origine variable", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E491", nameFr: "Monostéarate de sorbitan", nameEn: "Sorbitan Monostearate", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Acide stéarique — origine variable", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E492", nameFr: "Tristéarate de sorbitan", nameEn: "Sorbitan Tristearate", category: "emulsifier", halalStatusDefault: "doubtful", halalExplanationFr: "Acide stéarique — origine variable", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },

  // ── THICKENERS/MINERALS (E500-E599) ──────────────────
  { code: "E500", nameFr: "Bicarbonate de sodium", nameEn: "Sodium Bicarbonate", category: "raising_agent", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E501", nameFr: "Carbonate de potassium", nameEn: "Potassium Carbonate", category: "raising_agent", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E503", nameFr: "Carbonate d'ammonium", nameEn: "Ammonium Carbonate", category: "raising_agent", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E504", nameFr: "Carbonate de magnésium", nameEn: "Magnesium Carbonate", category: "anti_caking", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E507", nameFr: "Acide chlorhydrique", nameEn: "Hydrochloric Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Acide synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E508", nameFr: "Chlorure de potassium", nameEn: "Potassium Chloride", category: "stabilizer", halalStatusDefault: "halal", halalExplanationFr: "Sel minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E509", nameFr: "Chlorure de calcium", nameEn: "Calcium Chloride", category: "stabilizer", halalStatusDefault: "halal", halalExplanationFr: "Sel minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E516", nameFr: "Sulfate de calcium", nameEn: "Calcium Sulphate", category: "stabilizer", halalStatusDefault: "halal", halalExplanationFr: "Gypse minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E524", nameFr: "Hydroxyde de sodium", nameEn: "Sodium Hydroxide", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E542", nameFr: "Phosphate d'os", nameEn: "Bone Phosphate", category: "anti_caking", halalStatusDefault: "haram", halalExplanationFr: "Extrait d'os d'animaux — haram si d'animal non-zabiha ou de porc", origin: "animal", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E551", nameFr: "Dioxyde de silicium", nameEn: "Silicon Dioxide", category: "anti_caking", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E553", nameFr: "Talc", nameEn: "Talc", category: "anti_caking", halalStatusDefault: "halal", halalExplanationFr: "Minéral", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E570", nameFr: "Acide stéarique", nameEn: "Stearic Acid", category: "glazing_agent", halalStatusDefault: "doubtful", halalExplanationFr: "Peut être d'origine animale ou végétale", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E574", nameFr: "Acide gluconique", nameEn: "Gluconic Acid", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Fermentation", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E575", nameFr: "Glucono-delta-lactone", nameEn: "GDL", category: "acid", halalStatusDefault: "halal", halalExplanationFr: "Fermentation", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },

  // ── FLAVOR ENHANCERS (E600-E699) ─────────────────────
  { code: "E620", nameFr: "Acide glutamique", nameEn: "Glutamic Acid", category: "flavor_enhancer", halalStatusDefault: "halal", halalExplanationFr: "Acide aminé, fermentation", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E621", nameFr: "Glutamate monosodique (MSG)", nameEn: "Monosodium Glutamate", category: "flavor_enhancer", halalStatusDefault: "halal", halalExplanationFr: "Fermentation bactérienne", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: true, riskAllergic: false, healthEffectsFr: "Syndrome du restaurant chinois — maux de tête, limiter chez enfants", efsaStatus: "approved" },
  { code: "E622", nameFr: "Glutamate monopotassique", nameEn: "Monopotassium Glutamate", category: "flavor_enhancer", halalStatusDefault: "halal", halalExplanationFr: "Sel de glutamate", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E627", nameFr: "Guanylate disodique", nameEn: "Disodium Guanylate", category: "flavor_enhancer", halalStatusDefault: "halal", halalExplanationFr: "Synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E631", nameFr: "Inosinate disodique", nameEn: "Disodium Inosinate", category: "flavor_enhancer", halalStatusDefault: "doubtful", halalExplanationFr: "Peut être d'origine animale (poisson, viande)", origin: "mixed", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E635", nameFr: "Ribonucléotides disodiques", nameEn: "Disodium Ribonucleotides", category: "flavor_enhancer", halalStatusDefault: "doubtful", halalExplanationFr: "Mélange E627+E631, peut être d'origine animale", origin: "mixed", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E640", nameFr: "Glycine", nameEn: "Glycine", category: "flavor_enhancer", halalStatusDefault: "doubtful", halalExplanationFr: "Acide aminé — peut être d'origine animale", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },

  // ── GLAZING/WAXES/SWEETENERS (E900-E999) ─────────────
  { code: "E900", nameFr: "Diméthylpolysiloxane", nameEn: "Dimethylpolysiloxane", category: "glazing_agent", halalStatusDefault: "halal", halalExplanationFr: "Synthétique (anti-mousse)", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E901", nameFr: "Cire d'abeille", nameEn: "Beeswax", category: "glazing_agent", halalStatusDefault: "halal", halalExplanationFr: "Produit d'abeille — halal par consensus (comme le miel)", origin: "animal", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E903", nameFr: "Cire de carnauba", nameEn: "Carnauba Wax", category: "glazing_agent", halalStatusDefault: "halal", halalExplanationFr: "Cire végétale (palmier)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E904", nameFr: "Shellac / Gomme-laque", nameEn: "Shellac", category: "glazing_agent", halalStatusDefault: "doubtful", halalExplanationFr: "Résine sécrétée par l'insecte lac — débat entre savants", origin: "insect", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E920", nameFr: "L-Cystéine", nameEn: "L-Cysteine", category: "other", halalStatusDefault: "doubtful", halalExplanationFr: "Peut être extraite de plumes de volaille ou de cheveux humains", origin: "mixed", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E927B", nameFr: "Carbamide (Urée)", nameEn: "Carbamide", category: "other", halalStatusDefault: "halal", halalExplanationFr: "Synthétique", origin: "synthetic", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E938", nameFr: "Argon", nameEn: "Argon", category: "other", halalStatusDefault: "halal", halalExplanationFr: "Gaz noble", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E941", nameFr: "Azote", nameEn: "Nitrogen", category: "other", halalStatusDefault: "halal", halalExplanationFr: "Gaz naturel", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E948", nameFr: "Oxygène", nameEn: "Oxygen", category: "other", halalStatusDefault: "halal", halalExplanationFr: "Gaz naturel", origin: "mineral", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E950", nameFr: "Acésulfame-K", nameEn: "Acesulfame K", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Édulcorant synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E951", nameFr: "Aspartame", nameEn: "Aspartame", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Édulcorant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: true, riskChildren: false, riskAllergic: false, healthEffectsFr: "Contient phénylalanine — dangereux pour phénylcétonurie, déconseillé grossesse", efsaStatus: "approved" },
  { code: "E952", nameFr: "Cyclamate", nameEn: "Cyclamate", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Édulcorant synthétique", origin: "synthetic", toxicityLevel: "moderate_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, healthEffectsFr: "Interdit aux USA, restreint en Europe", efsaStatus: "restricted", bannedCountries: ["USA"] },
  { code: "E953", nameFr: "Isomalt", nameEn: "Isomalt", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Dérivé de betterave", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E954", nameFr: "Saccharine", nameEn: "Saccharin", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Édulcorant synthétique", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E955", nameFr: "Sucralose", nameEn: "Sucralose", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Dérivé de sucre", origin: "synthetic", toxicityLevel: "low_concern", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E960", nameFr: "Stéviol glycosides (Stévia)", nameEn: "Steviol Glycosides", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Extrait de plante stevia", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E965", nameFr: "Maltitol", nameEn: "Maltitol", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Polyol d'origine végétale", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E966", nameFr: "Lactitol", nameEn: "Lactitol", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Dérivé du lactose", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E967", nameFr: "Xylitol", nameEn: "Xylitol", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Polyol d'origine végétale (bouleau)", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
  { code: "E968", nameFr: "Erythritol", nameEn: "Erythritol", category: "sweetener", halalStatusDefault: "halal", halalExplanationFr: "Polyol fermentation", origin: "plant", toxicityLevel: "safe", riskPregnant: false, riskChildren: false, riskAllergic: false, efsaStatus: "approved" },
];

// ── Madhab-Specific Rulings ─────────────────────────────────

export const MADHAB_RULINGS: Omit<NewAdditiveMadhabRuling, "id" | "createdAt">[] = [
  // E441 Gelatin — most contested
  { additiveCode: "E441", madhab: "hanafi", ruling: "doubtful", explanationFr: "Débat sur l'istihalah (transformation chimique). Certains grands savants hanafis acceptent que la transformation rend la gélatine pure, mais la majorité des muftis contemporains considèrent la transformation insuffisante.", explanationEn: "Debate on istihalah. Some senior Hanafi scholars accept transformation makes gelatin pure, but most contemporary muftis consider it insufficient.", scholarlyReference: "SeekersGuidance, Darul Ifta Azaadville" },
  { additiveCode: "E441", madhab: "shafii", ruling: "haram", explanationFr: "L'école shafi'ite n'accepte pas l'istihalah pour les substances najis. La gélatine d'animal non-zabiha ou porcine reste impure.", explanationEn: "Shafi'i school does not accept istihalah for najis substances.", scholarlyReference: "IslamQA, Utrujj Foundation" },
  { additiveCode: "E441", madhab: "maliki", ruling: "doubtful", explanationFr: "Certains savants malikites et conférences islamiques modernes ont accepté l'istihalah même pour la gélatine porcine. Position non unanime.", scholarlyReference: "Virtual Mosque, IIFA" },
  { additiveCode: "E441", madhab: "hanbali", ruling: "haram", explanationFr: "Le fiqh hanbalite classique considère les produits d'animaux non-abattus comme impurs. Pas d'exception via l'istihalah.", scholarlyReference: "IslamQA.info" },

  // E471 Mono/diglycerides — when origin unknown
  { additiveCode: "E471", madhab: "hanafi", ruling: "doubtful", explanationFr: "Si d'origine végétale : halal. Si d'origine animale non-zabiha : douteux. Vérifier l'étiquetage ou le statut vegan.", scholarlyReference: "SeekersGuidance" },
  { additiveCode: "E471", madhab: "shafii", ruling: "doubtful", explanationFr: "Douteux si origine inconnue. Halal si confirmé végétal. Haram si d'animal non-zabiha.", scholarlyReference: "IslamQA" },
  { additiveCode: "E471", madhab: "maliki", ruling: "doubtful", explanationFr: "Origine inconnue = douteux. La plupart des savants malikites recommandent la prudence.", scholarlyReference: "IIFA" },
  { additiveCode: "E471", madhab: "hanbali", ruling: "doubtful", explanationFr: "Position identique aux autres écoles : douteux si origine non confirmée.", scholarlyReference: "IslamQA.info" },

  // E120 Carmine — consensus haram
  { additiveCode: "E120", madhab: "hanafi", ruling: "haram", explanationFr: "Extrait d'insectes (cochenille). Les insectes ne sont pas halal dans le fiqh hanafite.", scholarlyReference: "SeekersGuidance" },
  { additiveCode: "E120", madhab: "shafii", ruling: "haram", explanationFr: "Insectes impurs — haram par consensus shafi'ite.", scholarlyReference: "IslamQA" },
  { additiveCode: "E120", madhab: "maliki", ruling: "haram", explanationFr: "Haram — les insectes ne sont pas licites à la consommation.", scholarlyReference: "IIFA" },
  { additiveCode: "E120", madhab: "hanbali", ruling: "haram", explanationFr: "Haram — consensus des quatre écoles sur les insectes.", scholarlyReference: "IslamQA.info" },

  // E542 Bone phosphate — consensus haram
  { additiveCode: "E542", madhab: "hanafi", ruling: "haram", explanationFr: "Phosphate extrait d'os d'animaux — haram si d'animal non-zabiha ou de porc.", scholarlyReference: "Darul Ifta" },
  { additiveCode: "E542", madhab: "shafii", ruling: "haram", explanationFr: "Os d'animal non-zabiha = najis. Haram.", scholarlyReference: "IslamQA" },
  { additiveCode: "E542", madhab: "maliki", ruling: "haram", explanationFr: "Haram — même raisonnement.", scholarlyReference: "IIFA" },
  { additiveCode: "E542", madhab: "hanbali", ruling: "haram", explanationFr: "Haram — consensus.", scholarlyReference: "IslamQA.info" },

  // E904 Shellac — debated
  { additiveCode: "E904", madhab: "hanafi", ruling: "doubtful", explanationFr: "Résine sécrétée par l'insecte lac. Certains hanafis la comparent au miel (produit d'insecte acceptable). Non consensuel.", scholarlyReference: "SeekersGuidance" },
  { additiveCode: "E904", madhab: "shafii", ruling: "doubtful", explanationFr: "Position prudente — produit d'insecte, mais certains la comparent au miel.", scholarlyReference: "IslamQA" },

  // E920 L-Cysteine
  { additiveCode: "E920", madhab: "hanafi", ruling: "doubtful", explanationFr: "Peut être extraite de plumes de volaille (halal si zabiha) ou de cheveux humains (haram). Origine à vérifier.", scholarlyReference: "SeekersGuidance" },
  { additiveCode: "E920", madhab: "shafii", ruling: "doubtful", explanationFr: "Même position — si cheveux humains : haram.", scholarlyReference: "IslamQA" },

  // E422 Glycerol
  { additiveCode: "E422", madhab: "hanafi", ruling: "doubtful", explanationFr: "Le glycérol peut être d'origine animale ou végétale. Douteux si non précisé.", scholarlyReference: "SeekersGuidance" },
  { additiveCode: "E422", madhab: "shafii", ruling: "doubtful", explanationFr: "Même raisonnement — origine inconnue = douteux.", scholarlyReference: "IslamQA" },
];

// ── Main Seed Function ──────────────────────────────────────

async function seedAdditives() {
  console.log("🧪 Seeding additives database...");

  for (const additive of ADDITIVES_DATA) {
    await db
      .insert(additives)
      .values(additive)
      .onConflictDoUpdate({
        target: additives.code,
        set: {
          nameFr: additive.nameFr,
          nameEn: additive.nameEn,
          category: additive.category,
          halalStatusDefault: additive.halalStatusDefault,
          halalExplanationFr: additive.halalExplanationFr,
          origin: additive.origin,
          toxicityLevel: additive.toxicityLevel,
          adiMgPerKg: additive.adiMgPerKg,
          riskPregnant: additive.riskPregnant,
          riskChildren: additive.riskChildren,
          riskAllergic: additive.riskAllergic,
          healthEffectsFr: additive.healthEffectsFr,
          efsaStatus: additive.efsaStatus,
          bannedCountries: additive.bannedCountries,
          updatedAt: new Date(),
        },
      });
  }

  console.log(`✅ ${ADDITIVES_DATA.length} additives seeded`);

  console.log("🕌 Seeding madhab rulings...");

  for (const ruling of MADHAB_RULINGS) {
    await db
      .insert(additiveMadhabRulings)
      .values(ruling)
      .onConflictDoNothing();
  }

  console.log(`✅ ${MADHAB_RULINGS.length} madhab rulings seeded`);
}

// Only run standalone when executed directly (not imported by unified runner)
const isMainModule = process.argv[1]?.includes("additives-seed");
if (isMainModule) {
  seedAdditives()
    .then(() => {
      console.log("🎉 Additives seed complete!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
