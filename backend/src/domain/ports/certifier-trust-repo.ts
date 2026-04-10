/**
 * Port interface for the CertifierTrustEngine (Certified Track).
 *
 * Provides access to certifier tuple acceptances and live events
 * without coupling the domain to any specific data source.
 */

export interface CertifierTupleView {
  tupleSlug: string;
  familyId: string;
  dimensions: Record<string, unknown>;
  verdictHanafi: number;
  verdictMaliki: number;
  verdictShafii: number;
  verdictHanbali: number;
  requiredEvidence: string[];
  dossierSectionRef: string;
  typicalMortalityPctMin: number | null;
  typicalMortalityPctMax: number | null;
  notesFr: string | null;
}

export interface CertifierAcceptanceView {
  tupleSlug: string;
  stance: string;
  evidenceLevel: string;
  evidenceDetails: Record<string, unknown> | null;
}

export interface CertifierEventView {
  scoreImpact: number;
  occurredAt: string;
  isActive: boolean;
}

export interface ICertifierTrustRepo {
  /**
   * Load accepted (stance=accepts|conditional) tuples for a certifier,
   * optionally filtered by species dimension.
   */
  getAcceptedTuples(
    certifierId: string,
    species?: string,
  ): Promise<Array<{ tuple: CertifierTupleView; acceptance: CertifierAcceptanceView }>>;

  /**
   * Load active certifier events within a rolling window (months).
   */
  getLiveEvents(certifierId: string, windowMonths: number): Promise<CertifierEventView[]>;
}
