/**
 * useScanV2 — Hook for V2 Halal Engine scan endpoint.
 *
 * Calls `scan.scanBarcodeV2` via tRPC and maps the response
 * to the V2 UI types used by ScanResultScreenV2 components.
 *
 * @module hooks/useScanV2
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/analytics";
import type {
  HalalReportV2,
  HealthSummaryData,
  PersonalAlertV2,
  BoycottAlertData,
  AlternativeProductV2,
  AlgorithmicTraceStep,
  CertifierTrustScores,
  CertifierPractice,
} from "@/components/scan-v2/scan-v2-types";

// ── Response shape from backend ScanResultDTO ──

interface ScanV2RawResponse {
  product: Record<string, unknown> | null;
  halal: {
    verdict: string;
    score: number;
    confidence: number;
    tier: string;
    headlineFr: string;
    headlineEn: string;
    headlineAr: string;
    certifier: { id: string; name: string; logoUrl?: string } | null;
    signals: Array<{
      substanceId: string;
      displayName: string;
      score: number;
      verdict: string;
      scenarioKey: string;
      rationaleFr: string;
      rationaleAr: string | null;
      madhabNote: string | null;
      fatwaCount: number;
      dossierId: string;
      icon: string;
    }>;
    madhabApplied: string;
    madhabDivergence: boolean;
    hasFullDossier: boolean;
    engineVersion: string;
    analysisSourceLabel: string;
  };
  health: Record<string, unknown> | null;
  personal: {
    alerts: Array<{
      type: string;
      severity: string;
      title: string;
      description: string;
      iconName?: string;
    }>;
    upsellHint: boolean;
  };
  boycott: {
    isBoycotted: boolean;
    brandName: string;
    reason: string;
    source: string;
    sourceUrl?: string;
    alternatives?: string[];
  } | null;
  alternatives: null;
  context: {
    engineVersion: string;
    madhab: string;
    tier: string;
    track: string;
  };
  gamification: Record<string, unknown> | null;
}

// ── Mapped V2 data for the UI ──

export interface ScanV2Data {
  product: Record<string, unknown> | null;
  halalReport: HalalReportV2;
  healthSummary: HealthSummaryData | null;
  personalAlerts: PersonalAlertV2[];
  personalUpsellHint: boolean;
  boycott: BoycottAlertData | null;
  alternatives: AlternativeProductV2[];
  traceSteps: AlgorithmicTraceStep[];
  certifierTrustScores: CertifierTrustScores | null;
  certifierPractices: CertifierPractice[];
  context: {
    engineVersion: string;
    madhab: string;
    tier: string;
    track: string;
  };
}

// ── Mapper: backend DTO → V2 UI types ──

function mapResponseToV2(raw: ScanV2RawResponse): ScanV2Data {
  const halal = raw.halal;

  const halalReport: HalalReportV2 = {
    verdict: halal.verdict as HalalReportV2["verdict"],
    score: halal.score,
    confidence: halal.confidence,
    tier: halal.tier as HalalReportV2["tier"],
    headlineFr: halal.headlineFr,
    headlineEn: halal.headlineEn,
    headlineAr: halal.headlineAr,
    certifier: halal.certifier
      ? {
          id: halal.certifier.id,
          name: halal.certifier.name,
          logoUrl: halal.certifier.logoUrl,
        }
      : null,
    signals: halal.signals.map((s) => ({
      substanceId: s.substanceId,
      displayName: s.displayName,
      score: s.score,
      verdict: s.verdict as HalalReportV2["verdict"],
      scenarioKey: s.scenarioKey,
      rationaleFr: s.rationaleFr,
      rationaleAr: s.rationaleAr,
      madhabNote: s.madhabNote,
      fatwaCount: s.fatwaCount,
      dossierId: s.dossierId,
      icon: s.icon as any,
    })),
    madhabApplied: halal.madhabApplied,
    madhabDivergence: halal.madhabDivergence,
    hasFullDossier: halal.hasFullDossier,
    engineVersion: halal.engineVersion,
    analysisSourceLabel: halal.analysisSourceLabel,
  };

  // Map health data if available
  const healthSummary: HealthSummaryData | null = raw.health
    ? {
        nutriScore: (raw.health as any).nutriscoreGrade ?? null,
        novaGroup: (raw.health as any).novaGroup ?? null,
        additivesCount: (raw.health as any).additivesCount ?? 0,
        additivesHalalRelevant: (raw.health as any).additivesHalalRelevant ?? [],
      }
    : null;

  // Map personal alerts
  const personalAlerts: PersonalAlertV2[] = (raw.personal?.alerts ?? []).map((a) => ({
    type: a.type as PersonalAlertV2["type"],
    severity: a.severity as PersonalAlertV2["severity"],
    title: a.title,
    description: a.description,
    iconName: a.iconName,
  }));

  // Map boycott data
  const boycott: BoycottAlertData | null =
    raw.boycott && raw.boycott.isBoycotted
      ? {
          brandName: raw.boycott.brandName,
          reason: raw.boycott.reason,
          source: raw.boycott.source,
          sourceUrl: raw.boycott.sourceUrl,
          alternatives: raw.boycott.alternatives,
        }
      : null;

  return {
    product: raw.product,
    halalReport,
    healthSummary,
    personalAlerts,
    personalUpsellHint: raw.personal?.upsellHint ?? false,
    boycott,
    alternatives: [], // Phase 7
    traceSteps: [], // Trace data not yet in DTO — will come from backend later
    certifierTrustScores: null, // Will be added when certifier detail endpoint is wired
    certifierPractices: [], // Will be added when certifier detail endpoint is wired
    context: raw.context,
  };
}

// ── Hook ──

export function useScanV2(barcode: string) {
  const scanMutation = trpc.scan.scanBarcodeV2.useMutation({
    onSuccess: (_data, variables) => {
      trackEvent("scan_barcode_v2", { barcode: variables.barcode });
    },
  });

  const hasFired = useRef(false);
  const prevBarcode = useRef(barcode);

  // Reset on barcode change
  useEffect(() => {
    if (barcode !== prevBarcode.current) {
      prevBarcode.current = barcode;
      hasFired.current = false;
    }
  }, [barcode]);

  // Auto-fire on mount / barcode change
  useEffect(() => {
    if (barcode && !hasFired.current) {
      hasFired.current = true;
      scanMutation.mutate({ barcode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode]);

  const refetch = useCallback(
    (opts?: { nutritionProfile?: string; viewOnly?: boolean }) => {
      hasFired.current = false;
      scanMutation.reset();
      hasFired.current = true;
      scanMutation.mutate({
        barcode,
        viewOnly: opts?.viewOnly,
        nutritionProfile: opts?.nutritionProfile as any,
      });
    },
    [barcode, scanMutation],
  );

  // Map raw response to V2 types
  const data: ScanV2Data | null = scanMutation.data
    ? mapResponseToV2(scanMutation.data as unknown as ScanV2RawResponse)
    : null;

  return {
    data,
    rawData: scanMutation.data,
    isLoading: scanMutation.isPending,
    isSuccess: scanMutation.isSuccess,
    error: scanMutation.error,
    refetch,
  };
}
