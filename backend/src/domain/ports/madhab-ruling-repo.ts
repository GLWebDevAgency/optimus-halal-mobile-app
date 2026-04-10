export interface MadhabRulingView {
  substanceId: string;
  madhab: string;
  ruling: string;
  contemporarySplit: boolean;
  classicalSources: string[];
  contemporarySources: string[];
}

export interface IMadhabRulingRepo {
  get(substanceId: string, madhab: string): Promise<MadhabRulingView | null>;
  batchGet(substanceIds: string[], madhab: string): Promise<Map<string, MadhabRulingView>>;
}
