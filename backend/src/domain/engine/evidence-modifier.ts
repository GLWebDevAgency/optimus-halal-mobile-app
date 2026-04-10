/**
 * Evidence Modifier — Pure function for CertifierTrustEngine.
 *
 * Computes the adjusted score for a single practice tuple based on:
 *   1. The certifier's evidence level (how they prove compliance)
 *   2. Whether required evidence (mortality data, wake tests) is actually provided
 *
 * All penalties are NEGATIVE. The result is clamped to [0, base].
 * Evidence level "none" floors the score to 10 regardless of base.
 *
 * Penalty stacking order (C8 resolution):
 *   Step 1: Apply evidence level penalty
 *   Step 2: Apply cumulative required evidence penalties
 *   Step 3: Clamp to [0, 100]
 *
 * @see docs/superpowers/specs/2026-04-09-halal-engine-v2-design.md §7.1
 */

/** Evidence level penalty map — ordered from best to worst */
const EVIDENCE_LEVEL_PENALTY: Record<string, number> = {
  third_party_audit: 0,
  fulltime_muslim_inspector: -2,
  audit_report_self: -5,
  protocol_published: -8,
  declaration: -12,
};

/** Required evidence penalty map — applied cumulatively when evidence is missing */
const REQUIRED_EVIDENCE_PENALTY: Record<string, number> = {
  mortality_rate_published: -10,
  wake_tests_performed: -8,
};

/**
 * Apply evidence-based modifier to a practice tuple's base score.
 *
 * @param baseScore    - The madhab-specific verdict score (0-100) from the practice tuple
 * @param evidenceLevel - How the certifier proves compliance with this practice
 * @param requiredEvidence - Evidence items required by this practice tuple
 * @param actualEvidence   - Evidence items actually provided by the certifier (from acceptance.evidenceDetails)
 * @returns Adjusted score, clamped to [0, 100]
 */
export function applyEvidenceModifier(
  baseScore: number,
  evidenceLevel: string,
  requiredEvidence: string[],
  actualEvidence: Record<string, unknown> | null,
): number {
  // Step 0: If base is already 0, nothing to modify
  if (baseScore <= 0) return 0;

  // Step 1: Evidence level "none" → floor to 10
  if (evidenceLevel === "none" || !(evidenceLevel in EVIDENCE_LEVEL_PENALTY)) {
    return Math.min(10, baseScore);
  }

  // Step 1: Apply evidence level penalty
  let adjusted = baseScore + EVIDENCE_LEVEL_PENALTY[evidenceLevel];

  // Step 2: Apply cumulative required evidence penalties for missing items
  for (const req of requiredEvidence) {
    const penalty = REQUIRED_EVIDENCE_PENALTY[req];
    if (penalty !== undefined) {
      // Only apply penalty if this evidence is NOT provided in actualEvidence
      const isSatisfied = actualEvidence?.[req] === true;
      if (!isSatisfied) {
        adjusted += penalty;
      }
    }
  }

  // Step 3: Clamp to [0, 100]
  return Math.max(0, Math.min(100, adjusted));
}
