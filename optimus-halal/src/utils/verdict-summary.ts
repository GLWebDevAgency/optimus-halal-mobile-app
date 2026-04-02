/**
 * buildVerdictSummary — Generates intelligent, contextual verdict text
 *
 * Synthesizes madhab consensus + certifier trust into a natural sentence.
 * Tone: expert fiqh knowledge, bienveillant, never alarmist.
 *
 * V2: Matrix-based unified verdict (matrixLabel + matrixPhrase + matrixLevel)
 * combining NaqiyScore™ thresholds + composition analysis + consensus.
 */

export type MatrixLevel = "high" | "good" | "vigilance" | "low" | "danger" | "unknown";

export interface VerdictSummaryInput {
  madhabVerdicts: Array<{ madhab: string; status: string }>;
  certifierName: string | null;
  certifierGrade: string | null; // "Très fiable" | "Fiable" | "Vigilance" | "Peu fiable" | "Pas fiable du tout"
  certifierScore: number | null; // 0-100
  /** Number of conflicting (doubtful/haram) ingredients+additives detected */
  conflictCount?: number;
}

export type CompositionStatus = "halal" | "doubtful" | "haram" | "unknown";

export type AdviceTextId = "A" | "B" | "C" | "D";

export interface VerdictSummaryResult {
  /** Main verdict line — fiqh analysis */
  fiqhLine: string;
  /** Short verdict line for compact contexts (ShareCard) */
  shortFiqhLine: string;
  /** Secondary line — certifier assessment (null if no certifier) */
  certifierLine: string | null;
  /** Theoretical nuance note — only set when a certifier is present */
  theoreticalNote: string | null;
  /** Whether this is a doubtful verdict (triggers "Notre conseil Naqiy" button) */
  isDoubtful: boolean;
  /** Whether all 4 schools agree */
  isConsensus: boolean;
  /** The consensus status if all agree, else the majority */
  dominantStatus: string;
  /** Matrix verdict label — bold header text (e.g. "Confiance élevée") */
  matrixLabel: string;
  /** Matrix verdict phrase — unified explanation */
  matrixPhrase: string;
  /** Matrix confidence level for color styling */
  matrixLevel: MatrixLevel;
  /** Composition status derived from madhab verdicts (conservative) */
  compositionStatus: CompositionStatus;
}

interface VerdictTranslations {
  fiqh4Halal: string;
  fiqh4Haram: string;
  fiqh4Doubtful: string;
  fiqh4Unknown: string;
  fiqhMajority: string;
  fiqhDivergent: string;
  certifierAlso: string;
  certifierHowever: string;
  certifierNone: string;
  certifierNoScore: string;
  theoreticalNote: string;
  short4Halal: string;
  short4Haram: string;
  short4Doubtful: string;
  short4Unknown: string;
  shortMajority: string;
  shortDivergent: string;
  // Matrix verdict translations
  matrixHighConfidenceLabel: string;
  matrixHighConfidencePhrase: string;
  matrixGoodConfidenceLabel: string;
  matrixGoodConfidencePhrase: string;
  matrixVigilanceCleanLabel: string;
  matrixVigilanceCleanPhrase: string;
  matrixLowReliabilityLabel: string;
  matrixLowReliabilityPhrase: string;
  matrixNotReliableLabel: string;
  matrixNotReliablePhrase: string;
  matrixDoubtfulHighLabel: string;
  matrixDoubtfulHighPhrase: string;
  matrixDoubleVigilanceLabel: string;
  matrixDoubleVigilancePhrase: string;
  matrixNotRecommendedLabel: string;
  matrixNotRecommendedPhrase: string;
  matrixHaramLabel: string;
  matrixHaramPhrase: string;
  matrixNoCertCleanLabel: string;
  matrixNoCertCleanPhrase: string;
  matrixNoCertDoubtfulLabel: string;
  matrixNoCertDoubtfulPhrase: string;
  matrixNoCertHaramLabel: string;
  matrixNoCertHaramPhrase: string;
  matrixNoCertUnknownLabel: string;
  matrixNoCertUnknownPhrase: string;
  matrixCertUnknownLabel: string;
  matrixCertUnknownPhrase: string;
}

export function buildVerdictSummary(
  input: VerdictSummaryInput,
  verdictT: VerdictTranslations,
): VerdictSummaryResult {
  const { madhabVerdicts, certifierName, certifierGrade, certifierScore, conflictCount = 0 } =
    input;

  // Analyze madhab consensus
  const statuses = madhabVerdicts.map((v) => v.status);
  const uniqueStatuses = new Set(statuses);
  const isConsensus = uniqueStatuses.size === 1;
  const dominantStatus = isConsensus
    ? statuses[0]
    : getMajorityStatus(statuses);

  // Build fiqh line + short fiqh line (kept for ShareCard & backward compat)
  let fiqhLine: string;
  let shortFiqhLine: string;
  let isDoubtful = false;

  if (isConsensus) {
    switch (statuses[0]) {
      case "halal":
        fiqhLine = verdictT.fiqh4Halal;
        shortFiqhLine = verdictT.short4Halal;
        break;
      case "haram":
        fiqhLine = verdictT.fiqh4Haram;
        shortFiqhLine = verdictT.short4Haram;
        break;
      case "doubtful":
        fiqhLine = verdictT.fiqh4Doubtful;
        shortFiqhLine = verdictT.short4Doubtful;
        isDoubtful = true;
        break;
      default:
        fiqhLine = verdictT.fiqh4Unknown;
        shortFiqhLine = verdictT.short4Unknown;
        break;
    }
  } else {
    // Count halal verdicts
    const halalCount = statuses.filter((s) => s === "halal").length;
    if (halalCount >= 3) {
      const dissenting = madhabVerdicts.find((v) => v.status !== "halal");
      const schoolNames: Record<string, string> = {
        hanafi: "Hanafi",
        shafii: "Shafi'i",
        maliki: "Maliki",
        hanbali: "Hanbali",
      };
      fiqhLine = verdictT.fiqhMajority
        .replace("{n}", String(halalCount))
        .replace(
          "{school}",
          schoolNames[dissenting?.madhab ?? ""] ?? dissenting?.madhab ?? "",
        );
      shortFiqhLine = verdictT.shortMajority
        .replace("{n}", String(halalCount));
    } else {
      fiqhLine = verdictT.fiqhDivergent;
      shortFiqhLine = verdictT.shortDivergent;
      if (statuses.some((s) => s === "doubtful")) isDoubtful = true;
    }
  }

  // Build certifier line (legacy)
  let certifierLine: string | null = null;
  if (certifierName && certifierScore !== null && certifierGrade) {
    if (certifierScore >= 60) {
      certifierLine = verdictT.certifierAlso
        .replace("{name}", certifierName)
        .replace("{grade}", certifierGrade)
        .replace("{score}", String(certifierScore));
    } else {
      certifierLine = verdictT.certifierHowever
        .replace("{name}", certifierName)
        .replace("{grade}", certifierGrade)
        .replace("{score}", String(certifierScore));
    }
  } else if (certifierName) {
    certifierLine = verdictT.certifierNoScore.replace("{name}", certifierName);
  }

  // Theoretical note — only when a certifier is present
  const theoreticalNote = certifierName ? verdictT.theoreticalNote : null;

  // ── Matrix verdict (V2) ──
  // Composition status: conservative — any haram/doubtful in ANY school triggers it
  // All unknown = insufficient data (not "clean")
  const isCertified = certifierName !== null && certifierScore !== null;
  const hasHaram = statuses.includes("haram");
  const hasDoubtful = statuses.includes("doubtful");
  const isAllUnknown = statuses.every((s) => s === "unknown");
  const compositionStatus: CompositionStatus = isAllUnknown
    ? "unknown"
    : hasHaram ? "haram" : hasDoubtful ? "doubtful" : "halal";
  const score = certifierScore ?? 0;
  const count = conflictCount > 0 ? String(conflictCount) : "1";

  let matrixLabel: string;
  let matrixPhrase: string;
  let matrixLevel: MatrixLevel;

  if (compositionStatus === "unknown") {
    // All schools unknown — insufficient data, regardless of certification
    if (isCertified) {
      matrixLabel = verdictT.matrixCertUnknownLabel;
      matrixPhrase = verdictT.matrixCertUnknownPhrase;
    } else {
      matrixLabel = verdictT.matrixNoCertUnknownLabel;
      matrixPhrase = verdictT.matrixNoCertUnknownPhrase;
    }
    matrixLevel = "unknown";
  } else if (isCertified) {
    if (compositionStatus === "haram") {
      // Certified + Haram → any score
      matrixLabel = verdictT.matrixHaramLabel;
      matrixPhrase = verdictT.matrixHaramPhrase.replace("{count}", count);
      matrixLevel = "danger";
      isDoubtful = true;
    } else if (compositionStatus === "doubtful") {
      // Certified + Doubtful
      isDoubtful = true;
      if (score >= 70) {
        matrixLabel = verdictT.matrixDoubtfulHighLabel;
        matrixPhrase = verdictT.matrixDoubtfulHighPhrase.replace("{count}", count);
        matrixLevel = "vigilance";
      } else if (score >= 51) {
        matrixLabel = verdictT.matrixDoubleVigilanceLabel;
        matrixPhrase = verdictT.matrixDoubleVigilancePhrase.replace("{score}", String(score));
        matrixLevel = "low";
      } else {
        matrixLabel = verdictT.matrixNotRecommendedLabel;
        matrixPhrase = verdictT.matrixNotRecommendedPhrase.replace("{score}", String(score));
        matrixLevel = "danger";
      }
    } else {
      // Certified + Clean (halal consensus)
      if (score >= 90) {
        matrixLabel = verdictT.matrixHighConfidenceLabel;
        matrixPhrase = verdictT.matrixHighConfidencePhrase;
        matrixLevel = "high";
      } else if (score >= 70) {
        matrixLabel = verdictT.matrixGoodConfidenceLabel;
        matrixPhrase = verdictT.matrixGoodConfidencePhrase;
        matrixLevel = "good";
      } else if (score >= 51) {
        matrixLabel = verdictT.matrixVigilanceCleanLabel;
        matrixPhrase = verdictT.matrixVigilanceCleanPhrase.replace("{score}", String(score));
        matrixLevel = "vigilance";
        isDoubtful = true;
      } else if (score >= 35) {
        matrixLabel = verdictT.matrixLowReliabilityLabel;
        matrixPhrase = verdictT.matrixLowReliabilityPhrase.replace("{score}", String(score));
        matrixLevel = "low";
        isDoubtful = true;
      } else {
        matrixLabel = verdictT.matrixNotReliableLabel;
        matrixPhrase = verdictT.matrixNotReliablePhrase
          .replace("{name}", certifierName!)
          .replace("{score}", String(score));
        matrixLevel = "danger";
        isDoubtful = true;
      }
    }
  } else {
    // Not certified — jump straight to composition analysis
    if (compositionStatus === "haram") {
      matrixLabel = verdictT.matrixNoCertHaramLabel;
      matrixPhrase = verdictT.matrixNoCertHaramPhrase;
      matrixLevel = "danger";
      isDoubtful = true;
    } else if (compositionStatus === "doubtful") {
      matrixLabel = verdictT.matrixNoCertDoubtfulLabel;
      matrixPhrase = verdictT.matrixNoCertDoubtfulPhrase;
      matrixLevel = "vigilance";
      isDoubtful = true;
    } else {
      matrixLabel = verdictT.matrixNoCertCleanLabel;
      matrixPhrase = verdictT.matrixNoCertCleanPhrase;
      matrixLevel = "good";
    }
  }

  return {
    fiqhLine, shortFiqhLine, certifierLine, theoreticalNote,
    isDoubtful, isConsensus, dominantStatus,
    matrixLabel, matrixPhrase, matrixLevel, compositionStatus,
  };
}

/**
 * selectAdviceTexts — Returns the ordered list of hadiths/verses to display
 * in the "Notre conseil Naqiy" bottom sheet.
 *
 * A = An-Nu'man / Bukhari 52 — foundational hadith on doubt
 * B = Al-Hassan ibn Ali / Tirmidhi 2518 — "leave doubt for certainty"
 * C = Al-Baqarah 2:168 — "halal AND tayyib" (elevates the standard)
 * D = Abu Hurairah / Muslim 1015 — food impacts du'a (strongest warning)
 *
 * Rules:
 *   halal  (danger/low/vigilance) → [C, B, A, D]
 *   doubtful (any level)          → [C, B, A, D]
 *   haram                         → [C, D]
 */
export function selectAdviceTexts(
  _matrixLevel: MatrixLevel,
  compositionStatus: CompositionStatus,
): AdviceTextId[] {
  if (compositionStatus === "haram") return ["C", "D"];
  return ["C", "B", "A", "D"];
}

function getMajorityStatus(statuses: string[]): string {
  const counts = new Map<string, number>();
  for (const s of statuses) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  let maxCount = 0;
  let majority = "unknown";
  for (const [status, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      majority = status;
    }
  }
  return majority;
}
