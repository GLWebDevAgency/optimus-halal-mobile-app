export interface SubstanceDossierView {
  id: string;
  substanceId: string;
  version: string;
  dossierJson: Record<string, unknown>;
  contentHash: string;
  fatwaCount: number | null;
}

export interface IDossierRepo {
  getActive(substanceId: string): Promise<SubstanceDossierView | null>;
  batchGetActive(substanceIds: string[]): Promise<Map<string, SubstanceDossierView>>;
}
