/**
 * buildVerdictSummary — Generates intelligent, contextual verdict text
 *
 * Synthesizes madhab consensus + certifier trust into a natural sentence.
 * Tone: expert fiqh knowledge, bienveillant, never alarmist.
 */

export interface VerdictSummaryInput {
  madhabVerdicts: Array<{ madhab: string; status: string }>;
  certifierName: string | null;
  certifierGrade: string | null; // "Excellent" | "Bon" | "Correct" | "Faible" | "Insuffisant"
  certifierScore: number | null; // 0-100
}

export interface VerdictSummaryResult {
  /** Main verdict line — fiqh analysis */
  fiqhLine: string;
  /** Secondary line — certifier assessment (null if no certifier) */
  certifierLine: string | null;
  /** Whether this is a doubtful verdict (triggers "Notre conseil Naqiy" button) */
  isDoubtful: boolean;
  /** Whether all 4 schools agree */
  isConsensus: boolean;
  /** The consensus status if all agree, else the majority */
  dominantStatus: string;
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
}

export function buildVerdictSummary(
  input: VerdictSummaryInput,
  verdictT: VerdictTranslations,
): VerdictSummaryResult {
  const { madhabVerdicts, certifierName, certifierGrade, certifierScore } =
    input;

  // Analyze madhab consensus
  const statuses = madhabVerdicts.map((v) => v.status);
  const uniqueStatuses = new Set(statuses);
  const isConsensus = uniqueStatuses.size === 1;
  const dominantStatus = isConsensus
    ? statuses[0]
    : getMajorityStatus(statuses);

  // Build fiqh line
  let fiqhLine: string;
  let isDoubtful = false;

  if (isConsensus) {
    switch (statuses[0]) {
      case "halal":
        fiqhLine = verdictT.fiqh4Halal;
        break;
      case "haram":
        fiqhLine = verdictT.fiqh4Haram;
        break;
      case "doubtful":
        fiqhLine = verdictT.fiqh4Doubtful;
        isDoubtful = true;
        break;
      default:
        fiqhLine = verdictT.fiqh4Unknown;
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
    } else {
      fiqhLine = verdictT.fiqhDivergent;
      if (statuses.some((s) => s === "doubtful")) isDoubtful = true;
    }
  }

  // Build certifier line
  let certifierLine: string | null = null;
  if (certifierName && certifierScore !== null && certifierGrade) {
    // Score >= 60 -> positive framing ("Egalement"), < 60 -> cautionary ("Toutefois")
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
  } else {
    certifierLine = verdictT.certifierNone;
  }

  return { fiqhLine, certifierLine, isDoubtful, isConsensus, dominantStatus };
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
