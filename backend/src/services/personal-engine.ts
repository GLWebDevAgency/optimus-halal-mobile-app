/**
 * PersonalEngine — Allergen + Pregnancy + Children alerts.
 *
 * Pure function, no DB access. Extracted from scan.ts V1 personal alerts logic.
 * The orchestrator pre-fetches all data and passes it in.
 *
 * Freemium gate: if `canAllergenProfile` is false (free user without
 * allergen entitlement), return empty alerts + upsellHint (§12).
 */

export interface PersonalAlert {
  type: "allergen" | "health" | "boycott";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface PersonalReport {
  alerts: PersonalAlert[];
  upsellHint: string | null;
}

export interface RiskyAdditive {
  code: string;
  nameFr: string;
  riskPregnant: boolean;
  riskChildren: boolean;
  healthEffectsFr: string | null;
}

export interface AllergenMatch {
  displayName: string;
  matchType: "allergen" | "trace";
  severity: "high" | "medium" | "low";
}

/**
 * Evaluate personal alerts for a scan result.
 *
 * @param allergenMatches - Pre-computed allergen matches (from matchAllergens)
 * @param userAllergens - User's allergen profile (null if not set)
 * @param isPregnant - User's pregnancy status
 * @param hasChildren - User has children flag
 * @param riskyAdditives - Additives with risk flags from DB
 * @param canAllergenProfile - false for free users → empty alerts + upsell hint
 */
export function evaluatePersonalAlerts(
  allergenMatches: AllergenMatch[],
  userAllergens: string[] | null,
  isPregnant: boolean,
  hasChildren: boolean,
  riskyAdditives: RiskyAdditive[],
  canAllergenProfile: boolean,
): PersonalReport {
  // Freemium gate: free users get upsell hint, no alerts
  if (!canAllergenProfile) {
    return {
      alerts: [],
      upsellHint: "allergens_profile",
    };
  }

  const alerts: PersonalAlert[] = [];

  // Allergen matching (only if user has allergen profile)
  if (userAllergens?.length && allergenMatches.length > 0) {
    for (const match of allergenMatches) {
      const isTrace = match.matchType === "trace";
      alerts.push({
        type: "allergen",
        severity: match.severity,
        title: isTrace
          ? `Traces possibles : ${match.displayName}`
          : `Contient : ${match.displayName}`,
        description: isTrace
          ? `Ce produit peut contenir des traces de ${match.displayName}.`
          : `Ce produit contient un allergène de votre profil (${match.displayName}).`,
      });
    }
  }

  // Pregnancy warnings
  if (isPregnant) {
    for (const additive of riskyAdditives) {
      if (additive.riskPregnant) {
        alerts.push({
          type: "health",
          severity: "high",
          title: `${additive.code} déconseillé (grossesse)`,
          description:
            additive.healthEffectsFr ??
            `${additive.nameFr} est déconseillé aux femmes enceintes.`,
        });
      }
    }
  }

  // Children warnings
  if (hasChildren) {
    for (const additive of riskyAdditives) {
      if (additive.riskChildren) {
        alerts.push({
          type: "health",
          severity: "medium",
          title: `${additive.code} attention (enfants)`,
          description:
            additive.healthEffectsFr ??
            `${additive.nameFr} peut affecter les enfants.`,
        });
      }
    }
  }

  return {
    alerts,
    upsellHint: null,
  };
}
