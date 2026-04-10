export interface MatchPatternView {
  substanceId: string;
  patternType: string;
  patternValue: string;
  lang: string | null;
  priority: number;
  confidence: number;
}

export interface IMatchPatternRepo {
  getAllActive(): Promise<MatchPatternView[]>;
}
