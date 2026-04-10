export interface SubstanceScenarioView {
  substanceId: string;
  scenarioKey: string;
  matchConditions: Record<string, unknown>;
  specificity: number;
  score: number;
  verdict: string;
  rationaleFr: string;
  rationaleEn: string | null;
  rationaleAr: string | null;
  dossierSectionRef: string | null;
}

export interface IScenarioRepo {
  forSubstance(substanceId: string): Promise<SubstanceScenarioView[]>;
  batchForSubstances(substanceIds: string[]): Promise<Map<string, SubstanceScenarioView[]>>;
}
