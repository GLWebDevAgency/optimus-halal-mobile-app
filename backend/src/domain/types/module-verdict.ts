export type HalalVerdict = "halal" | "halal_with_caution" | "mashbooh" | "avoid" | "haram";

export interface ModuleVerdict {
  readonly substanceId: string;
  readonly displayName: string;
  readonly score: number;           // 0..100
  readonly verdict: HalalVerdict;
  readonly scenarioKey: string;
  readonly rationaleFr: string;
  readonly rationaleAr: string | null;
  readonly madhabNote: string | null;
  readonly fatwaCount: number;
  readonly dossierId: string;
  readonly icon: "insect" | "alcohol" | "animal" | "enzyme" | "process" | "source" | "other";
}
