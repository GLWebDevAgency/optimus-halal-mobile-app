import type { DetectedSubstance, AnimalSourceHint, AlcoholContext, ProductCategory, MeatClassification } from "../../services/ai-extract/types.js";

export interface ProductContext {
  readonly barcode: string;
  readonly brand: string | null;
  readonly brandOwner: string | null;
  readonly productName: string | null;
  readonly category: ProductCategory;
  readonly usage: "ingestion" | "topical" | "medicinal";
  readonly meatClassification: MeatClassification | null;
  readonly substancesDetected: DetectedSubstance[];
  readonly animalSourceHints: AnimalSourceHint[];
  readonly alcoholContext: AlcoholContext;
  readonly additivesTags: string[];
  readonly ingredientsList: string[];
  readonly ingredientsText: string | null;
  readonly labelsTags: string[];
  readonly ingredientsAnalysisTags: string[];
  readonly completeness: number | null;
  readonly extractionSource: "gemini" | "off_structured" | "regex" | "vocabulary_fuzzy";
}
